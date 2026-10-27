#ifndef ORIVA_EDIT_NOTIFY_H
#define ORIVA_EDIT_NOTIFY_H
typedef struct {const BOOL*initializing;const BOOL*loading;UINT controlId;} OEDirtyGuard;
/* Multiline WM_SETTEXT (including UI Automation SetValue) omits EN_CHANGE.
   Relay that edit while suppressing application-driven loads/restores. */
static LRESULT CALLBACK orivaAccessibleEditProc(HWND h,UINT message,WPARAM w,LPARAM l,UINT_PTR id,DWORD_PTR data){
 const OEDirtyGuard*guard=(const OEDirtyGuard*)data;
 if(message==WM_NCDESTROY)RemoveWindowSubclass(h,orivaAccessibleEditProc,id);
 LRESULT result=DefSubclassProc(h,message,w,l);
 if(message==WM_SETTEXT&&result&&guard&&!*(guard->initializing)&&!*(guard->loading))SendMessageW(GetParent(h),WM_COMMAND,MAKEWPARAM(guard->controlId,EN_CHANGE),(LPARAM)h);
 return result;
}
static BOOL orivaTrackAccessibleEdit(HWND edit,const OEDirtyGuard*guard){return SetWindowSubclass(edit,orivaAccessibleEditProc,1,(DWORD_PTR)guard);}
#endif
