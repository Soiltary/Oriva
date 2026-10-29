#define wWinMain orivaApplicationEntryNotCalled
#include "../desktop/windows/Oriva.c"
#undef wWinMain
#include "native-check.h"
int main(void){
 /* Exercise the real layout transition on a hidden STATIC test window.
    No application entry/profile, WM_CREATE, tray, timers or network workers. */
 MONITORINFO monitor={sizeof(monitor)};
 assert(GetMonitorInfoW(MonitorFromPoint((POINT){0,0},MONITOR_DEFAULTTOPRIMARY),&monitor));
 RECT work=monitor.rcWork;
 HWND test=CreateWindowExW(0,L"STATIC",L"Oriva hidden layout acceptance",WS_OVERLAPPEDWINDOW,work.left+40,work.bottom-200,580,180,NULL,NULL,GetModuleHandleW(NULL),NULL);assert(test);
 window=test;signedIn=TRUE;libraryView=TRUE;libraryWindowMode=0;
 MINMAXINFO tracking={0};proc(test,WM_GETMINMAXINFO,0,(LPARAM)&tracking);
 assert(tracking.ptMinTrackSize.x==(work.right-work.left<850?work.right-work.left:850));
 assert(tracking.ptMinTrackSize.y==(work.bottom-work.top<720?work.bottom-work.top:720));
 layout();RECT bounds;assert(GetWindowRect(test,&bounds));
 assert(bounds.left>=work.left&&bounds.top>=work.top&&bounds.right<=work.right&&bounds.bottom<=work.bottom);
 signedIn=FALSE;libraryView=FALSE;layout();assert(GetWindowRect(test,&bounds));
 assert(bounds.left>=work.left&&bounds.top>=work.top&&bounds.right<=work.right&&bounds.bottom<=work.bottom);
 for(int rtl=0;rtl<2;rtl++){
  SetWindowLongPtrW(test,GWL_EXSTYLE,rtl?WS_EX_LAYOUTRTL:0);
  SetWindowPos(test,NULL,work.right-180,work.bottom-180,580,650,SWP_NOZORDER|SWP_NOACTIVATE);
  signedIn=TRUE;libraryView=TRUE;libraryWindowMode=0;layout();assert(GetWindowRect(test,&bounds));
  assert(bounds.left>=work.left&&bounds.top>=work.top&&bounds.right<=work.right&&bounds.bottom<=work.bottom);
 }
 RECT negative={-1280,-100,0,620},prior={-500,400,80,1050};
 RECT fitted=orivaFittedWindowBounds(prior,negative,1080,800);
 assert(fitted.left==-1080&&fitted.top==-100&&fitted.right==0&&fitted.bottom==620);
 /* Geometry-only tiny-area check, not child-control usability acceptance. */
 RECT small={0,0,800,600};fitted=orivaFittedWindowBounds((RECT){20,100,600,750},small,1080,800);
 assert(fitted.left==0&&fitted.top==0&&fitted.right==800&&fitted.bottom==600);
 RECT normal={0,0,1920,1040};fitted=orivaFittedWindowBounds((RECT){40,50,620,700},normal,580,650);
 assert(fitted.left==40&&fitted.top==50&&fitted.right==620&&fitted.bottom==700);
 DestroyWindow(test);window=NULL;puts("PASS actual layout login/library transitions remain wholly inside monitor work area; hidden fixture only");return 0;
}
