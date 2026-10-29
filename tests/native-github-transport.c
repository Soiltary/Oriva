#ifndef UNICODE
#define UNICODE
#endif
#define _UNICODE
#define COBJMACROS
#include <windows.h>
#include <winhttp.h>
#include <wincrypt.h>
#include <stdio.h>
#include "native-check.h"
typedef struct {DWORD code;const wchar_t*location;const char*body;DWORD length;BOOL broken;} TestResponse;
static TestResponse replies[4];static int requests,options,headersChecked,closed;static DWORD cursor;
static HINTERNET testOpen(LPCWSTR a,DWORD b,LPCWSTR c,LPCWSTR d,DWORD e){(void)a;(void)b;(void)c;(void)d;(void)e;return (HINTERNET)1;}
static BOOL testTimeouts(HINTERNET h,int a,int b,int c,int d){(void)h;return a>0&&b>0&&c>0&&d>0;}
static HINTERNET testConnect(HINTERNET h,LPCWSTR host,INTERNET_PORT port,DWORD flags){(void)h;(void)flags;assert(port==443);assert(!wcscmp(host,requests?L"release-assets.githubusercontent.com":L"api.github.com")||!wcscmp(host,L"api.github.com"));return (HINTERNET)2;}
static HINTERNET testRequest(HINTERNET h,LPCWSTR method,LPCWSTR path,LPCWSTR version,LPCWSTR ref,LPCWSTR*types,DWORD flags){(void)h;(void)version;(void)types;assert(!wcscmp(method,L"GET")&&path&&ref==NULL&&flags==WINHTTP_FLAG_SECURE);assert(requests<4);requests++;cursor=0;return (HINTERNET)3;}
static BOOL testOption(HINTERNET h,DWORD option,LPVOID value,DWORD length){(void)h;assert(length==sizeof(DWORD));DWORD v=*(DWORD*)value;
 if(option==WINHTTP_OPTION_REDIRECT_POLICY)assert(v==WINHTTP_OPTION_REDIRECT_POLICY_NEVER);
 else if(option==WINHTTP_OPTION_DISABLE_FEATURE)assert(v==(WINHTTP_DISABLE_COOKIES|WINHTTP_DISABLE_AUTHENTICATION));
 else if(option==WINHTTP_OPTION_AUTOLOGON_POLICY)assert(v==WINHTTP_AUTOLOGON_SECURITY_LEVEL_HIGH);
 else assert(!"Unexpected security option");options++;return TRUE;
}
static BOOL testSend(HINTERNET h,LPCWSTR headers,DWORD length,LPVOID data,DWORD bytes,DWORD total,DWORD_PTR context){(void)h;(void)length;(void)context;assert(!data&&!bytes&&!total);assert(wcsstr(headers,L"Accept:")&&!wcsstr(headers,L"Cookie")&&!wcsstr(headers,L"Authorization")&&!wcsstr(headers,L"Origin"));headersChecked++;return TRUE;}
static BOOL testReceive(HINTERNET h,LPVOID p){(void)h;(void)p;return TRUE;}
static BOOL testQuery(HINTERNET h,DWORD query,LPCWSTR name,LPVOID out,LPDWORD size,LPDWORD index){(void)h;(void)name;(void)index;TestResponse*r=&replies[requests-1];
 if(query&WINHTTP_QUERY_FLAG_NUMBER){*(DWORD*)out=r->code;return TRUE;}
 assert(query==WINHTTP_QUERY_LOCATION);if(!r->location)return FALSE;DWORD needed=(DWORD)((wcslen(r->location)+1)*sizeof(wchar_t));if(*size<needed)return FALSE;memcpy(out,r->location,needed);*size=needed;return TRUE;
}
static BOOL testRead(HINTERNET h,LPVOID out,DWORD capacity,LPDWORD got){(void)h;TestResponse*r=&replies[requests-1];if(r->broken)return FALSE;DWORD left=r->length-cursor;*got=left<capacity?left:capacity;if(*got){memcpy(out,r->body+cursor,*got);cursor+=*got;}return TRUE;}
static BOOL testClose(HINTERNET h){(void)h;closed++;return TRUE;}
#define WinHttpOpen testOpen
#define WinHttpSetTimeouts testTimeouts
#define WinHttpConnect testConnect
#define WinHttpOpenRequest testRequest
#define WinHttpSetOption testOption
#define WinHttpSendRequest testSend
#define WinHttpReceiveResponse testReceive
#define WinHttpQueryHeaders testQuery
#define WinHttpReadData testRead
#define WinHttpCloseHandle testClose
/* Invoke actual updater entry points. Application entry/profile/installer never run. */
#define wWinMain orivaEntryNotCalled
#include "../desktop/windows/Oriva.c"
#undef wWinMain
static const wchar_t*asset=OG_REPO L"/releases/assets/12";
static const wchar_t*cdn=L"https://release-assets.githubusercontent.com/github-production-release-asset/1431547070/abc-123?signature=synthetic";
static const wchar_t*abcHash=L"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
static void reset(void){memset(replies,0,sizeof(replies));requests=options=headersChecked=closed=0;cursor=0;}
static void direct(const char*s,DWORD n){reset();replies[0]=(TestResponse){200,NULL,s,n,FALSE};}
static void rejectedRedirect(const wchar_t*url){reset();replies[0]=(TestResponse){302,url,NULL,0,FALSE};char*s=ogText(asset,TRUE,32,3,abcHash);assert(!s&&requests==1&&closed==3);}
static void sha(const char*s,wchar_t*out){HCRYPTPROV p;HCRYPTHASH h;BYTE bytes[32];DWORD n=32;assert(CryptAcquireContextW(&p,NULL,NULL,PROV_RSA_AES,CRYPT_VERIFYCONTEXT)&&CryptCreateHash(p,CALG_SHA_256,0,0,&h)&&CryptHashData(h,(BYTE*)s,(DWORD)strlen(s),0)&&CryptGetHashParam(h,HP_HASHVAL,bytes,&n,0));for(int i=0;i<32;i++)swprintf(out+i*2,3,L"%02x",bytes[i]);out[64]=0;CryptDestroyHash(h);CryptReleaseContext(p,0);}
int wmain(int argc,wchar_t**argv){
 assert(argc==2);wchar_t cwd[32768],root[32768];assert(GetCurrentDirectoryW(32768,cwd)&&GetFullPathNameW(argv[1],32768,root,NULL));size_t base=wcslen(cwd);assert(!wcsncmp(root,cwd,base)&&root[base]==L'\\'&&wcsstr(root,L"\\case-")&&!wcsstr(root,L".."));assert(CreateDirectoryW(root,NULL));assert(SetEnvironmentVariableW(L"LOCALAPPDATA",root));
 wchar_t parsed[8192];assert(ogApiPath(OG_LATEST)&&ogApiPath(asset));assert(!ogApiPath(L"/repos/evil/Oriva/releases/latest")&&!ogApiPath(L"/repos/Soiltary/Oriva/releases/assets/12?x=1"));assert(ogCdnUrl(cdn,parsed,8192));
 direct("abc",3);char*s=ogText(asset,TRUE,32,3,abcHash);assert(s&&!strcmp(s,"abc")&&requests==1&&options==3&&headersChecked==1&&closed==3);free(s);
 reset();replies[0]=(TestResponse){302,cdn,NULL,0,FALSE};replies[1]=(TestResponse){200,NULL,"abc",3,FALSE};s=ogText(asset,TRUE,32,3,abcHash);assert(s&&requests==2&&options==6&&headersChecked==2&&closed==5);free(s);
 rejectedRedirect(L"http://release-assets.githubusercontent.com/github-production-release-asset/1431547070/abc");
 rejectedRedirect(L"https://release-assets.githubusercontent.com.evil.test/github-production-release-asset/1431547070/abc");
 rejectedRedirect(L"https://release-assets.githubusercontent.com:444/github-production-release-asset/1431547070/abc");
 rejectedRedirect(L"https://release-assets.githubusercontent.com/github-production-release-asset/999/abc");
 rejectedRedirect(L"https://release-assets.githubusercontent.com/github-production-release-asset/1431547070/../abc");
 rejectedRedirect(L"https://api.github.com/repos/Soiltary/Oriva/releases/assets/13");rejectedRedirect(L"https://evil.test/abc");
 reset();replies[0]=(TestResponse){302,cdn,NULL,0,FALSE};replies[1]=(TestResponse){302,cdn,NULL,0,FALSE};assert(!ogText(asset,TRUE,32,3,abcHash)&&requests==2);
 direct("abc",3);replies[0].code=404;assert(!ogText(asset,TRUE,32,3,abcHash));direct("abc",3);replies[0].broken=TRUE;assert(!ogText(asset,TRUE,32,3,abcHash));
 direct("abc",3);assert(!ogText(asset,TRUE,2,3,abcHash));direct("ab",2);assert(!ogText(asset,TRUE,32,3,abcHash));direct("bad",3);assert(!ogText(asset,TRUE,32,3,abcHash));direct("a\0b",3);assert(!ogText(asset,TRUE,32,3,abcHash));
 const char*manifest="{\"schemaVersion\":1,\"version\":\"1.0.1\",\"updateVersion\":\"2.0.1\",\"assetName\":\"Oriva.exe\",\"sha256\":\"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad\",\"size\":3}";wchar_t manifestHash[65];sha(manifest,manifestHash);char hash[65];for(int i=0;i<65;i++)hash[i]=(char)manifestHash[i];char page[2048];snprintf(page,sizeof(page),"{\"draft\":false,\"prerelease\":false,\"published_at\":\"2026-10-29\",\"tag_name\":\"v1.0.1\",\"assets\":[{\"name\":\"windows-update.json\",\"id\":11,\"size\":%zu,\"state\":\"uploaded\",\"digest\":\"sha256:%s\",\"url\":\"https://api.github.com/repos/Soiltary/Oriva/releases/assets/11\"},{\"name\":\"Oriva.exe\",\"id\":12,\"size\":3,\"state\":\"uploaded\",\"digest\":\"sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad\",\"url\":\"https://api.github.com/repos/Soiltary/Oriva/releases/assets/12\"}]}",strlen(manifest),hash);
 reset();replies[0]=(TestResponse){200,NULL,page,(DWORD)strlen(page),FALSE};replies[1]=(TestResponse){200,NULL,manifest,(DWORD)strlen(manifest),FALSE};updateAvailable=FALSE;updateCheckWorker();assert(updateAvailable&&!wcscmp(updateVersion,L"1.0.1")&&!wcscmp(updatePath,asset)&&updateSize==3&&headersChecked==2);
 direct("abc",3);assert(updateDownloadFile()&&updateFileHash(updateStage,abcHash));assert(DeleteFileW(updateStage));
 direct("bad",3);assert(!updateDownloadFile()&&GetFileAttributesW(updateStage)==INVALID_FILE_ATTRIBUTES);wchar_t partial[32768];swprintf(partial,32768,L"%ls\\Oriva\\Updates\\Oriva-update.part",root);assert(GetFileAttributesW(partial)==INVALID_FILE_ATTRIBUTES);
 direct("abcd",4);assert(!updateDownloadFile()&&GetFileAttributesW(partial)==INVALID_FILE_ATTRIBUTES);
 reset();replies[0]=(TestResponse){404,NULL,NULL,0,FALSE};updateAvailable=FALSE;updateCheckWorker();assert(!updateAvailable);
 puts("PASS actual GitHub WinHTTP policy and updater entry points: no credentials/cookies, bounded CDN redirects, exact bytes/hash, cleanup, version detection; isolated fixture only");return 0;
}
