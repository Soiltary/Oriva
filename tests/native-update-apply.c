#define UNICODE
#define _UNICODE
#include <windows.h>
#include <shellapi.h>
#include <winhttp.h>
#include <wincrypt.h>
#include <stdio.h>
#include <stdlib.h>
#include <wchar.h>
#include <assert.h>
#include "native-check.h"
#include "../desktop/windows/oriva-version.h"
#include "../desktop/windows/oriva-text.h"
#include "../desktop/windows/oriva-json.h"
static wchar_t qaRoot[32768];static int qaFailLaunch,qaLaunchCount;
static HWND window;static BOOL signedIn,libraryView,busy,libraryDialogOpen;static int action;static wchar_t pending[32768];
static void status(const wchar_t*s){(void)s;}
static void start(int job){(void)job;assert(!"Network/application worker must not run in this fixture");}
static char*requestMethod(const wchar_t*a,const wchar_t*b,const char*c,const wchar_t*d,DWORD*e){(void)a;(void)b;(void)c;(void)d;(void)e;assert(!"No network in updater filesystem fixture");return NULL;}
static int orivaMessageBox(HWND h,const wchar_t*a,const wchar_t*b,UINT c){(void)h;(void)a;(void)b;(void)c;return IDOK;}
static DWORD qaEnvironment(const wchar_t*name,wchar_t*out,DWORD cap){if(!wcscmp(name,L"LOCALAPPDATA")){DWORD n=(DWORD)wcslen(qaRoot);if(n>=cap)return n+1;wcscpy(out,qaRoot);return n;}return GetEnvironmentVariableW(name,out,cap);}
static HINSTANCE qaLaunch(HWND h,const wchar_t*verb,const wchar_t*target,const wchar_t*args,const wchar_t*folder,int show){
 (void)h;(void)verb;(void)folder;(void)show;qaLaunchCount++;if(qaFailLaunch){qaFailLaunch--;return (HINSTANCE)(INT_PTR)5;}
 assert(!wcsncmp(target,qaRoot,wcslen(qaRoot))&&!wcscmp(args,L"--library"));
 wchar_t command[32768];swprintf(command,32768,L"\"%ls\" --library",target);STARTUPINFOW si={sizeof(si)};si.dwFlags=STARTF_USESHOWWINDOW;si.wShowWindow=SW_HIDE;PROCESS_INFORMATION pi={0};
 if(!CreateProcessW(target,command,NULL,NULL,FALSE,0,NULL,qaRoot,&si,&pi))return (HINSTANCE)(INT_PTR)5;
 assert(WaitForSingleObject(pi.hProcess,10000)==WAIT_OBJECT_0);DWORD exitCode;assert(GetExitCodeProcess(pi.hProcess,&exitCode)&&exitCode==0);CloseHandle(pi.hProcess);CloseHandle(pi.hThread);return (HINSTANCE)(INT_PTR)33;
}
#define GetEnvironmentVariableW qaEnvironment
#define ShellExecuteW qaLaunch
#include "../desktop/windows/oriva-update.h"
#undef GetEnvironmentVariableW
#undef ShellExecuteW
static void digest(const wchar_t*path,wchar_t*out){HANDLE f=CreateFileW(path,GENERIC_READ,FILE_SHARE_READ,NULL,OPEN_EXISTING,0,NULL);assert(f!=INVALID_HANDLE_VALUE);HCRYPTPROV p;HCRYPTHASH hash;assert(CryptAcquireContextW(&p,NULL,NULL,PROV_RSA_AES,CRYPT_VERIFYCONTEXT)&&CryptCreateHash(p,CALG_SHA_256,0,0,&hash));BYTE buffer[65536],value[32];DWORD n;for(;;){assert(ReadFile(f,buffer,sizeof(buffer),&n,NULL));if(!n)break;assert(CryptHashData(hash,buffer,n,0));}n=32;assert(CryptGetHashParam(hash,HP_HASHVAL,value,&n,0));for(int i=0;i<32;i++)swprintf(out+i*2,3,L"%02x",value[i]);out[64]=0;CryptDestroyHash(hash);CryptReleaseContext(p,0);CloseHandle(f);}
static void marker(const wchar_t*path,const char*text){HANDLE f=CreateFileW(path,GENERIC_WRITE,0,NULL,CREATE_NEW,FILE_ATTRIBUTE_NORMAL,NULL);assert(f!=INVALID_HANDLE_VALUE);DWORD written;assert(WriteFile(f,text,(DWORD)strlen(text),&written,NULL)&&written==strlen(text));CloseHandle(f);}
int wmain(int argc,wchar_t**argv){
 if(argc==2&&!wcscmp(argv[1],L"--library")){wchar_t root[32768],path[32768];assert(GetEnvironmentVariableW(L"ORIVA_QA_ROOT",root,32768));swprintf(path,32768,L"%ls\\launched.txt",root);HANDLE f=CreateFileW(path,GENERIC_WRITE,0,NULL,CREATE_ALWAYS,FILE_ATTRIBUTE_NORMAL,NULL);assert(f!=INVALID_HANDLE_VALUE);DWORD n;WriteFile(f,"synthetic relaunch",18,&n,NULL);CloseHandle(f);return 0;}
 assert(argc==2);wchar_t cwd[32768],normalized[32768];assert(GetCurrentDirectoryW(32768,cwd));assert(GetFullPathNameW(argv[1],32768,normalized,NULL));size_t base=wcslen(cwd);assert(!wcsncmp(normalized,cwd,base)&&normalized[base]==L'\\'&&!wcsstr(normalized,L"..")&&wcsstr(normalized,L"\\case-"));assert(CreateDirectoryW(normalized,NULL));wcscpy(qaRoot,normalized);assert(SetEnvironmentVariableW(L"ORIVA_QA_ROOT",qaRoot));
 wchar_t target[32768],folder[32768],module[32768],backup[32768],settings[32768],ownHash[65],oldHash[65],actual[65];swprintf(folder,32768,L"%ls\\Programs",qaRoot);assert(CreateDirectoryW(folder,NULL));swprintf(folder,32768,L"%ls\\Programs\\Oriva",qaRoot);assert(CreateDirectoryW(folder,NULL));assert(updateDirectories(target,folder));GetModuleFileNameW(NULL,module,32768);assert(CopyFileW(module,target,TRUE));HANDLE f=CreateFileW(target,FILE_APPEND_DATA,0,NULL,OPEN_EXISTING,0,NULL);assert(f!=INVALID_HANDLE_VALUE);DWORD n;assert(WriteFile(f,"old synthetic build",19,&n,NULL));CloseHandle(f);digest(module,ownHash);digest(target,oldHash);assert(wcscmp(ownHash,oldHash));swprintf(settings,32768,L"%ls\\synthetic-settings.txt",qaRoot);marker(settings,"preserve settings");
 wchar_t*arguments[]={module,L"--apply-update",L"4294967294",target,ownHash};
 wchar_t wrong[65];for(int i=0;i<64;i++)wrong[i]=L'0';wrong[64]=0;arguments[4]=wrong;assert(updateApply(5,arguments)!=0);digest(target,actual);assert(!wcscmp(actual,oldHash)&&qaLaunchCount==0);arguments[4]=ownHash;
 assert(updateApply(5,arguments)==0);digest(target,actual);assert(!wcscmp(actual,ownHash)&&qaLaunchCount==1);swprintf(backup,32768,L"%ls.previous.exe",target);digest(backup,actual);assert(!wcscmp(actual,oldHash));
 // Reproduce launch failure after verified replacement. It must report failure
 // and restore the previous bytes, rather than silently returning success.
 assert(CopyFileW(backup,target,FALSE));qaFailLaunch=1;assert(updateApply(5,arguments)!=0);digest(target,actual);assert(!wcscmp(actual,oldHash));assert(qaLaunchCount==3);
 HANDLE settingsFile=CreateFileW(settings,GENERIC_READ,FILE_SHARE_READ,NULL,OPEN_EXISTING,0,NULL);assert(settingsFile!=INVALID_HANDLE_VALUE);char contents[32]={0};assert(ReadFile(settingsFile,contents,31,&n,NULL)&&n==17&&!strcmp(contents,"preserve settings"));CloseHandle(settingsFile);
 puts("PASS actual updater filesystem/hash/replacement/previous-copy plus synthetic process relaunch, launch-failure rollback and settings preservation; fresh workspace profile only, no app startup/registry/network/installer");return 0;
}
