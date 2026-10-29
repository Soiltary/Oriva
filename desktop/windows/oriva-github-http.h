#ifndef ORIVA_GITHUB_HTTP_H
#define ORIVA_GITHUB_HTTP_H
#include <winhttp.h>
#include "oriva-github-release.h"
typedef BOOL (*OGSink)(void*,const BYTE*,DWORD);
static BOOL ogApiPath(const wchar_t*p){
 if(!p)return FALSE;if(!wcscmp(p,OG_LATEST))return TRUE;
 const wchar_t*prefixes[]={OG_REPO L"/releases/assets/",OG_REPO L"/releases/"};
 for(int i=0;i<2;i++){size_t n=wcslen(prefixes[i]);if(wcsncmp(p,prefixes[i],n)||!p[n])continue;const wchar_t*q=p+n;for(;*q;q++)if(*q<L'0'||*q>L'9')break;if(!*q&&wcslen(p+n)<=16&&p[n]!=L'0')return TRUE;}
 return FALSE;
}
/* One explicit API -> GitHub-owned release CDN redirect. Never automatic
   redirects, userinfo, HTTP, alternate ports, arbitrary repositories or hosts. */
static BOOL ogCdnUrl(const wchar_t*url,wchar_t*path,size_t capacity){
 const wchar_t*prefix=L"https://release-assets.githubusercontent.com/github-production-release-asset/1431547070/";
 size_t n=wcslen(prefix);if(!url||wcsncmp(url,prefix,n)||!url[n]||wcslen(url)>=8192)return FALSE;
 const wchar_t*p=url+n;for(;*p&&*p!=L'?';p++)if(!((*p>=L'a'&&*p<=L'z')||(*p>=L'A'&&*p<=L'Z')||(*p>=L'0'&&*p<=L'9')||*p==L'-'))return FALSE;
 if(p==url+n)return FALSE;for(const wchar_t*q=url;*q;q++)if(*q<33||*q>126||*q==L'#'||*q==L'\\')return FALSE;
 const wchar_t*relative=wcschr(url+8,L'/');if(!relative||wcslen(relative)>=capacity)return FALSE;wcscpy(path,relative);return TRUE;
}
static BOOL ogTransfer(const wchar_t*apiPath,BOOL binary,uint64_t limit,OGSink sink,void*context,uint64_t*received){
 if(!ogApiPath(apiPath)||!limit||!sink)return FALSE;BOOL ok=FALSE;uint64_t total=0;HINTERNET session=NULL,connection=NULL,request=NULL;
 wchar_t*path=calloc(8192,sizeof(wchar_t));if(!path)return FALSE;wcscpy(path,apiPath);
 session=WinHttpOpen(L"Oriva Public Updater/1.0",WINHTTP_ACCESS_TYPE_AUTOMATIC_PROXY,WINHTTP_NO_PROXY_NAME,WINHTTP_NO_PROXY_BYPASS,0);if(!session)goto done;
 if(!WinHttpSetTimeouts(session,10000,10000,binary?180000:20000,binary?180000:20000))goto done;
 for(int hop=0;hop<2;hop++){
  connection=WinHttpConnect(session,hop?L"release-assets.githubusercontent.com":L"api.github.com",INTERNET_DEFAULT_HTTPS_PORT,0);if(!connection)goto done;
  request=WinHttpOpenRequest(connection,L"GET",path,NULL,WINHTTP_NO_REFERER,WINHTTP_DEFAULT_ACCEPT_TYPES,WINHTTP_FLAG_SECURE);if(!request)goto done;
  DWORD redirects=WINHTTP_OPTION_REDIRECT_POLICY_NEVER,disabled=WINHTTP_DISABLE_COOKIES|WINHTTP_DISABLE_AUTHENTICATION,logon=WINHTTP_AUTOLOGON_SECURITY_LEVEL_HIGH;
  if(!WinHttpSetOption(request,WINHTTP_OPTION_REDIRECT_POLICY,&redirects,sizeof(redirects))||!WinHttpSetOption(request,WINHTTP_OPTION_DISABLE_FEATURE,&disabled,sizeof(disabled))||!WinHttpSetOption(request,WINHTTP_OPTION_AUTOLOGON_POLICY,&logon,sizeof(logon)))goto done;
  const wchar_t*headers=binary?L"Accept: application/octet-stream\r\nX-GitHub-Api-Version: 2022-11-28\r\nCache-Control: no-cache\r\n":L"Accept: application/vnd.github+json\r\nX-GitHub-Api-Version: 2022-11-28\r\nCache-Control: no-cache\r\n";
  if(!WinHttpSendRequest(request,headers,(DWORD)-1L,NULL,0,0,0)||!WinHttpReceiveResponse(request,NULL))goto done;
  DWORD code=0,n=sizeof(code);if(!WinHttpQueryHeaders(request,WINHTTP_QUERY_STATUS_CODE|WINHTTP_QUERY_FLAG_NUMBER,WINHTTP_HEADER_NAME_BY_INDEX,&code,&n,WINHTTP_NO_HEADER_INDEX))goto done;
  if(code==302&&binary&&hop==0){wchar_t*location=calloc(8192,sizeof(wchar_t));if(!location)goto done;n=8192*sizeof(wchar_t);BOOL allowed=WinHttpQueryHeaders(request,WINHTTP_QUERY_LOCATION,WINHTTP_HEADER_NAME_BY_INDEX,location,&n,WINHTTP_NO_HEADER_INDEX)&&ogCdnUrl(location,path,8192);free(location);if(!allowed)goto done;WinHttpCloseHandle(request);request=NULL;WinHttpCloseHandle(connection);connection=NULL;continue;}
  if(code!=200)goto done;
  for(;;){BYTE buffer[65536];DWORD count=0;if(!WinHttpReadData(request,buffer,sizeof(buffer),&count))goto done;if(!count)break;if(count>limit-total||!sink(context,buffer,count))goto done;total+=count;}
  ok=TRUE;break;
 }
 done:if(request)WinHttpCloseHandle(request);if(connection)WinHttpCloseHandle(connection);if(session)WinHttpCloseHandle(session);free(path);if(received)*received=total;return ok;
}
typedef struct {char*data;size_t used,capacity;} OGMemory;
static BOOL ogMemoryWrite(void*context,const BYTE*bytes,DWORD count){OGMemory*m=context;if(count>m->capacity-m->used||memchr(bytes,0,count))return FALSE;memcpy(m->data+m->used,bytes,count);m->used+=count;m->data[m->used]=0;return TRUE;}
static char*ogText(const wchar_t*path,BOOL binary,size_t limit,uint64_t expected,const wchar_t*hash){
 OGMemory m={calloc(limit+1,1),0,limit};if(!m.data)return NULL;
 if(!ogTransfer(path,binary,limit,ogMemoryWrite,&m,NULL)||!m.used||(expected&&m.used!=expected)){free(m.data);return NULL;}
 if(hash){HCRYPTPROV provider=0;HCRYPTHASH h=0;BYTE digest[32];DWORD size=32;BOOL ok=FALSE;wchar_t actual[65];
  if(CryptAcquireContextW(&provider,NULL,NULL,PROV_RSA_AES,CRYPT_VERIFYCONTEXT)&&CryptCreateHash(provider,CALG_SHA_256,0,0,&h)&&CryptHashData(h,(BYTE*)m.data,(DWORD)m.used,0)&&CryptGetHashParam(h,HP_HASHVAL,digest,&size,0)&&size==32){for(int i=0;i<32;i++)swprintf(actual+i*2,3,L"%02x",digest[i]);actual[64]=0;ok=!_wcsicmp(actual,hash);}
  if(h)CryptDestroyHash(h);if(provider)CryptReleaseContext(provider,0);if(!ok){free(m.data);return NULL;}
 }return m.data;
}
static BOOL ogLatestUpdate(OGUpdate*out){char*metadata=ogText(OG_LATEST,FALSE,2*1024*1024,0,NULL);if(!metadata)return FALSE;OGRelease release;BOOL valid=ogReleaseParse(metadata,TRUE,&release);free(metadata);if(!valid)return FALSE;char*manifest=ogText(release.manifest.path,TRUE,65536,release.manifest.size,release.manifest.hash);if(!manifest)return FALSE;valid=ogManifestParse(manifest,&release,out);free(manifest);return valid;}
#endif
