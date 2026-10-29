#define wWinMain orivaApplicationEntryNotCalled
#include "../desktop/windows/Oriva.c"
#undef wWinMain
#include "native-check.h"
int main(void){
 /* Real response handler, hidden controls only: no app entry, profile or network. */
 contentWindow=CreateWindowW(L"STATIC",L"",0,0,0,100,100,NULL,NULL,GetModuleHandleW(NULL),NULL);assert(contentWindow);
 contentState=CreateWindowW(L"STATIC",L"",WS_CHILD,0,0,90,20,contentWindow,NULL,NULL,NULL);
 contentHistoryList=CreateWindowW(L"COMBOBOX",L"",WS_CHILD|CBS_DROPDOWNLIST,0,0,90,80,contentWindow,NULL,NULL,NULL);
 const char*history="{\"revisions\":[{\"revision\":1}]}";
 for(int rtl=0;rtl<2;rtl++){
  orivaArabic=rtl;contentDirty=TRUE;contentBlocked=FALSE;contentLoading=TRUE;
  contentResult(CONTENT_HISTORY,0,NULL);
  assert(!contentBlocked&&contentDirty&&!contentLoading);
  wchar_t failed[512],loaded[512];GetWindowTextW(contentState,failed,512);
  contentResult(CONTENT_HISTORY,200,history);GetWindowTextW(contentState,loaded,512);
  assert(wcscmp(failed,loaded)!=0&&wcslen(loaded)>0);
  assert(contentDirty&&!contentBlocked);
  assert(SendMessageW(contentHistoryList,CB_GETCOUNT,0,0)==1);
  assert(SendMessageW(contentHistoryList,CB_GETITEMDATA,0,0)==1);
  const char*invalid[]={NULL,"not-json","{}","{\"revisions\":{}}"};
  for(int i=0;i<4;i++){contentBlocked=FALSE;contentResult(CONTENT_HISTORY,200,invalid[i]);assert(!contentBlocked&&contentDirty);}
  /* Reading history must never clear an earlier write conflict or quota block. */
  contentBlocked=TRUE;contentResult(CONTENT_HISTORY,200,history);assert(contentBlocked&&contentDirty);
  contentResult(CONTENT_HISTORY,0,NULL);assert(contentBlocked&&contentDirty);
  contentDirty=FALSE;contentBlocked=FALSE;contentResult(CONTENT_HISTORY,200,history);
  assert(!contentDirty&&!contentBlocked);
 }
 DestroyWindow(contentWindow);contentWindow=NULL;
 puts("PASS EN/AR history retry clears stale status without blocking autosave or clearing write conflicts");return 0;
}
