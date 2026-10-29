#ifndef ORIVA_UPDATE_H
#define ORIVA_UPDATE_H
#include "oriva-update-core.h"
#define UPDATE_CHECK 600
#define UPDATE_DOWNLOAD 601
#define UPDATE_FOUND (WM_APP+6)
#define UPDATE_READY (WM_APP+7)
static HWND updateButton;static BOOL updateAvailable=FALSE,updateQuiet=TRUE,updateChecked=FALSE,updateInstallRequested=FALSE,updateLaunchReady=FALSE;static wchar_t updateVersion[40],updatePath[256],updateHash[65],updateStage[32768];static ULONGLONG updateSize;static wchar_t updateChangelog[2001];
static BOOL updateDirectories(wchar_t*target,wchar_t*folder){wchar_t base[32768];DWORD n=GetEnvironmentVariableW(L"LOCALAPPDATA",base,32768);if(!n||n>32000)return FALSE;swprintf(target,32768,L"%ls\\Programs\\Oriva\\Oriva.exe",base);swprintf(folder,32768,L"%ls\\Oriva",base);CreateDirectoryW(folder,NULL);wcscat(folder,L"\\Updates");CreateDirectoryW(folder,NULL);return TRUE;}
static BOOL updateReadHash(const wchar_t*path,wchar_t*actual){HANDLE f=CreateFileW(path,GENERIC_READ,FILE_SHARE_READ,NULL,OPEN_EXISTING,FILE_FLAG_SEQUENTIAL_SCAN,NULL);if(f==INVALID_HANDLE_VALUE)return FALSE;HCRYPTPROV provider=0;HCRYPTHASH hash=0;BOOL ok=FALSE;BYTE digest[32],buffer[65536];DWORD n=0,size=32;if(!CryptAcquireContextW(&provider,NULL,NULL,PROV_RSA_AES,CRYPT_VERIFYCONTEXT)||!CryptCreateHash(provider,CALG_SHA_256,0,0,&hash))goto done;for(;;){if(!ReadFile(f,buffer,sizeof(buffer),&n,NULL))goto done;if(!n)break;if(!CryptHashData(hash,buffer,n,0))goto done;}if(!CryptGetHashParam(hash,HP_HASHVAL,digest,&size,0)||size!=32)goto done;for(int i=0;i<32;i++)swprintf(actual+i*2,3,L"%02x",digest[i]);actual[64]=0;ok=TRUE;done:if(hash)CryptDestroyHash(hash);if(provider)CryptReleaseContext(provider,0);CloseHandle(f);return ok;}
static BOOL updateFileHash(const wchar_t*path,const wchar_t*expected){wchar_t actual[65];return updateHex64(expected)&&updateReadHash(path,actual)&&!_wcsicmp(actual,expected);}
static void updateLayout(){if(!updateButton)return;RECT r;GetClientRect(window,&r);BOOL inLibrary=signedIn&&libraryView;MoveWindow(updateButton,inLibrary?r.right-530:360,inLibrary?42:33,inLibrary?175:166,40,TRUE);SetWindowTextW(updateButton,busy&&action==UPDATE_CHECK?tr(L"Checking updates..."):busy&&action==UPDATE_DOWNLOAD?tr(L"Getting update..."):updateAvailable?tr(L"Update available"):tr(L"Check updates"));ShowWindow(updateButton,SW_SHOW);EnableWindow(updateButton,!busy&&!libraryDialogOpen);}
static void updateNotify(){NOTIFYICONDATAW n={0};n.cbSize=sizeof(n);n.hWnd=window;n.uID=1;n.uFlags=NIF_INFO;wcscpy(n.szInfoTitle,tr(L"Oriva update available"));swprintf(n.szInfo,256,tr(L"Oriva %ls is ready. Open Oriva and click Update available to install it."),updateVersion);n.dwInfoFlags=NIIF_INFO;Shell_NotifyIconW(NIM_MODIFY,&n);}
static void updateOffer(){if(pending[0]){libraryDialogOpen=TRUE;orivaMessageBox(window,tr(L"Save or cancel the selected file before installing an update."),tr(L"Oriva update"),MB_OK|MB_ICONINFORMATION);libraryDialogOpen=FALSE;return;}wchar_t text[2800];swprintf(text,2800,tr(L"Oriva %ls is available.\n\nDownload and install this update now? Oriva will close and reopen. Your sign-in and saved library will be kept."),updateVersion);if(updateChangelog[0]){wcscat(text,L"\n\n");wcscat(text,updateChangelog);}libraryDialogOpen=TRUE;int answer=orivaMessageBox(window,text,tr(L"Update Oriva"),MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2);libraryDialogOpen=FALSE;if(answer==IDYES)updateInstallRequested=TRUE;}
static void updateCommand(){if(busy||libraryDialogOpen)return;if(updateAvailable){updateOffer();if(updateInstallRequested){updateInstallRequested=FALSE;start(UPDATE_DOWNLOAD);}}else{updateQuiet=FALSE;start(UPDATE_CHECK);}}
#include "oriva-github-http.h"
static void updateCheckWorker(){
 OGUpdate offer;BOOL valid=ogLatestUpdate(&offer);
 if(valid&&ogUpdateNewer(&offer,ORIVA_VERSION_W,ORIVA_UPDATE_VERSION_W)){
  wcscpy(updateVersion,offer.version);wcscpy(updatePath,offer.exe.path);wcscpy(updateHash,offer.exe.hash);updateSize=offer.exe.size;
  updateChangelog[0]=0;updateAvailable=TRUE;SendMessageW(window,UPDATE_FOUND,updateQuiet,0);
 }else if(valid&&!updateQuiet){wchar_t msg[160];swprintf(msg,160,tr(L"You have the latest Oriva version (%ls)."),ORIVA_VERSION_W);status(msg);}
 if(!valid&&!updateQuiet)status(tr(L"Could not check for updates. Check your connection and try again."));
}
typedef struct {HANDLE file;uint64_t total,expected;} UpdateFileSink;
static BOOL updateWriteChunk(void*context,const BYTE*buffer,DWORD count){
 UpdateFileSink*s=context;DWORD written=0;if(!WriteFile(s->file,buffer,count,&written,NULL)||written!=count)return FALSE;s->total+=count;
 wchar_t msg[100];swprintf(msg,100,tr(L"Downloading update... %u%%"),(unsigned)(s->total*100/s->expected));status(msg);return TRUE;
}
static BOOL updateDownloadFile(){
 BOOL ok=FALSE;wchar_t target[32768],folder[32768],part[32768];HANDLE out=INVALID_HANDLE_VALUE;uint64_t total=0;
 if(!ogApiPath(updatePath)||wcsncmp(updatePath,OG_REPO L"/releases/assets/",wcslen(OG_REPO L"/releases/assets/"))||!updateHex64(updateHash)||!updateSize||updateSize>OG_MAX_EXE||!updateDirectories(target,folder)||wcslen(folder)>32000)return FALSE;
 swprintf(part,32768,L"%ls\\Oriva-update.part",folder);swprintf(updateStage,32768,L"%ls\\Oriva-update.exe",folder);
 DeleteFileW(part);out=CreateFileW(part,GENERIC_WRITE,0,NULL,CREATE_NEW,FILE_ATTRIBUTE_NORMAL|FILE_FLAG_SEQUENTIAL_SCAN,NULL);if(out==INVALID_HANDLE_VALUE)return FALSE;
 status(tr(L"Getting update..."));
 UpdateFileSink sink={out,0,updateSize};
 if(!ogTransfer(updatePath,TRUE,updateSize,updateWriteChunk,&sink,&total)||total!=updateSize||!FlushFileBuffers(out))goto done;
 CloseHandle(out);out=INVALID_HANDLE_VALUE;
 if(!updateFileHash(part,updateHash)||!MoveFileExW(part,updateStage,MOVEFILE_REPLACE_EXISTING|MOVEFILE_WRITE_THROUGH))goto done;ok=TRUE;
 done:if(out!=INVALID_HANDLE_VALUE)CloseHandle(out);if(!ok)DeleteFileW(part);return ok;
}
static void updateDownloadWorker(){if(updateDownloadFile())SendMessageW(window,UPDATE_READY,0,0);else status(tr(L"Could not download or verify the update. Your installed version is unchanged."));}
static BOOL updateBeginInstall(){wchar_t target[32768],folder[32768],current[32768],args[32768];if(!updateDirectories(target,folder))return FALSE;GetModuleFileNameW(NULL,current,32768);if(_wcsicmp(current,target)){libraryDialogOpen=TRUE;orivaMessageBox(window,tr(L"Run Setup.cmd from the downloaded package once to install Oriva in your Windows profile. In-app updates can then replace the installed app safely."),tr(L"Oriva update"),MB_OK|MB_ICONINFORMATION);libraryDialogOpen=FALSE;return FALSE;}if(!updateFileHash(updateStage,updateHash)){status(tr(L"Update verification failed. Nothing was installed."));return FALSE;}if(swprintf(args,32768,L"--apply-update %lu \"%ls\" %ls",GetCurrentProcessId(),target,updateHash)<0)return FALSE;SHELLEXECUTEINFOW run={0};run.cbSize=sizeof(run);run.fMask=SEE_MASK_NOCLOSEPROCESS;run.hwnd=window;run.lpVerb=L"open";run.lpFile=updateStage;run.lpParameters=args;run.nShow=SW_SHOWNORMAL;libraryDialogOpen=TRUE;if(!ShellExecuteExW(&run)){libraryDialogOpen=FALSE;status(tr(L"Could not launch the updater. Oriva is still running."));return FALSE;}if(run.hProcess)CloseHandle(run.hProcess);DestroyWindow(window);return TRUE;}
static int updateApply(int argc,wchar_t**argv){if(argc!=5)return 1;wchar_t target[32768],folder[32768],module[32768],normalized[32768],next[32768],backup[32768];if(!updateDirectories(target,folder)||!updateHex64(argv[4]))return 1;DWORD pathLength=GetFullPathNameW(argv[3],32768,normalized,NULL);if(!pathLength||pathLength>=32768||_wcsicmp(target,normalized))return 1;GetModuleFileNameW(NULL,module,32768);if(!updateFileHash(module,argv[4])){orivaMessageBox(NULL,tr(L"Update verification failed. Your existing Oriva was not changed."),tr(L"Oriva update"),MB_OK|MB_ICONERROR);return 1;}wchar_t*end;unsigned long pid=wcstoul(argv[2],&end,10);if(!pid||*end||pid==GetCurrentProcessId())return 1;HANDLE parent=OpenProcess(SYNCHRONIZE|PROCESS_QUERY_LIMITED_INFORMATION,FALSE,(DWORD)pid);if(parent){wchar_t running[32768];DWORD capacity=32768;if(!QueryFullProcessImageNameW(parent,0,running,&capacity)||_wcsicmp(running,target)||WaitForSingleObject(parent,60000)!=WAIT_OBJECT_0){CloseHandle(parent);orivaMessageBox(NULL,tr(L"Oriva did not close in time. The update was not installed."),tr(L"Oriva update"),MB_OK);return 1;}CloseHandle(parent);}else if(GetLastError()!=ERROR_INVALID_PARAMETER)return 1;swprintf(next,32768,L"%ls.next.exe",target);swprintf(backup,32768,L"%ls.previous.exe",target);BOOL installed=FALSE;wchar_t previousHash[65];BOOL hadPrevious=updateReadHash(target,previousHash);if(hadPrevious&&CopyFileW(target,backup,FALSE)&&updateFileHash(backup,previousHash)&&CopyFileW(module,next,FALSE)&&updateFileHash(next,argv[4])){for(int tries=0;tries<30;tries++){if(MoveFileExW(next,target,MOVEFILE_REPLACE_EXISTING|MOVEFILE_WRITE_THROUGH)){installed=TRUE;break;}Sleep(100);}}if(!installed){DeleteFileW(next);orivaMessageBox(NULL,tr(L"Could not replace Oriva. Your existing installation was kept. Close other copies and try again."),tr(L"Oriva update"),MB_OK|MB_ICONINFORMATION);}HINSTANCE launched=ShellExecuteW(NULL,L"open",target,L"--library",NULL,SW_SHOWNORMAL);if((INT_PTR)launched>32)return installed?0:1;
 if(installed&&hadPrevious&&updateFileHash(backup,previousHash)&&CopyFileW(backup,next,FALSE)&&updateFileHash(next,previousHash)&&MoveFileExW(next,target,MOVEFILE_REPLACE_EXISTING|MOVEFILE_WRITE_THROUGH)){
  ShellExecuteW(NULL,L"open",target,L"--library",NULL,SW_SHOWNORMAL);
  orivaMessageBox(NULL,tr(L"Oriva could not restart. The previous version was restored."),tr(L"Oriva update"),MB_OK|MB_ICONINFORMATION);
 }else orivaMessageBox(NULL,tr(L"Oriva could not restart. Keep the previous executable for recovery and reopen Oriva manually."),tr(L"Oriva update"),MB_OK|MB_ICONERROR);
 return 1;}
#endif
