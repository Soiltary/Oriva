/* Isolated profiling of the real library controls. Never calls app entry,
   authentication, installer, tray, network, or profile initialization. */
#define wWinMain oriva_unused_app_entry
#include "../desktop/windows/Oriva.c"
#undef wWinMain
#include "native-check.h"
#include <psapi.h>
static LRESULT CALLBACK profileProc(HWND h,UINT m,WPARAM w,LPARAM l){
 if(m==WM_NOTIFY&&libraryList&&((NMHDR*)l)->hwndFrom==libraryList){
#ifdef ORIVA_LIST_INDEX_H
 if(((NMHDR*)l)->code==LVN_GETDISPINFOW)libraryRowText((NMLVDISPINFOW*)l);
#endif
 if(((NMHDR*)l)->code==LVN_ITEMCHANGED)libraryDetails();}
 return DefWindowProcW(h,m,w,l);
}
static double tick(void){LARGE_INTEGER q,f;QueryPerformanceCounter(&q);QueryPerformanceFrequency(&f);return (double)q.QuadPart*1000/f.QuadPart;}
static wchar_t*copyWide(const wchar_t*s){wchar_t*out=calloc(wcslen(s)+1,sizeof(wchar_t));assert(out);wcscpy(out,s);return out;}
static void pump(void){MSG message;while(PeekMessageW(&message,NULL,0,0,PM_REMOVE)){TranslateMessage(&message);DispatchMessageW(&message);}}
int main(void){
 instance=GetModuleHandleW(NULL);INITCOMMONCONTROLSEX cc={sizeof(cc),ICC_LISTVIEW_CLASSES};assert(InitCommonControlsEx(&cc));
 WNDCLASSW wc={0};wc.lpfnWndProc=profileProc;wc.hInstance=instance;wc.lpszClassName=L"OrivaSyntheticControlProfile";assert(RegisterClassW(&wc));
 window=CreateWindowExW(0,wc.lpszClassName,L"Synthetic hidden control profile",WS_OVERLAPPEDWINDOW,0,0,1080,800,NULL,NULL,instance,NULL);assert(window);
 font=(HFONT)GetStockObject(DEFAULT_GUI_FONT);small=font;libraryCreate();signedIn=TRUE;libraryView=TRUE;libraryWindowMode=1;libraryLayout();
 puts("items,loadMs,searchMs,collectionsMs,refreshMs,resizeMs,workingSetBytes");fflush(stdout);
 const int counts[]={100,1000,5000,10000};
 for(int z=0;z<4;z++){
  libraryClear();libraryCount=counts[z];libraryItems=calloc(libraryCount,sizeof(NativeItem));assert(libraryItems);
  for(int i=0;i<libraryCount;i++){NativeItem*it=&libraryItems[i];swprintf(it->id,40,L"00000000-0000-4000-8000-%012d",i);wchar_t titleText[100],group[70];swprintf(titleText,100,L"Profile %05d عربي English",i);swprintf(group,70,L"Group %d",i%12);it->title=copyWide(titleText);it->url=copyWide(L"https://example.test/#chapter");it->filename=copyWide(L"");it->note=copyWide(L"Synthetic Arabic ملاحظة English");it->collection=copyWide(group);it->state=copyWide(L"inbox");it->tags=malloc(3);strcpy(it->tags,"[]");it->revision=1;}
  libraryFilter=0;SetWindowTextW(librarySearch,L"");double t=tick();libraryFill(NULL);double load=tick()-t;assert(ListView_GetItemCount(libraryList)==ovPageSize(&libraryRows,libraryPage));pump();
  SetWindowTextW(librarySearch,L"Profile 00001");t=tick();libraryFill(NULL);double search=tick()-t;assert(ListView_GetItemCount(libraryList)==1);pump();
  SetWindowTextW(librarySearch,L"");libraryFilter=3;t=tick();libraryFill(NULL);double groups=tick()-t;
#ifdef ORIVA_LIST_INDEX_H
  assert(libraryRows.items==libraryCount&&libraryRows.count==libraryCount+12&&ListView_GetItemCount(libraryList)==ovPageSize(&libraryRows,libraryPage));
  ListView_SetItemState(libraryList,0,LVIS_SELECTED,LVIS_SELECTED);assert(librarySelected()==-1);assert(libraryToggleGroup(0));assert(libraryRows.items==libraryCount&&libraryRows.count<libraryCount+12);assert(libraryToggleGroup(0));assert(libraryRows.count==libraryCount+12&&ListView_GetItemCount(libraryList)==ovPageSize(&libraryRows,libraryPage));
#else
  assert(ListView_GetItemCount(libraryList)==libraryCount);
#endif
  pump();
  libraryFilter=0;t=tick();libraryFill(NULL);double refresh=tick()-t;pump();
  unsigned char*seen=calloc(libraryCount,1);assert(seen);int pageCount=ovPageCount(&libraryRows);
  for(int page=0;page<pageCount;page++){libraryPage=page;libraryFill(NULL);int rows=ListView_GetItemCount(libraryList);assert(rows<=200);for(int row=0;row<rows;row++){ListView_SetItemState(libraryList,row,LVIS_SELECTED,LVIS_SELECTED);int sourceIndex=librarySelected();assert(sourceIndex==page*200+row&&!seen[sourceIndex]);seen[sourceIndex]=1;}}
  for(int i=0;i<libraryCount;i++)assert(seen[i]);free(seen);libraryPage=0;libraryFill(NULL);
  // A flag removing a visible row rebuilds safely and preserves all other indexes.
  libraryFilter=1;libraryItems[0].favorite=TRUE;libraryFill(NULL);assert(ListView_GetItemCount(libraryList)==1);libraryItems[0].favorite=FALSE;libraryUpdateRow(libraryItems[0].id);assert(ListView_GetItemCount(libraryList)==0);
  libraryFilter=2;libraryItems[1].archived=TRUE;libraryFill(NULL);assert(ListView_GetItemCount(libraryList)==1);libraryItems[1].archived=FALSE;libraryUpdateRow(libraryItems[1].id);assert(ListView_GetItemCount(libraryList)==0);libraryFilter=0;libraryFill(NULL);
  t=tick();for(int i=0;i<10;i++){SetWindowPos(window,NULL,0,0,850+i*15,720+i*5,SWP_NOMOVE|SWP_NOZORDER|SWP_NOACTIVATE);libraryLayout();}double resize=tick()-t;pump();
  PROCESS_MEMORY_COUNTERS mem={sizeof(mem)};assert(GetProcessMemoryInfo(GetCurrentProcess(),&mem,sizeof(mem)));
  printf("%d,%.3f,%.3f,%.3f,%.3f,%.3f,%llu\n",libraryCount,load,search,groups,refresh,resize,(unsigned long long)mem.WorkingSetSize);fflush(stdout);
 }
 libraryClear();DestroyWindow(window);puts("PASS hidden actual-control counts/search/collection/refresh/resize; no network, profiles, registry, tray or app entry executed");
 return 0;
}
