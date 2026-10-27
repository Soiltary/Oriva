#define UNICODE
#define _UNICODE
#include <windows.h>
#include <commctrl.h>
#include <stdio.h>
#include <assert.h>
#include "native-check.h"
#include "../desktop/windows/oriva-edit-notify.h"
static int changes;static BOOL initializing,loading;
static LRESULT CALLBACK parentProc(HWND h,UINT m,WPARAM w,LPARAM l){if(m==WM_COMMAND&&LOWORD(w)==804&&HIWORD(w)==EN_CHANGE){changes++;return 0;}return DefWindowProcW(h,m,w,l);}
int main(void){
 HINSTANCE instance=GetModuleHandleW(NULL);INITCOMMONCONTROLSEX cc={sizeof(cc),ICC_LISTVIEW_CLASSES};assert(InitCommonControlsEx(&cc));WNDCLASSW c={0};c.hInstance=instance;c.lpfnWndProc=parentProc;c.lpszClassName=L"OrivaAccessibleEditFixture";assert(RegisterClassW(&c));
 HWND parent=CreateWindowExW(0,c.lpszClassName,L"Hidden synthetic edit fixture",0,0,0,400,300,NULL,NULL,instance,NULL);assert(parent);HWND edit=CreateWindowExW(0,L"EDIT",L"",WS_CHILD|ES_MULTILINE,0,0,300,200,parent,(HMENU)804,instance,NULL);assert(edit);
 assert(SetWindowTextW(edit,L"Untracked accessibility value"));assert(changes==0); // Exact original Windows behavior.
 SendMessageW(edit,EM_SETSEL,0,-1);SendMessageW(edit,EM_REPLACESEL,FALSE,(LPARAM)L"Ordinary keyboard/paste path");int ordinaryChanges=changes;assert(ordinaryChanges>0);changes=0;
 OEDirtyGuard guard={&initializing,&loading,804};assert(orivaTrackAccessibleEdit(edit,&guard));
 assert(SetWindowTextW(edit,L"Accessible عربي English"));assert(changes==1);
 initializing=TRUE;assert(SetWindowTextW(edit,L"Application initial load"));assert(changes==1);initializing=FALSE;
 loading=TRUE;assert(SetWindowTextW(edit,L"Application restored revision"));assert(changes==1);loading=FALSE;
 SendMessageW(edit,EM_SETSEL,0,-1);SendMessageW(edit,EM_REPLACESEL,FALSE,(LPARAM)L"Ordinary keyboard/paste path");assert(changes==1+ordinaryChanges);
 for(int i=0;i<100;i++){wchar_t text[100];swprintf(text,100,L"Synthetic value %d — عربي",i);assert(SetWindowTextW(edit,text));assert(changes==i+2+ordinaryChanges);}
 DestroyWindow(parent);puts("PASS actual hidden multiline Win32 accessibility SetValue/WM_SETTEXT dirty relay, application-load/restore suppression, ordinary input without duplicate notifications and100 repeated edits");return 0;
}
