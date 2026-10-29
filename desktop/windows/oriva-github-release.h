#ifndef ORIVA_GITHUB_RELEASE_H
#define ORIVA_GITHUB_RELEASE_H
#include "oriva-json.h"
#include "oriva-update-core.h"
#define OG_REPO L"/repos/Soiltary/Oriva"
#define OG_LATEST OG_REPO L"/releases/latest"
#define OG_MAX_EXE (20u*1024u*1024u)
typedef struct {uint64_t id,size;wchar_t hash[65],path[128];} OGAsset;
typedef struct {wchar_t tag[44];OGAsset manifest,exe;} OGRelease;
typedef struct {wchar_t version[40],sequence[40];OGAsset exe;} OGUpdate;
static int ogUpdateNewer(const OGUpdate*u,const wchar_t*product,const wchar_t*sequence){return !updateIsNewer(product,u->version)&&updateIsNewer(u->sequence,sequence);}
/* Required keys are unique. Ambiguous JSON must never select executable bytes. */
static int ogField(const char*s,const OJToken*t,int object,const char*key){
 if(object<0||t[object].type!='{')return -1;int found=-1;
 for(int i=object+1;i<t[object].next;){int v=i+1;if(v>=t[object].next)return -1;
  /* GitHub/schema keys are plain ASCII. Reject escaped aliases instead of
     allowing another parser to interpret a duplicate differently. */
  if(memchr(s+t[i].start,'\\',(size_t)(t[i].end-t[i].start)))return -1;
  if(t[i].end-t[i].start==(int)strlen(key)+2&&!memcmp(s+t[i].start+1,key,strlen(key))){if(found>=0)return -1;found=v;}i=t[v].next;
 }return found;
}
static wchar_t*ogString(const char*s,const OJToken*t,int o,const char*key){
 int at=ogField(s,t,o,key);if(at<0||t[at].type!='"')return NULL;
 for(int i=t[at].start;i+5<t[at].end;i++)if(s[i]=='\\'&&s[i+1]=='u'&&!memcmp(s+i+2,"0000",4))return NULL;
 wchar_t*v=ojWide(s,t,at);if(v)for(wchar_t*p=v;*p;p++)if(*p<32){free(v);return NULL;}return v;
}
static int ogFalse(const char*s,const OJToken*t,int o,const char*key){int a=ogField(s,t,o,key);return a>=0&&t[a].end-t[a].start==5&&!memcmp(s+t[a].start,"false",5);}
static int ogUInt(const char*s,const OJToken*t,int o,const char*key,uint64_t max,uint64_t*out){
 int a=ogField(s,t,o,key);if(a<0||t[a].start==t[a].end)return 0;uint64_t v=0;
 for(int i=t[a].start;i<t[a].end;i++){unsigned d=(unsigned)(s[i]-'0');if(d>9||d>max||v>(max-d)/10)return 0;v=v*10+d;}
 if(!v||v>max)return 0;*out=v;return 1;
}
static int ogVersion(const wchar_t*v){unsigned p[4];wchar_t canonical[40];if(!updateVersionParts(v,p)||p[3])return 0;swprintf(canonical,40,L"%u.%u.%u",p[0],p[1],p[2]);return !wcscmp(v,canonical);}
static int ogAsset(const char*s,const OJToken*t,int o,uint64_t max,OGAsset*out){
 OGAsset a={0};wchar_t*state=ogString(s,t,o,"state"),*digest=ogString(s,t,o,"digest"),*url=ogString(s,t,o,"url");int ok=0;
 if(!state||wcscmp(state,L"uploaded")||!digest||wcsncmp(digest,L"sha256:",7)||!updateHex64(digest+7)||!url)goto done;
 if(!ogUInt(s,t,o,"id",9007199254740991ULL,&a.id)||!ogUInt(s,t,o,"size",max,&a.size))goto done;
 swprintf(a.path,128,OG_REPO L"/releases/assets/%llu",(unsigned long long)a.id);
 wchar_t expected[180];swprintf(expected,180,L"https://api.github.com%ls",a.path);if(wcscmp(url,expected))goto done;
 wcscpy(a.hash,digest+7);*out=a;ok=1;
 done:free(state);free(digest);free(url);return ok;
}
static int ogReleaseParse(const char*s,int requireStable,OGRelease*out){
 int count=0,ok=0;OJToken*t=ojParse(s,&count);if(!t||!count||t[0].type!='{'){free(t);return 0;}OGRelease r={0};
 wchar_t*tag=ogString(s,t,0,"tag_name"),*published=ogString(s,t,0,"published_at");
 if(!ogFalse(s,t,0,"draft")||(requireStable&&!ogFalse(s,t,0,"prerelease"))||!tag||tag[0]!=L'v'||!ogVersion(tag+1)||!published||!*published)goto done;
 if(wcslen(tag)>=44)goto done;wcscpy(r.tag,tag);int assets=ogField(s,t,0,"assets"),manifests=0,executables=0;
 if(assets<0||t[assets].type!='[')goto done;
 for(int i=assets+1;i<t[assets].next;i=t[i].next){wchar_t*name=ogString(s,t,i,"name");if(!name)goto done;
  if(!wcscmp(name,L"windows-update.json")){manifests++;if(!ogAsset(s,t,i,65536,&r.manifest)){free(name);goto done;}}
  if(!wcscmp(name,L"Oriva.exe")){executables++;if(!ogAsset(s,t,i,OG_MAX_EXE,&r.exe)){free(name);goto done;}}
  free(name);
 }
 if(manifests!=1||executables!=1||r.manifest.id==r.exe.id)goto done;*out=r;ok=1;
 done:free(tag);free(published);free(t);return ok;
}
static int ogManifestParse(const char*s,const OGRelease*r,OGUpdate*out){
 int count=0,ok=0;OJToken*t=ojParse(s,&count);if(!t||!count||t[0].type!='{'){free(t);return 0;}
 wchar_t*v=ogString(s,t,0,"version"),*seq=ogString(s,t,0,"updateVersion"),*name=ogString(s,t,0,"assetName"),*hash=ogString(s,t,0,"sha256");uint64_t size=0,schema=0;
 if(!v||!seq||!name||wcscmp(name,L"Oriva.exe")||!hash||!updateHex64(hash)||!ogVersion(v)||!ogVersion(seq)||wcslen(v)>=40||wcslen(seq)>=40)goto done;
 if(wcscmp(v,r->tag+1)||_wcsicmp(hash,r->exe.hash)||!ogUInt(s,t,0,"size",OG_MAX_EXE,&size)||size!=r->exe.size||!ogUInt(s,t,0,"schemaVersion",1,&schema))goto done;
 /* Public product reset never resets the internal ordering floor. */
 if(updateIsNewer(L"2.0.0",seq))goto done;
 wcscpy(out->version,v);wcscpy(out->sequence,seq);out->exe=r->exe;ok=1;
 done:free(v);free(seq);free(name);free(hash);free(t);return ok;
}
#endif
