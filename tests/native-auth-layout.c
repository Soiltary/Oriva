#define UNICODE
#define _UNICODE
#include <windows.h>
#include <stdio.h>
#include <assert.h>
#include "native-check.h"
#include "../desktop/windows/oriva-auth-layout.h"
static void check(HWND parent,const OrivaControlBounds *controls,size_t count){
 RECT client;assert(GetClientRect(parent,&client));
 for(size_t i=0;i<count;i++){
  RECT actual;assert(GetWindowRect(controls[i].window,&actual));
  MapWindowPoints(NULL,parent,(POINT*)&actual,2);
  assert(actual.left==controls[i].x&&actual.top==controls[i].y);
  assert(actual.right-actual.left==controls[i].width&&actual.bottom-actual.top==controls[i].height);
  assert(actual.left>=0&&actual.right<=client.right&&actual.bottom<=client.bottom);
 }
}
int main(void){
 HINSTANCE instance=GetModuleHandleW(NULL);
 /* Hidden test windows only: no application profile, registry, tray or network. */
 HWND parent=CreateWindowExW(0,L"STATIC",L"Oriva layout fixture",WS_OVERLAPPEDWINDOW,0,0,580,650,NULL,NULL,instance,NULL);assert(parent);
 HWND email=CreateWindowExW(WS_EX_NOINHERITLAYOUT,L"EDIT",L"",WS_CHILD,36,180,490,34,parent,NULL,instance,NULL);
 HWND password=CreateWindowExW(WS_EX_NOINHERITLAYOUT,L"EDIT",L"",WS_CHILD|ES_PASSWORD,36,265,490,34,parent,NULL,instance,NULL);
 HWND login=CreateWindowExW(0,L"BUTTON",L"Sign in",WS_CHILD,36,393,200,44,parent,NULL,instance,NULL);
 assert(email&&password&&login);
 const OrivaControlBounds controls[]={{email,36,180,490,34},{password,36,265,490,34},{login,36,393,200,44}};
 for(int direction=0;direction<4;direction++){
  LONG_PTR ex=GetWindowLongPtrW(parent,GWL_EXSTYLE);
  SetWindowLongPtrW(parent,GWL_EXSTYLE,(ex&~WS_EX_LAYOUTRTL)|(direction%2?WS_EX_LAYOUTRTL:0));
  for(int cycle=0;cycle<10;cycle++)for(int mode=0;mode<2;mode++){
   SetWindowPos(parent,NULL,0,0,mode?580:1080,mode?650:800,SWP_NOMOVE|SWP_NOZORDER|SWP_NOACTIVATE|SWP_FRAMECHANGED);
   orivaPlaceControls(controls,3);check(parent,controls,3);
  }
 }
 DestroyWindow(parent);
 puts("PASS actual hidden Win32 LTR/RTL direction changes and 80 library/login resize transitions; logical bounds and visibility preserved");
 return 0;
}
