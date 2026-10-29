#ifndef ORIVA_CONTENT_H
#define ORIVA_CONTENT_H
#include "oriva-edit-notify.h"
/* Native text remains inert Unicode data. Network work uses the existing
   serialized worker; controls and revision acknowledgements stay on UI thread. */
#define CONTENT_FETCH 740
#define CONTENT_SAVE 741
#define CONTENT_HISTORY 742
#define CONTENT_RESTORE 743
#define CONTENT_RESULT (WM_APP+14)
#define CONTENT_COPY 744
#define CONTENT_LATEST 745
#define CONTENT_SAVE_COPY 746
static HWND contentWindow,contentTitle,contentBody,contentCollection,contentLanguage,contentState,contentSaveButton,contentHistoryList;
static wchar_t contentId[40],contentKind[16];static ULONGLONG contentRevision,contentRestoreRevision;
static BOOL contentLoading,contentDirty,contentBlocked,contentInitializing;
static OEDirtyGuard contentEditGuard={&contentInitializing,&contentLoading,804};
static char*contentPayload;
static const wchar_t*contentText(const wchar_t*en,const wchar_t*ar){return orivaArabic?ar:en;}
static void contentEnabled(BOOL enabled){HWND a[]={contentTitle,contentBody,contentCollection,contentLanguage,contentSaveButton,contentHistoryList};for(int i=0;i<6;i++)EnableWindow(a[i],enabled);}
static void contentSubmit(){
 if(!contentWindow||contentLoading||busy||!contentDirty||contentBlocked)return;
 wchar_t*a=linkRead(contentTitle,240),*b=linkRead(contentBody,250000),*c=linkRead(contentCollection,80),*d=linkRead(contentLanguage,40);
 char*t=a?escape(a):NULL,*text=b?escape(b):NULL,*group=c?escape(c):NULL,*language=d?escape(d):NULL;
 if(t&&text&&group&&language){size_t n=strlen(t)+strlen(text)+strlen(group)+strlen(language)+260;contentPayload=malloc(n);if(contentPayload)snprintf(contentPayload,n,"{\"kind\":\"%s\",\"title\":\"%s\",\"body\":\"%s\",\"collection\":\"%s\",\"language\":\"%s\"%s%llu}",!wcscmp(contentKind,L"snippet")?"snippet":"article",t[0]?t:"Untitled",text,group,language,contentId[0]?",\"revision\":":",\"clientDraft\":",contentId[0]?contentRevision:0);}
 free(a);free(b);free(c);free(d);free(t);free(text);free(group);free(language);
 if(!contentPayload){SetWindowTextW(contentState,contentText(L"Could not prepare the save. Your text is still here.",L"تعذر إعداد الحفظ. النص ما زال هنا"));return;}
 contentLoading=TRUE;contentEnabled(FALSE);SetWindowTextW(contentState,contentText(L"Saving...",L"جاري الحفظ…"));start(CONTENT_SAVE);
}
static void contentResult(int job,DWORD code,const char*response){
 if(!contentWindow)return;contentLoading=FALSE;contentEnabled(TRUE);
 int count=0;OJToken*t=response?ojParse(response,&count):NULL;
 if(code!=200&&code!=201){if(job==CONTENT_HISTORY){SetWindowTextW(contentState,contentText(L"Could not load history. Click History to retry. Your draft is kept.",L"تعذر تحميل الإصدارات. اضغط الإصدارات للمحاولة. احتُفظ بالمسودة"));free(t);return;}contentBlocked=job!=CONTENT_FETCH;SetWindowTextW(contentState,code==413?contentText(L"Storage allowance reached. Your draft is kept. Manage storage on the website before retrying.",L"بلغت حصة التخزين. احتُفظ بالمسودة. أدر المساحة من الموقع ثم أعد الحفظ"):code==409?contentText(L"Conflict: your draft is kept. Load latest or save a new copy.",L"تعارض: احتُفظ بالمسودة. حمّل الأحدث أو احفظ نسخة جديدة"):contentText(L"Sync failed. Your draft is kept. Click Save to retry.",L"تعذرت المزامنة. احتُفظ بالمسودة. اضغط حفظ للمحاولة"));free(t);return;}
 if(job==CONTENT_HISTORY){int revisions=t&&count?ojField(response,t,0,"revisions"):-1;if(revisions<0||t[revisions].type!='['){SetWindowTextW(contentState,contentText(L"Invalid history response. Click History to retry. Your draft is kept.",L"استجابة إصدارات غير صالحة. أعد المحاولة. احتُفظ بالمسودة"));free(t);return;}}
 if(!t||!count){SetWindowTextW(contentState,contentText(L"Invalid response. Your draft is kept.",L"استجابة غير صالحة. احتُفظ بالمسودة"));contentBlocked=TRUE;free(t);return;}
 if(job==CONTENT_HISTORY){SendMessageW(contentHistoryList,CB_RESETCONTENT,0,0);int a=ojField(response,t,0,"revisions");if(a>=0&&t[a].type=='[')for(int i=a+1;i<t[a].next;i=t[i].next){int field=ojField(response,t,i,"revision");char*n=field>=0?ojRaw(response,t,field):NULL;if(n){ULONGLONG revision=strtoull(n,NULL,10);wchar_t label[80];swprintf(label,80,contentText(L"Revision %llu",L"الإصدار %llu"),revision);LRESULT row=SendMessageW(contentHistoryList,CB_ADDSTRING,0,(LPARAM)label);SendMessageW(contentHistoryList,CB_SETITEMDATA,row,(LPARAM)revision);free(n);}}SendMessageW(contentHistoryList,CB_SETCURSEL,0,0);SetWindowTextW(contentState,contentBlocked?contentText(L"History loaded. The previous save still needs attention; your draft is kept.",L"تم تحميل الإصدارات. ما زال الحفظ السابق يحتاج معالجة؛ احتُفظ بالمسودة"):contentDirty?contentText(L"History loaded. Your draft has unsaved changes.",L"تم تحميل الإصدارات. توجد تغييرات غير محفوظة في المسودة"):contentText(L"History loaded. Select a revision to restore.",L"تم تحميل الإصدارات. اختر إصدارًا لاستعادته"));free(t);return;}
 int item=ojField(response,t,0,"item");if(item<0||t[item].type!='{'){free(t);return;}
 wchar_t*id=libraryString(response,t,item,"id"),*titleText=libraryString(response,t,item,"title"),*body=libraryString(response,t,item,"body"),*group=libraryString(response,t,item,"collection"),*language=libraryString(response,t,item,"language");
 int field=ojField(response,t,item,"revision");char*n=field>=0?ojRaw(response,t,field):NULL;
 if(!id||wcslen(id)!=36||!titleText||!body||!group||!language||!n){contentBlocked=TRUE;goto finish;}
 if(wcslen(body)>250000){contentBlocked=TRUE;SetWindowTextW(contentState,contentText(L"This document exceeds the native editor limit. Open it on the website; no text was changed.",L"يتجاوز المستند حد المحرر الأصلي. افتحه على الموقع؛ لم يتغير النص"));EnableWindow(contentBody,FALSE);goto finish;}
 wcscpy(contentId,id);contentRevision=strtoull(n,NULL,10);contentInitializing=TRUE;SetWindowTextW(contentTitle,titleText);SetWindowTextW(contentBody,body);SetWindowTextW(contentCollection,group);SetWindowTextW(contentLanguage,language);contentInitializing=FALSE;contentDirty=FALSE;contentBlocked=FALSE;
 SetWindowTextW(contentState,contentText(L"Saved. Images and hyperlinks use Markdown; visual preview is available on the website.",L"تم الحفظ. الصور والروابط بصيغة Markdown؛ المعاينة المرئية متاحة على الموقع"));
 finish:free(id);free(titleText);free(body);free(group);free(language);free(n);free(t);
}
static void contentWorker(int job){DWORD code=0;wchar_t path[160];if(contentId[0])swprintf(path,160,L"/api/items/%ls%ls",contentId,job==CONTENT_HISTORY?L"/revisions":L"");else wcscpy(path,L"/api/items");char restore[160];snprintf(restore,160,"{\"revision\":%llu,\"restoreRevision\":%llu}",contentRevision,contentRestoreRevision);char*r=requestMethod(job==CONTENT_SAVE?(contentId[0]?L"PATCH":L"POST"):job==CONTENT_RESTORE?L"PATCH":L"GET",path,job==CONTENT_SAVE?contentPayload:job==CONTENT_RESTORE?restore:NULL,NULL,&code);SendMessageW(window,CONTENT_RESULT,MAKEWPARAM(job,code),(LPARAM)r);free(r);free(contentPayload);contentPayload=NULL;if((code==200||code==201)&&(job==CONTENT_SAVE||job==CONTENT_RESTORE)){libraryHasVersion=FALSE;libraryQuiet=TRUE;libraryFetchWorker();}}
static LRESULT CALLBACK contentProc(HWND h,UINT m,WPARAM w,LPARAM l){switch(m){
 case WM_CREATE:{contentWindow=h;contentInitializing=TRUE;
 linkControl(h,L"STATIC",contentText(L"Title",L"العنوان"),0,24,18,200,22,0);contentTitle=linkControl(h,L"EDIT",L"",WS_TABSTOP|WS_BORDER|ES_AUTOHSCROLL,24,42,700,32,801);SendMessageW(contentTitle,EM_SETLIMITTEXT,240,0);languageInput(contentTitle,TRUE);
 linkControl(h,L"STATIC",contentText(L"Collection",L"المجموعة"),0,24,84,320,22,0);contentCollection=linkControl(h,L"EDIT",L"",WS_TABSTOP|WS_BORDER|ES_AUTOHSCROLL,24,108,330,32,802);SendMessageW(contentCollection,EM_SETLIMITTEXT,80,0);languageInput(contentCollection,TRUE);
 linkControl(h,L"STATIC",contentText(L"Language (code stays LTR)",L"اللغة (الشيفرة من اليسار لليمين)"),0,380,84,344,22,0);contentLanguage=linkControl(h,L"EDIT",L"plaintext",WS_TABSTOP|WS_BORDER|ES_AUTOHSCROLL,380,108,344,32,803);SendMessageW(contentLanguage,EM_SETLIMITTEXT,40,0);languageInput(contentLanguage,FALSE);
 contentBody=linkControl(h,L"EDIT",L"",WS_TABSTOP|WS_BORDER|ES_MULTILINE|ES_AUTOVSCROLL|ES_AUTOHSCROLL|ES_WANTRETURN|WS_VSCROLL|WS_HSCROLL,24,156,700,330,804);orivaTrackAccessibleEdit(contentBody,&contentEditGuard);SendMessageW(contentBody,EM_SETLIMITTEXT,250000,0);languageInput(contentBody,wcscmp(contentKind,L"snippet")!=0);if(!wcscmp(contentKind,L"snippet"))SendMessageW(contentBody,WM_SETFONT,(WPARAM)GetStockObject(ANSI_FIXED_FONT),TRUE);
 contentState=linkControl(h,L"STATIC",contentText(L"Autosaves after you pause typing.",L"يُحفظ تلقائيًا بعد توقف الكتابة"),0,24,496,700,45,0);
 contentSaveButton=linkControl(h,L"BUTTON",contentText(L"Save",L"حفظ"),WS_TABSTOP,24,550,110,34,CONTENT_SAVE);linkControl(h,L"BUTTON",contentText(L"Copy",L"نسخ"),WS_TABSTOP,145,550,105,34,CONTENT_COPY);linkControl(h,L"BUTTON",contentText(L"History",L"الإصدارات"),WS_TABSTOP,260,550,110,34,CONTENT_HISTORY);contentHistoryList=linkControl(h,L"COMBOBOX",L"",WS_TABSTOP|CBS_DROPDOWNLIST|WS_VSCROLL,380,550,170,200,0);linkControl(h,L"BUTTON",contentText(L"Restore",L"استعادة"),WS_TABSTOP,560,550,164,34,CONTENT_RESTORE);
 linkControl(h,L"BUTTON",contentText(L"Load latest",L"تحميل الأحدث"),WS_TABSTOP,24,598,200,34,CONTENT_LATEST);linkControl(h,L"BUTTON",contentText(L"Save draft as new item",L"حفظ المسودة كعنصر جديد"),WS_TABSTOP,240,598,270,34,CONTENT_SAVE_COPY);linkControl(h,L"BUTTON",contentText(L"Close",L"إغلاق"),WS_TABSTOP,560,598,164,34,IDCANCEL);contentInitializing=FALSE;SetTimer(h,1,900,NULL);return 0;}
 case WM_TIMER:if(contentDirty&&!contentBlocked&&!contentLoading&&!busy){KillTimer(h,1);contentSubmit();SetTimer(h,1,900,NULL);}return 0;
 case WM_COMMAND:if(HIWORD(w)==EN_CHANGE&&LOWORD(w)>=801&&LOWORD(w)<=804){if(!contentInitializing){contentDirty=TRUE;KillTimer(h,1);SetTimer(h,1,900,NULL);SetWindowTextW(contentState,contentText(L"Unsaved draft",L"مسودة غير محفوظة"));}return 0;}if(contentLoading||busy)return 0;switch(LOWORD(w)){
 case CONTENT_SAVE:contentBlocked=FALSE;contentSubmit();return 0;
 case CONTENT_COPY:SendMessageW(contentBody,EM_SETSEL,0,-1);SendMessageW(contentBody,WM_COPY,0,0);return 0;
 case CONTENT_SAVE_COPY:contentId[0]=0;contentRevision=0;contentDirty=TRUE;contentBlocked=FALSE;contentSubmit();return 0;
 case CONTENT_HISTORY:if(contentId[0]){contentLoading=TRUE;start(CONTENT_HISTORY);}return 0;
 case CONTENT_LATEST:if(contentId[0]&&(!contentDirty||orivaMessageBox(h,contentText(L"Load latest and replace this unsaved draft? Copy it first to keep it.",L"تحميل الأحدث واستبدال المسودة غير المحفوظة؟ انسخها أولًا للاحتفاظ بها"),L"Oriva",MB_YESNO|MB_DEFBUTTON2)==IDYES)){contentLoading=TRUE;contentEnabled(FALSE);start(CONTENT_FETCH);}return 0;
 case CONTENT_RESTORE:{LRESULT row=SendMessageW(contentHistoryList,CB_GETCURSEL,0,0);if(row!=CB_ERR&&(!contentDirty||orivaMessageBox(h,contentText(L"Replace this draft by a restored revision?",L"استبدال المسودة بإصدار مستعاد؟"),L"Oriva",MB_YESNO|MB_DEFBUTTON2)==IDYES)){contentRestoreRevision=(ULONGLONG)SendMessageW(contentHistoryList,CB_GETITEMDATA,row,0);contentLoading=TRUE;contentEnabled(FALSE);start(CONTENT_RESTORE);}return 0;}
 case IDCANCEL:SendMessageW(h,WM_CLOSE,0,0);return 0;}break;
 case WM_CLOSE:if(contentLoading||busy)return 0;if(contentDirty&&orivaMessageBox(h,contentText(L"Close and discard this unsaved draft? Copy it first to keep it.",L"إغلاق المسودة غير المحفوظة وتجاهلها؟ انسخها أولًا للاحتفاظ بها"),L"Oriva",MB_YESNO|MB_DEFBUTTON2)!=IDYES)return 0;DestroyWindow(h);return 0;
 case WM_CTLCOLORSTATIC:case WM_CTLCOLOREDIT:SetTextColor((HDC)w,RGB(229,220,242));SetBkColor((HDC)w,m==WM_CTLCOLORSTATIC?RGB(9,12,22):RGB(23,26,43));return (LRESULT)(m==WM_CTLCOLORSTATIC?bg:field);
 case WM_DESTROY:KillTimer(h,1);contentWindow=NULL;libraryDialogOpen=FALSE;EnableWindow(window,TRUE);SetForegroundWindow(window);return 0;
 }return DefWindowProcW(h,m,w,l);}
static void contentOpen(const wchar_t*id,const wchar_t*kind){if(busy||libraryDialogOpen)return;contentId[0]=0;if(id)wcsncpy(contentId,id,39);wcsncpy(contentKind,kind,15);contentRevision=0;contentDirty=FALSE;contentLoading=FALSE;contentBlocked=FALSE;
 WNDCLASSW c={0};c.lpfnWndProc=contentProc;c.hInstance=instance;c.hCursor=LoadCursorW(NULL,IDC_ARROW);c.hbrBackground=bg;c.hIcon=smallIcon;c.lpszClassName=L"OrivaContentEditor";RegisterClassW(&c);libraryDialogOpen=TRUE;EnableWindow(window,FALSE);RECT parent;GetWindowRect(window,&parent);int editorX=(parent.left+parent.right-768)/2,editorY=(parent.top+parent.bottom-700)/2;
 MONITORINFO monitor={sizeof(monitor)};if(GetMonitorInfoW(MonitorFromWindow(window,MONITOR_DEFAULTTONEAREST),&monitor)){if(editorX+768>monitor.rcWork.right)editorX=monitor.rcWork.right-768;if(editorY+700>monitor.rcWork.bottom)editorY=monitor.rcWork.bottom-700;if(editorX<monitor.rcWork.left)editorX=monitor.rcWork.left;if(editorY<monitor.rcWork.top)editorY=monitor.rcWork.top;}
 HWND h=CreateWindowExW(WS_EX_APPWINDOW|WS_EX_DLGMODALFRAME|(orivaArabic?WS_EX_LAYOUTRTL:0),c.lpszClassName,!wcscmp(kind,L"snippet")?contentText(L"Oriva - Code snippet",L"Oriva - مقتطف برمجي"):contentText(L"Oriva - Article",L"Oriva - مقال"),WS_OVERLAPPED|WS_CAPTION|WS_SYSMENU,editorX,editorY,768,700,window,NULL,instance,NULL);if(!h){libraryDialogOpen=FALSE;EnableWindow(window,TRUE);return;}
#ifdef ORIVA_STAGING_ONLY
 SetWindowTextW(h,!wcscmp(kind,L"snippet")?L"Oriva STAGING ONLY — Code snippet":L"Oriva STAGING ONLY — Article");
#endif
 ShowWindow(h,SW_SHOW);if(id){contentLoading=TRUE;contentEnabled(FALSE);SetWindowTextW(contentState,contentText(L"Loading the complete document...",L"تحميل المستند كاملًا…"));start(CONTENT_FETCH);}else SetFocus(contentTitle);}
#endif
