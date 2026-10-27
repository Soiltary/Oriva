#ifndef ORIVA_LIBRARY_H
#define ORIVA_LIBRARY_H
#include "oriva-json.h"
#include "oriva-mutation.h"
#include "oriva-collections.h"
#include "oriva-list-index.h"
#define LIB_TAB_COLLECTIONS 511
#define LIB_ADD_LINK 512
#define LIB_SET_COLLECTION 513
#define LIB_PAGE_PREVIOUS 516
#define LIB_PAGE_NEXT 517
#define LIB_FORM_SAVE 514
#define LIB_FORM_RESULT (WM_APP+10)
static void linkFormOpen(BOOL collectionOnly);
static void contentOpen(const wchar_t*id,const wchar_t*kind);
static void contentNewMenu(void);
#define LIB_MUTATION_RESULT (WM_APP+8)
#define LIB_PUMP (WM_APP+9)
#define LIB_RESULT (WM_APP+5)
#define LIB_STAGE_BEGIN (WM_APP+11)
#define LIB_STAGE_COMMIT (WM_APP+12)
#define LIB_STAGE_CANCEL (WM_APP+13)
#define LIB_FETCH 500
#define LIB_DOWNLOAD 501
#define LIB_FAVORITE 502
#define LIB_ARCHIVE 503
#define LIB_DELETE 504
#define LIB_SEARCH 505
#define LIB_TAB_ALL 506
#define LIB_TAB_FAVORITES 507
#define LIB_TAB_ARCHIVE 508
#define LIB_SAVE 509
#define LIB_LIST 510
static void start(int job);static void fileSelected(void);static void layout(void);static void choose(void);static void showApp(void);
static HWND add(const wchar_t*,const wchar_t*,DWORD,int,int,int,int,int);
typedef struct{wchar_t id[40];wchar_t*title,*url,*filename,*note,*collection,*state;char*tags;BOOL file,favorite,archived,article,snippet,deleted;ULONGLONG size,revision;} NativeItem;
static OVIndex libraryRows;static OCIndex libraryCollapsed;static int libraryPage;static HWND libraryPagePrevious,libraryPageNext,libraryPageLabel;
static NativeItem*libraryStaged;static int libraryStagedCount;static BOOL libraryStaging,libraryHasVersion;static ULONGLONG libraryServerVersion;
static NativeItem*libraryItems;static int libraryCount,libraryFilter,libraryWindowMode=-1;static BOOL libraryView=TRUE,libraryUpdating=FALSE,libraryQuiet=FALSE,libraryDialogOpen=FALSE;
static HWND libraryList,librarySearch,libraryRefresh,libraryTabs[4],libraryOpen,libraryFavorite,libraryArchive,libraryDelete,librarySave,libraryAddLink,librarySetCollection,libraryLogout,libraryDetailsBox,libraryStatus,libraryEmpty,libraryHeadings[5];static HIMAGELIST libraryRowHeight;
static wchar_t libraryJobId[40],libraryDestination[32768];static ULONGLONG libraryDownloadSize,libraryJobRevision;static OMQueue libraryChanges;
static BOOL libraryMutationActive(){return busy&&(action==LIB_FAVORITE||action==LIB_ARCHIVE);}
static void libraryFreeItems(NativeItem*items,int count){for(int i=0;i<count;i++){free(items[i].title);free(items[i].url);free(items[i].filename);free(items[i].note);free(items[i].collection);free(items[i].state);free(items[i].tags);}free(items);}
static void libraryStageCancel(){libraryFreeItems(libraryStaged,libraryStagedCount);libraryStaged=NULL;libraryStagedCount=0;libraryStaging=FALSE;}
static void libraryStageBegin(){libraryStageCancel();libraryStaging=TRUE;}
static void libraryClear(){libraryPage=0;libraryStageCancel();libraryHasVersion=FALSE;omClear(&libraryChanges);libraryUpdating=TRUE;if(libraryList)ListView_DeleteAllItems(libraryList);ovFree(&libraryRows);for(int i=0;i<libraryCollapsed.count;i++)free((void*)libraryCollapsed.names[i]);ocFree(&libraryCollapsed);libraryFreeItems(libraryItems,libraryCount);libraryItems=NULL;libraryCount=0;libraryUpdating=FALSE;}
static int librarySelected(){if(!libraryList)return -1;int row=ListView_GetNextItem(libraryList,-1,LVNI_SELECTED);if(row<0)return -1;int index=ovItem(&libraryRows,ovPageStart(&libraryRows,libraryPage)+row);return index<libraryCount?index:-1;}
static void libraryDetails(){if(libraryUpdating||!libraryList)return;int at=librarySelected();BOOL selected=at>=0;HWND controls[]={libraryOpen,libraryFavorite,libraryArchive,libraryDelete};for(int i=0;i<4;i++){BOOL mutation=i==1||i==2;EnableWindow(controls[i],selected&&!libraryDialogOpen&&(mutation?(!busy||libraryMutationActive())&&!omPending(&libraryChanges,libraryItems[at].id):!busy));}EnableWindow(librarySetCollection,selected&&!busy&&!libraryDialogOpen);if(!selected){SetWindowTextW(libraryDetailsBox,tr(L"Select an item to see its notes, file name or link."));return;}NativeItem*it=&libraryItems[at];SetWindowTextW(libraryOpen,it->article||it->snippet?(orivaArabic?L"تحرير المستند":L"Edit document"):it->file?tr(L"Download file"):tr(L"Open link"));SetWindowTextW(libraryFavorite,omPending(&libraryChanges,it->id)?tr(L"Saving..."):it->favorite?tr(L"Remove favorite"):tr(L"Add favorite"));SetWindowTextW(libraryArchive,it->archived?tr(L"Restore"):tr(L"Add Archive"));size_t n=wcslen(it->note)+wcslen(it->file?it->filename:it->url)+8;wchar_t*text=(wchar_t*)calloc(n,sizeof(wchar_t));if(text){swprintf(text,n,L"%ls\r\n%ls",it->file?it->filename:it->url,it->note);SetWindowTextW(libraryDetailsBox,text);free(text);}}
static BOOL libraryContains(const wchar_t*s,const wchar_t*find){if(!find[0])return TRUE;size_t n=wcslen(find),len=wcslen(s);for(size_t i=0;i+n<=len;i++)if(CompareStringOrdinal(s+(int)i,(int)n,find,(int)n,TRUE)==CSTR_EQUAL)return TRUE;return FALSE;}
static void librarySize(ULONGLONG size,wchar_t*out,size_t cap){if(size<1024)swprintf(out,cap,L"%llu B",size);else if(size<1024*1024)swprintf(out,cap,L"%.1f KB",size/1024.0);else swprintf(out,cap,L"%.1f MB",size/(1024.0*1024));}
static BOOL libraryMatches(const NativeItem*it,const wchar_t*query){
 if(it->deleted||(libraryFilter==0&&it->archived)||(libraryFilter==1&&!it->favorite)||(libraryFilter==2&&!it->archived)||(libraryFilter==3&&!ocVisible(it->collection,it->archived)))return FALSE;
 return libraryContains(it->title,query)||libraryContains(it->filename,query)||libraryContains(it->note,query)||libraryContains(it->collection,query)||libraryContains(it->url,query);
}
static void libraryFill(const wchar_t*restore){
 if(!libraryList)return;wchar_t query[512];GetWindowTextW(librarySearch,query,512);
 const wchar_t**names=malloc((size_t)(libraryCount+1)*sizeof(*names));unsigned char*visible=malloc((size_t)libraryCount+1);
 if(!names||!visible){free(names);free(visible);status(tr(L"Could not prepare the list. Your saved library is unchanged."));return;}
 for(int i=0;i<libraryCount;i++){names[i]=libraryItems[i].collection;visible[i]=(unsigned char)libraryMatches(&libraryItems[i],query);}
 int top=ListView_GetTopIndex(libraryList);libraryUpdating=TRUE;
 BOOL built=ovBuild(&libraryRows,names,visible,libraryCount,libraryFilter==3,&libraryCollapsed);free(names);free(visible);
 if(!built){libraryUpdating=FALSE;status(tr(L"Could not prepare the list. Your saved library is unchanged."));return;}
 ListView_SetItemState(libraryList,-1,0,LVIS_SELECTED|LVIS_FOCUSED);
 int pages=ovPageCount(&libraryRows);if(libraryPage>=pages)libraryPage=pages-1;if(libraryPage<0)libraryPage=0;int first=ovPageStart(&libraryRows,libraryPage),rows=ovPageSize(&libraryRows,libraryPage);
 ListView_SetItemCountEx(libraryList,rows,LVSICF_NOINVALIDATEALL|LVSICF_NOSCROLL);
 int select=-1;for(int row=first;restore&&row<first+rows;row++){int i=ovItem(&libraryRows,row);if(i>=0&&!wcscmp(restore,libraryItems[i].id)){select=row-first;break;}}
 if(restore&&select<0)for(int row=first;row<first+rows;row++)if(ovItem(&libraryRows,row)>=0){select=row-first;break;}
 if(select>=0)ListView_SetItemState(libraryList,select,LVIS_SELECTED|LVIS_FOCUSED,LVIS_SELECTED|LVIS_FOCUSED);
 if(top>=0&&top<rows)ListView_EnsureVisible(libraryList,top,FALSE);
 InvalidateRect(libraryList,NULL,TRUE);libraryUpdating=FALSE;
 SetWindowTextW(libraryEmpty,query[0]?tr(L"No matching items. Try another search."):libraryFilter==3?tr(L"No collections yet. Select an item and use Add Collection."):tr(L"Nothing here yet. Save a file to start your library."));
 ShowWindow(libraryEmpty,signedIn&&libraryView&&libraryRows.items==0?SW_SHOW:SW_HIDE);
 wchar_t message[100];swprintf(message,100,tr(L"%d items matched / %d saved in your account"),libraryRows.items,libraryCount);SetWindowTextW(libraryStatus,message);
 SetWindowTextW(libraryPagePrevious,tr(L"Previous"));SetWindowTextW(libraryPageNext,tr(L"Next"));swprintf(message,100,tr(L"Page %d / %d"),libraryPage+1,pages);SetWindowTextW(libraryPageLabel,message);
 ShowWindow(libraryPagePrevious,signedIn&&libraryView&&pages>1?SW_SHOW:SW_HIDE);ShowWindow(libraryPageNext,signedIn&&libraryView&&pages>1?SW_SHOW:SW_HIDE);ShowWindow(libraryPageLabel,signedIn&&libraryView&&pages>1?SW_SHOW:SW_HIDE);EnableWindow(libraryPagePrevious,libraryPage>0&&!libraryDialogOpen);EnableWindow(libraryPageNext,libraryPage+1<pages&&!libraryDialogOpen);libraryDetails();
}
static void libraryRowText(NMLVDISPINFOW*info){
 if(!(info->item.mask&LVIF_TEXT)||!info->item.pszText||info->item.cchTextMax<1)return;
 if(info->item.iItem<0){info->item.pszText[0]=0;return;}
 const wchar_t*text=L"";wchar_t formatted[256];int row=ovPageStart(&libraryRows,libraryPage)+info->item.iItem,column=info->item.iSubItem;
 if(row>=0&&row<libraryRows.count){int index=libraryRows.rows[row];
  if(index<0){int group=-index-1;if(column==0&&group<libraryRows.groups.count){const wchar_t*name=libraryRows.groups.names[group];swprintf(formatted,256,L"%ls %ls",ocFind(&libraryCollapsed,name)>=0?L"\x25B8":L"\x25BE",name);text=formatted;}}
  else if(index<libraryCount){NativeItem*it=&libraryItems[index];
   if(column==0)text=it->title;
   else if(column==1){text=it->article?(orivaArabic?L"مقال":L"Article"):it->snippet?(orivaArabic?L"شيفرة":L"Code"):it->file?tr(L"File"):tr(L"Link");if(it->file){const wchar_t*ext=wcsrchr(it->filename,L'.');if(ext&&wcslen(ext)<20&&wcslen(ext)>1){wcsncpy(formatted,ext+1,38);formatted[38]=0;CharUpperBuffW(formatted,(DWORD)wcslen(formatted));text=formatted;}}}
   else if(column==2)text=it->collection;
   else if(column==3){if(it->file){librarySize(it->size,formatted,256);text=formatted;}else text=L"-";}
   else if(column==4)text=it->favorite?tr(L"Yes"):L"";
  }
 }
 lstrcpynW(info->item.pszText,text,info->item.cchTextMax);
}
static int libraryFindRow(const NMLVFINDITEMW*find){
 if(!(find->lvfi.flags&LVFI_STRING)||!find->lvfi.psz)return -1;size_t length=wcslen(find->lvfi.psz);if(!length)return -1;
 int rows=ovPageSize(&libraryRows,libraryPage),first=ovPageStart(&libraryRows,libraryPage);if(!rows)return -1;
 int start=find->iStart;if(start<0||start>=rows)start=0;
 for(int step=0;step<rows;step++){int row=(start+step)%rows,index=ovItem(&libraryRows,first+row);if(index>=0&&index<libraryCount&&wcslen(libraryItems[index].title)>=length&&CompareStringOrdinal(libraryItems[index].title,(int)length,find->lvfi.psz,(int)length,TRUE)==CSTR_EQUAL)return row;}
 return -1;
}
static BOOL libraryToggleGroup(int row){
 if(row<0)return FALSE;row+=ovPageStart(&libraryRows,libraryPage);
 if(libraryFilter!=3||row<0||row>=libraryRows.count||libraryRows.rows[row]>=0)return FALSE;
 const wchar_t*name=libraryRows.groups.names[-libraryRows.rows[row]-1];int at=ocFind(&libraryCollapsed,name);
 if(at>=0){free((void*)libraryCollapsed.names[at]);memmove(libraryCollapsed.names+at,libraryCollapsed.names+at+1,(size_t)(libraryCollapsed.count-at-1)*sizeof(*libraryCollapsed.names));libraryCollapsed.count--;}
 else{wchar_t*copy=malloc((wcslen(name)+1)*sizeof(wchar_t));if(!copy)return TRUE;wcscpy(copy,name);const wchar_t**next=realloc(libraryCollapsed.names,(size_t)(libraryCollapsed.count+1)*sizeof(*next));if(!next){free(copy);return TRUE;}libraryCollapsed.names=next;libraryCollapsed.names[libraryCollapsed.count++]=copy;qsort(libraryCollapsed.names,libraryCollapsed.count,sizeof(*next),ocCompare);}
 libraryFill(NULL);return TRUE;
}
static void libraryUpdateRow(const wchar_t*id){
 int index=-1,row=-1;for(int i=0;i<libraryCount;i++)if(!wcscmp(libraryItems[i].id,id)){index=i;break;}if(index<0)return;
 for(int i=0;i<libraryRows.count;i++)if(libraryRows.rows[i]==index){row=i;break;}
 wchar_t query[512];GetWindowTextW(librarySearch,query,512);BOOL visible=libraryMatches(&libraryItems[index],query);
 if(row<0||!visible){wchar_t selected[40]=L"";int at=librarySelected();if(at>=0)wcscpy(selected,libraryItems[at].id);libraryFill(selected);return;}
 int first=ovPageStart(&libraryRows,libraryPage);if(row>=first&&row<first+ovPageSize(&libraryRows,libraryPage))ListView_RedrawItems(libraryList,row-first,row-first);libraryDetails();
}
static wchar_t*libraryString(const char*s,const OJToken*t,int object,const char*fieldName){int at=ojField(s,t,object,fieldName);if(at<0)return (wchar_t*)calloc(1,sizeof(wchar_t));return ojWide(s,t,at);}
static BOOL libraryPublish(const char*s){int count=0;OJToken*t=ojParse(s,&count);if(!t||count==0||t[0].type!='{'){free(t);return FALSE;}int array=ojField(s,t,0,"items");if(array<0||t[array].type!='['){free(t);return FALSE;}int n=0;for(int i=array+1;i<t[array].next;i=t[i].next){if(t[i].type!='{'||++n>(libraryStaging?200:10000)){free(t);return FALSE;}}NativeItem*items=(NativeItem*)calloc(n?n:1,sizeof(NativeItem));if(!items){free(t);return FALSE;}int k=0;for(int at=array+1;at<t[array].next;at=t[at].next,k++){NativeItem*it=&items[k];wchar_t*id=libraryString(s,t,at,"id"),*kind=libraryString(s,t,at,"kind");if(!id||!kind||wcslen(id)!=36){free(id);free(kind);goto bad;}for(int j=0;j<36;j++)if(!((id[j]>='0'&&id[j]<='9')||(id[j]>='a'&&id[j]<='f')||id[j]=='-')){free(id);free(kind);goto bad;}wcscpy(it->id,id);it->file=!wcscmp(kind,L"file");it->article=!wcscmp(kind,L"article");it->snippet=!wcscmp(kind,L"snippet");int deleted=ojField(s,t,at,"deleted_at");char*deletedText=deleted>=0?ojRaw(s,t,deleted):NULL;it->deleted=deletedText&&strtoull(deletedText,NULL,10)>0;free(deletedText);free(id);free(kind);it->title=libraryString(s,t,at,"title");it->url=libraryString(s,t,at,"url");it->filename=libraryString(s,t,at,"file_name");it->note=libraryString(s,t,at,"note");it->collection=libraryString(s,t,at,"collection");it->state=libraryString(s,t,at,"status");if(!it->title||!it->url||!it->filename||!it->note||!it->collection||!it->state)goto bad;it->archived=!wcscmp(it->state,L"archived");int rev=ojField(s,t,at,"revision");char*revText=rev>=0?ojRaw(s,t,rev):NULL;it->revision=revText?strtoull(revText,NULL,10):0;free(revText);it->favorite=ojTrue(s,t,ojField(s,t,at,"favorite"));int tags=ojField(s,t,at,"tags");if(tags>=0&&t[tags].type=='[')it->tags=ojRaw(s,t,tags);else{it->tags=(char*)malloc(3);if(it->tags)strcpy(it->tags,"[]");}if(!it->tags)goto bad;int size=ojField(s,t,at,"file_size");if(size>=0){char*raw=ojRaw(s,t,size);if(raw){it->size=strtoull(raw,NULL,10);free(raw);}}}free(t);if(libraryStaging){if(libraryStagedCount+n>100000){libraryFreeItems(items,n);return FALSE;}NativeItem*next=(NativeItem*)realloc(libraryStaged,(size_t)(libraryStagedCount+n+1)*sizeof(NativeItem));if(!next){libraryFreeItems(items,n);return FALSE;}libraryStaged=next;memcpy(libraryStaged+libraryStagedCount,items,(size_t)n*sizeof(NativeItem));libraryStagedCount+=n;free(items);return TRUE;}wchar_t selected[40]=L"";int old=librarySelected();if(old>=0)wcscpy(selected,libraryItems[old].id);libraryUpdating=TRUE;ListView_DeleteAllItems(libraryList);ovFree(&libraryRows);libraryFreeItems(libraryItems,libraryCount);libraryItems=items;libraryCount=n;libraryUpdating=FALSE;libraryFill(selected);return TRUE;bad:free(t);libraryFreeItems(items,n);return FALSE;}
static void libraryStageCommit(ULONGLONG version){wchar_t selected[40]=L"";int old=librarySelected();if(old>=0)wcscpy(selected,libraryItems[old].id);libraryUpdating=TRUE;ListView_DeleteAllItems(libraryList);ovFree(&libraryRows);libraryFreeItems(libraryItems,libraryCount);libraryItems=libraryStaged;libraryCount=libraryStagedCount;libraryStaged=NULL;libraryStagedCount=0;libraryStaging=FALSE;libraryUpdating=FALSE;libraryServerVersion=version;libraryHasVersion=TRUE;libraryFill(selected);}
static void libraryLayout(){if(!libraryList)return;RECT r;GetClientRect(window,&r);int w=r.right,h=r.bottom,name=w-500;if(name<240)name=240;MoveWindow(librarySave,w-340,42,170,42,TRUE);MoveWindow(libraryLogout,w-155,42,119,42,TRUE);for(int i=0;i<4;i++)MoveWindow(libraryTabs[i],36+i*144,130,132,40,TRUE);MoveWindow(libraryAddLink,w-196,130,160,40,TRUE);MoveWindow(librarySetCollection,642,h-106,w-678,42,TRUE);MoveWindow(librarySearch,36,192,w-278,40,TRUE);MoveWindow(libraryRefresh,w-226,192,190,40,TRUE);int widths[]={name,90,150,95,65};int left=46;for(int i=0;i<5;i++){MoveWindow(libraryHeadings[i],left,252,widths[i],23,TRUE);ListView_SetColumnWidth(libraryList,i,widths[i]);left+=widths[i];}int listH=h-493;if(listH<100)listH=100;MoveWindow(libraryList,36,278,w-72,listH,TRUE);MoveWindow(libraryEmpty,70,310,w-140,42,TRUE);MoveWindow(libraryDetailsBox,36,h-198,w-72,73,TRUE);MoveWindow(libraryOpen,36,h-106,160,42,TRUE);MoveWindow(libraryFavorite,210,h-106,160,42,TRUE);MoveWindow(libraryArchive,384,h-106,135,42,TRUE);MoveWindow(libraryDelete,533,h-106,95,42,TRUE);MoveWindow(libraryStatus,36,h-49,w-410,30,TRUE);MoveWindow(libraryPagePrevious,w-340,h-51,90,30,TRUE);MoveWindow(libraryPageLabel,w-245,h-47,110,26,TRUE);MoveWindow(libraryPageNext,w-125,h-51,90,30,TRUE);}
static void libraryVisibility(BOOL visible){HWND c[]={libraryList,librarySearch,libraryRefresh,libraryOpen,libraryFavorite,libraryArchive,libraryDelete,librarySave,libraryAddLink,librarySetCollection,libraryLogout,libraryDetailsBox,libraryStatus};for(size_t i=0;i<sizeof(c)/sizeof(c[0]);i++){ShowWindow(c[i],visible?SW_SHOW:SW_HIDE);EnableWindow(c[i],!busy||c[i]==libraryList||c[i]==librarySearch||c[i]==libraryDetailsBox);}for(int i=0;i<4;i++){ShowWindow(libraryTabs[i],visible?SW_SHOW:SW_HIDE);EnableWindow(libraryTabs[i],TRUE);}for(int i=0;i<5;i++)ShowWindow(libraryHeadings[i],visible?SW_SHOW:SW_HIDE);if(!visible)ShowWindow(libraryEmpty,SW_HIDE);if(visible){libraryLayout();libraryDetails();}BOOL pages=visible&&ovPageCount(&libraryRows)>1;ShowWindow(libraryPagePrevious,pages?SW_SHOW:SW_HIDE);ShowWindow(libraryPageNext,pages?SW_SHOW:SW_HIDE);ShowWindow(libraryPageLabel,pages?SW_SHOW:SW_HIDE);EnableWindow(libraryPagePrevious,pages&&libraryPage>0&&!libraryDialogOpen);EnableWindow(libraryPageNext,pages&&libraryPage+1<ovPageCount(&libraryRows)&&!libraryDialogOpen);}
static void libraryCreate(){libraryTabs[0]=add(L"BUTTON",tr(L"Library"),WS_TABSTOP|BS_OWNERDRAW,36,130,146,40,LIB_TAB_ALL);libraryTabs[1]=add(L"BUTTON",tr(L"Favorites"),WS_TABSTOP|BS_OWNERDRAW,194,130,146,40,LIB_TAB_FAVORITES);libraryTabs[2]=add(L"BUTTON",tr(L"Collections"),WS_TABSTOP|BS_OWNERDRAW,324,130,132,40,LIB_TAB_COLLECTIONS);libraryTabs[3]=add(L"BUTTON",tr(L"Archive"),WS_TABSTOP|BS_OWNERDRAW,468,130,132,40,LIB_TAB_ARCHIVE);libraryAddLink=add(L"BUTTON",(orivaArabic?L"+ جديد":L"+ New"),WS_TABSTOP|BS_OWNERDRAW,700,130,160,40,LIB_ADD_LINK);librarySetCollection=add(L"BUTTON",tr(L"Add Collection"),WS_TABSTOP|BS_OWNERDRAW,692,600,130,42,LIB_SET_COLLECTION);librarySearch=add(L"EDIT",L"",WS_TABSTOP|ES_AUTOHSCROLL|WS_BORDER,36,192,500,40,LIB_SEARCH);SendMessageW(librarySearch,EM_SETCUEBANNER,TRUE,(LPARAM)tr(L"Search files, links, notes and collections"));libraryRefresh=add(L"BUTTON",tr(L"Sync library"),WS_TABSTOP|BS_OWNERDRAW,600,192,170,40,LIB_FETCH);libraryList=add(WC_LISTVIEWW,L"",WS_TABSTOP|WS_BORDER|LVS_REPORT|LVS_OWNERDATA|LVS_SINGLESEL|LVS_SHOWSELALWAYS|LVS_NOCOLUMNHEADER,36,278,900,200,LIB_LIST);ListView_SetExtendedListViewStyle(libraryList,LVS_EX_FULLROWSELECT|LVS_EX_DOUBLEBUFFER);ListView_SetBkColor(libraryList,RGB(19,23,39));ListView_SetTextBkColor(libraryList,RGB(19,23,39));ListView_SetTextColor(libraryList,RGB(229,220,242));libraryRowHeight=ImageList_Create(1,43,ILC_COLOR32,1,1);if(libraryRowHeight)ListView_SetImageList(libraryList,libraryRowHeight,LVSIL_SMALL);const wchar_t*heads[]={tr(L"Name"),tr(L"Type"),tr(L"Collection"),tr(L"Size"),tr(L"Favorite")};for(int i=0;i<5;i++){LVCOLUMNW c={0};c.mask=LVCF_TEXT|LVCF_WIDTH;c.pszText=(wchar_t*)heads[i];c.cx=100;ListView_InsertColumn(libraryList,i,&c);libraryHeadings[i]=add(L"STATIC",heads[i],0,36,250,150,23,0);SendMessageW(libraryHeadings[i],WM_SETFONT,(WPARAM)small,TRUE);}libraryDetailsBox=add(L"EDIT",L"",ES_MULTILINE|ES_READONLY|ES_AUTOVSCROLL|WS_VSCROLL|WS_BORDER,36,500,900,73,0);SendMessageW(libraryDetailsBox,WM_SETFONT,(WPARAM)small,TRUE);libraryOpen=add(L"BUTTON",tr(L"Download / Open"),WS_TABSTOP|BS_OWNERDRAW,36,600,175,42,LIB_DOWNLOAD);libraryFavorite=add(L"BUTTON",tr(L"Add favorite"),WS_TABSTOP|BS_OWNERDRAW,225,600,175,42,LIB_FAVORITE);libraryArchive=add(L"BUTTON",tr(L"Add Archive"),WS_TABSTOP|BS_OWNERDRAW,414,600,135,42,LIB_ARCHIVE);libraryDelete=add(L"BUTTON",tr(L"Delete"),WS_TABSTOP|BS_OWNERDRAW,563,600,115,42,LIB_DELETE);librarySave=add(L"BUTTON",tr(L"+ Save a file"),WS_TABSTOP|BS_OWNERDRAW,700,42,170,42,LIB_SAVE);libraryLogout=add(L"BUTTON",tr(L"Sign out"),WS_TABSTOP|BS_OWNERDRAW,885,42,119,42,LOGOUT);libraryStatus=add(L"STATIC",tr(L"Syncing your library..."),SS_LEFT,36,700,900,30,0);SendMessageW(libraryStatus,WM_SETFONT,(WPARAM)small,TRUE);libraryEmpty=add(L"STATIC",tr(L"Syncing your library..."),SS_CENTER,70,310,850,42,0);libraryPagePrevious=add(L"BUTTON",tr(L"Previous"),WS_TABSTOP|BS_OWNERDRAW,0,0,90,30,LIB_PAGE_PREVIOUS);libraryPageNext=add(L"BUTTON",tr(L"Next"),WS_TABSTOP|BS_OWNERDRAW,0,0,90,30,LIB_PAGE_NEXT);libraryPageLabel=add(L"STATIC",L"",SS_CENTER,0,0,110,26,0);SendMessageW(libraryPageLabel,WM_SETFONT,(WPARAM)small,TRUE);}
static void libraryOpenWindow(){if(libraryDialogOpen){SetForegroundWindow(GetLastActivePopup(window));return;}libraryView=TRUE;layout();showApp();if(signedIn&&!busy){libraryQuiet=FALSE;start(LIB_FETCH);}}
static void libraryAuthExpired(){signedIn=FALSE;SecureZeroMemory(cookie,sizeof(cookie));DeleteFileW(sessionPath);status(tr(L"Your session expired. Sign in again to open your library."));}
static void libraryFetchWorker(){
 wchar_t cursor[100]=L"",path[300];ULONGLONG version=0;BOOL staging=FALSE,ok=FALSE;
 for(int page=0;page<1001;page++){
  if(page)swprintf(path,300,L"/api/library?limit=100&version=%llu&cursor=%ls",version,cursor);
  else if(libraryHasVersion)swprintf(path,300,L"/api/library?limit=100&sinceVersion=%llu",libraryServerVersion);
  else wcscpy(path,L"/api/library?limit=100");
  DWORD code=0;char*r=requestMethod(L"GET",path,NULL,NULL,&code);
  if(code!=200){if(code==401)libraryAuthExpired();else if(code==409)status(tr(L"Library changed during sync. Please sync again."));else status(tr(L"Could not sync. Check your connection, then click Sync library."));free(r);break;}
  int count=0;OJToken*t=ojParse(r,&count);if(!t||!count){free(t);free(r);break;}
  if(ojTrue(r,t,ojField(r,t,0,"unchanged"))){free(t);free(r);ok=TRUE;break;}
  int at=ojField(r,t,0,"version");char*number=at>=0?ojRaw(r,t,at):NULL;ULONGLONG offered=number?strtoull(number,NULL,10):0;free(number);
  wchar_t*next=ojWide(r,t,ojField(r,t,0,"nextCursor"));BOOL valid=TRUE;
  if(next){if(wcslen(next)>=100)valid=FALSE;for(const wchar_t*c=next;*c;c++)if(!wcschr(L"0123456789abcdef.-",*c))valid=FALSE;}
  free(t);if(!valid||(page&&offered!=version)){free(next);free(r);break;}version=offered;
  if(!staging){SendMessageW(window,LIB_STAGE_BEGIN,0,0);staging=TRUE;}
  BOOL accepted=(BOOL)SendMessageW(window,LIB_RESULT,0,(LPARAM)r);free(r);if(!accepted){free(next);break;}
  if(!next||!next[0]){free(next);SendMessageW(window,LIB_STAGE_COMMIT,(WPARAM)version,0);staging=FALSE;ok=TRUE;break;}
  wcscpy(cursor,next);free(next);
 }
 if(staging)SendMessageW(window,LIB_STAGE_CANCEL,0,0);
 if(!ok)status(tr(L"Could not synchronize every page. Your previous library was kept. Please sync again."));
}
static BOOL libraryDownload(const wchar_t*id,const wchar_t*destination,ULONGLONG expected,DWORD*code){*code=0;BOOL ok=FALSE;HINTERNET ses=NULL,con=NULL,req=NULL;HANDLE output=INVALID_HANDLE_VALUE;wchar_t directory[32768],temporary[MAX_PATH]=L"",path[100],headers[700];wcsncpy(directory,destination,32767);directory[32767]=0;wchar_t*slash=wcsrchr(directory,L'\\');if(!slash)return FALSE;*slash=0;if(!GetTempFileNameW(directory,L"orv",0,temporary))return FALSE;output=CreateFileW(temporary,GENERIC_WRITE,0,NULL,OPEN_EXISTING,FILE_ATTRIBUTE_TEMPORARY|FILE_FLAG_SEQUENTIAL_SCAN,NULL);if(output==INVALID_HANDLE_VALUE)goto done;ses=WinHttpOpen(L"Oriva Desktop/" ORIVA_VERSION_W,ORIVA_PROXY,WINHTTP_NO_PROXY_NAME,WINHTTP_NO_PROXY_BYPASS,0);if(!ses)goto done;WinHttpSetTimeouts(ses,15000,15000,180000,180000);con=orivaConnect(ses);if(!con)goto done;swprintf(path,100,L"/api/files/%ls",id);req=WinHttpOpenRequest(con,L"GET",path,NULL,WINHTTP_NO_REFERER,WINHTTP_DEFAULT_ACCEPT_TYPES,ORIVA_REQUEST_FLAGS);if(!req)goto done;if(!orivaAllowedPath(path)||!orivaNoRedirect(req))goto done;swprintf(headers,700,L"Cookie: %ls\r\n",cookie);if(!WinHttpSendRequest(req,headers,(DWORD)-1L,NULL,0,0,0)||(!WinHttpReceiveResponse(req,NULL)||!orivaResponseIdentity(req)))goto done;DWORD size=sizeof(DWORD);if(!WinHttpQueryHeaders(req,WINHTTP_QUERY_STATUS_CODE|WINHTTP_QUERY_FLAG_NUMBER,WINHTTP_HEADER_NAME_BY_INDEX,code,&size,WINHTTP_NO_HEADER_INDEX)||*code!=200)goto done;ULONGLONG total=0;BYTE buffer[65536];for(;;){DWORD n=0,written=0;if(!WinHttpReadData(req,buffer,sizeof(buffer),&n))goto done;if(!n)break;if(total+n>expected||!WriteFile(output,buffer,n,&written,NULL)||written!=n)goto done;total+=n;wchar_t msg[100];swprintf(msg,100,tr(L"Downloading... %u%%"),expected?(unsigned)(total*100/expected):100);status(msg);}if(total!=expected||!FlushFileBuffers(output))goto done;CloseHandle(output);output=INVALID_HANDLE_VALUE;SetFileAttributesW(temporary,FILE_ATTRIBUTE_NORMAL);if(!MoveFileExW(temporary,destination,MOVEFILE_REPLACE_EXISTING|MOVEFILE_WRITE_THROUGH))goto done;ok=TRUE;done:if(output!=INVALID_HANDLE_VALUE)CloseHandle(output);if(req)WinHttpCloseHandle(req);if(con)WinHttpCloseHandle(con);if(ses)WinHttpCloseHandle(ses);if(!ok&&temporary[0])DeleteFileW(temporary);return ok;}
static void libraryDownloadWorker(){DWORD code;BOOL ok=libraryDownload(libraryJobId,libraryDestination,libraryDownloadSize,&code);if(ok)status(tr(L"File downloaded. Your saved original in Oriva is unchanged."));else if(code==401)libraryAuthExpired();else status(tr(L"Could not finish the download. No incomplete file was kept. Please try again."));}
static void libraryMutationFinish(BOOL saved,DWORD code){
 OMChange*c=omPop(&libraryChanges);if(!c)return;
 if(!saved){for(int i=0;i<libraryCount;i++)if(!wcscmp(libraryItems[i].id,c->id)){NativeItem*it=&libraryItems[i];it->favorite=c->previousFavorite;it->archived=c->previousArchived;free(it->state);it->state=c->previousState;c->previousState=NULL;break;}libraryUpdateRow(c->id);}
 if(saved){for(int i=0;i<libraryCount;i++)if(!wcscmp(libraryItems[i].id,c->id)){libraryItems[i].revision++;break;}}omFree(c);libraryDetails();
 if(!saved&&code==401){libraryAuthExpired();omClear(&libraryChanges);}
 else if(!saved&&(code==409||code==428)){status(tr(L"This item changed on another device. Sync before trying again."));}else if(!saved)status(tr(L"Could not confirm this change. Its previous state was restored. Check your connection and try again."));
 else status(libraryChanges.count?tr(L"Saving remaining changes in the background..."):tr(L"All changes saved to your account."));
}
static BOOL libraryPump(){if(busy||!libraryChanges.head||!signedIn)return FALSE;wcscpy(libraryJobId,libraryChanges.head->id);start(libraryChanges.head->command);return TRUE;}
static void libraryMutationWorker(int job){wchar_t path[100];swprintf(path,100,L"/api/items/%ls",libraryJobId);DWORD code;char deleteBody[100];snprintf(deleteBody,100,"{\"revision\":%llu}",libraryJobRevision);const char*body=job==LIB_DELETE?deleteBody:libraryChanges.head->body;char*r=requestMethod(job==LIB_DELETE?L"DELETE":L"PATCH",path,body,NULL,&code);
 if(job!=LIB_DELETE)SendMessageW(window,LIB_MUTATION_RESULT,code==200,code);
 else if(code==200){status(tr(L"Item deleted from your account."));libraryQuiet=TRUE;libraryFetchWorker();}else if(code==401)libraryAuthExpired();else error(r,code);free(r);
}
static char*libraryPatchBody(NativeItem*it,int job){char*out=NULL;if(!it->revision)return NULL;if(job==LIB_FAVORITE||job==LIB_ARCHIVE){out=(char*)malloc(200);if(out){if(job==LIB_FAVORITE)snprintf(out,200,"{\"revision\":%llu,\"favorite\":%s}",it->revision,it->favorite?"false":"true");else snprintf(out,200,"{\"revision\":%llu,\"status\":\"%s\"}",it->revision,it->archived?"inbox":"archived");}}else{char*collection=escape(it->collection);if(collection){size_t n=strlen(collection)+100;out=(char*)malloc(n);if(out)snprintf(out,n,"{\"revision\":%llu,\"collection\":\"%s\"}",it->revision,collection);free(collection);}}return out;}
static void libraryCommand(int command){if(libraryDialogOpen)return;if(command==LIB_PAGE_PREVIOUS||command==LIB_PAGE_NEXT){libraryPage+=command==LIB_PAGE_NEXT?1:-1;libraryFill(NULL);ListView_EnsureVisible(libraryList,0,FALSE);return;}if(command==LIB_SEARCH){wchar_t selected[40]=L"";int at=librarySelected();if(at>=0)wcscpy(selected,libraryItems[at].id);libraryPage=0;libraryFill(selected);return;}if((command>=LIB_TAB_ALL&&command<=LIB_TAB_ARCHIVE)||command==LIB_TAB_COLLECTIONS){libraryPage=0;libraryFilter=command==LIB_TAB_COLLECTIONS?3:command-LIB_TAB_ALL;libraryFill(NULL);InvalidateRect(window,NULL,TRUE);return;}if(busy&&!(libraryMutationActive()&&(command==LIB_FAVORITE||command==LIB_ARCHIVE)))return;if(command==LIB_ADD_LINK){contentNewMenu();return;}if(command==LIB_SET_COLLECTION){linkFormOpen(TRUE);return;}if(command==LIB_SAVE){libraryView=FALSE;layout();showApp();if(!pending[0])choose();else status(tr(L"Selected file ready. Choose a name and click Save to Oriva."));return;}if(command==LIB_FETCH){libraryQuiet=FALSE;start(LIB_FETCH);return;}int at=librarySelected();if(at<0)return;NativeItem*it=&libraryItems[at];if(command==LIB_DOWNLOAD){if(it->article||it->snippet){contentOpen(it->id,it->snippet?L"snippet":L"article");return;}if(!it->file){if(!_wcsnicmp(it->url,L"https://",8)||!_wcsnicmp(it->url,L"http://",7))openExternal(window,it->url);return;}wchar_t name[32768];wcsncpy(name,it->filename[0]?it->filename:it->title,32767);name[32767]=0;for(wchar_t*c=name;*c;c++)if(*c<32||wcschr(L"\\/:*?\"<>|",*c))*c=L'_';OPENFILENAMEW of={sizeof(of)};of.hwndOwner=window;of.lpstrFile=name;of.nMaxFile=32768;of.lpstrFilter=tr(L"All files\0*.*\0\0");of.Flags=OFN_OVERWRITEPROMPT|OFN_PATHMUSTEXIST|OFN_NOCHANGEDIR;of.lpstrTitle=tr(L"Download from Oriva");libraryDialogOpen=TRUE;BOOL chosen=GetSaveFileNameW(&of);libraryDialogOpen=FALSE;if(chosen){wcscpy(libraryDestination,name);libraryDownloadSize=it->size;wcscpy(libraryJobId,it->id);start(LIB_DOWNLOAD);}return;}if(command==LIB_DELETE){libraryDialogOpen=TRUE;int answer=orivaMessageBox(window,(orivaArabic?L"نقل هذا العنصر إلى المحذوفات القابلة للاستعادة على كل الأجهزة؟":L"Move this item to recoverable trash on every device?"),L"Oriva",MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2);libraryDialogOpen=FALSE;if(answer!=IDYES)return;}if(command==LIB_DELETE){wcscpy(libraryJobId,it->id);libraryJobRevision=it->revision;start(command);return;}
 if(command==LIB_FAVORITE||command==LIB_ARCHIVE){
  if(omPending(&libraryChanges,it->id))return;
  char*body=libraryPatchBody(it,command);wchar_t*state=NULL;
  if(command==LIB_ARCHIVE){const wchar_t*next=it->archived?L"inbox":L"archived";state=(wchar_t*)malloc((wcslen(next)+1)*sizeof(wchar_t));if(state)wcscpy(state,next);}
  if(!body||(command==LIB_ARCHIVE&&!state)||!omAppend(&libraryChanges,it->id,it->state,it->favorite,it->archived,command,body)){free(body);free(state);status(tr(L"Could not queue this change. Please try again after the current saves finish."));return;}
  wchar_t selected[40];wcscpy(selected,it->id);if(command==LIB_FAVORITE)it->favorite=!it->favorite;else{it->archived=!it->archived;free(it->state);it->state=state;}
  libraryUpdateRow(selected);status(tr(L"Saving changes in the background..."));libraryPump();
 }
}
#endif
