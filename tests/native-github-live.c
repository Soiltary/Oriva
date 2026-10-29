/* Real public HTTPS acceptance only. No application entry, profile, tray or
   installer is invoked. The caller supplies a fresh workspace-only root. */
#ifndef UNICODE
#define UNICODE
#endif
#define _UNICODE
#define COBJMACROS
#include <windows.h>
#include <stdio.h>
#include "native-check.h"
static wchar_t liveRoot[32768];
static DWORD liveEnvironment(const wchar_t*name,wchar_t*out,DWORD capacity){if(!wcscmp(name,L"LOCALAPPDATA")){DWORD n=(DWORD)wcslen(liveRoot);if(n>=capacity)return n+1;wcscpy(out,liveRoot);return n;}return GetEnvironmentVariableW(name,out,capacity);}
#define GetEnvironmentVariableW liveEnvironment
#define wWinMain orivaEntryNotCalled
#include "../desktop/windows/Oriva.c"
#undef wWinMain
#undef GetEnvironmentVariableW
int wmain(int argc,wchar_t**argv){
 assert(argc==3);wchar_t cwd[32768];assert(GetCurrentDirectoryW(32768,cwd)&&GetFullPathNameW(argv[1],32768,liveRoot,NULL));size_t n=wcslen(cwd);assert(!wcsncmp(liveRoot,cwd,n)&&liveRoot[n]==L'\\'&&!wcsstr(liveRoot,L"..")&&wcsstr(liveRoot,L"\\case-"));assert(CreateDirectoryW(liveRoot,NULL));
 BOOL preview=!wcscmp(argv[2],L"preview");assert(preview||!wcscmp(argv[2],L"stable"));const wchar_t*path=preview?OG_REPO L"/releases/428126164":OG_LATEST;
 char*page=ogText(path,FALSE,2*1024*1024,0,NULL);assert(page);OGRelease release;assert(ogReleaseParse(page,!preview,&release));free(page);
 char*manifest=ogText(release.manifest.path,TRUE,65536,release.manifest.size,release.manifest.hash);assert(manifest);OGUpdate offer;assert(ogManifestParse(manifest,&release,&offer));free(manifest);
 assert(!wcscmp(offer.version,L"1.0.0")&&!wcscmp(offer.sequence,L"2.0.0"));wcscpy(updatePath,offer.exe.path);wcscpy(updateHash,offer.exe.hash);updateSize=offer.exe.size;
 assert(updateDownloadFile()&&updateFileHash(updateStage,offer.exe.hash));
 wchar_t proof[32768];swprintf(proof,32768,L"%ls\\public-download.json",liveRoot);FILE*f=_wfopen(proof,L"wb");assert(f);fprintf(f,"{\"passed\":true,\"mode\":\"%s\",\"exeSize\":%llu,\"exeSha256\":\"%ls\",\"actualWinHttp\":true,\"profileScope\":\"fresh workspace fixture\",\"installerInvoked\":false}\n",preview?"preview":"stable",(unsigned long long)offer.exe.size,offer.exe.hash);fclose(f);
 puts(preview?"PASS actual anonymous GitHub preview metadata/manifest/CDN/executable WinHTTP and exact hash; not Stable discovery":"PASS actual anonymous GitHub Stable discovery/manifest/CDN/executable WinHTTP and exact hash");return 0;
}
