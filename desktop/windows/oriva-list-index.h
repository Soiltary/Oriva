#ifndef ORIVA_LIST_INDEX_H
#define ORIVA_LIST_INDEX_H
#include "oriva-collections.h"
#include <string.h>
/* Virtual rows retain library indexes; negative rows identify collection
   headers. Data remains in NativeItem, never duplicated into 50,000 cells. */
typedef struct {int item,group;} OVPair;
typedef struct {int*rows;int count,items;OCIndex groups;} OVIndex;
#define OV_PAGE_ROWS 200
static int ovPageCount(const OVIndex*index){return index->count?(index->count+OV_PAGE_ROWS-1)/OV_PAGE_ROWS:1;}
static int ovPageStart(const OVIndex*index,int page){int pages=ovPageCount(index);if(page<0)page=0;if(page>=pages)page=pages-1;return page*OV_PAGE_ROWS;}
static int ovPageSize(const OVIndex*index,int page){int left=index->count-ovPageStart(index,page);return left>OV_PAGE_ROWS?OV_PAGE_ROWS:left;}
static int ovCompare(const void*a,const void*b){const OVPair*x=a,*y=b;return x->group!=y->group?(x->group<y->group?-1:1):(x->item>y->item)-(x->item<y->item);}
static void ovFree(OVIndex*index){free(index->rows);ocFree(&index->groups);memset(index,0,sizeof(*index));}
static int ovBuild(OVIndex*out,const wchar_t*const*names,const unsigned char*visible,int count,int grouped,const OCIndex*collapsed){
 OVIndex next={0};if(count<0||count>100000)return 0;
 next.rows=malloc((size_t)(count*2+1)*sizeof(int));if(!next.rows)return 0;
 if(!grouped){for(int i=0;i<count;i++)if(visible[i])next.rows[next.count++]=i;next.items=next.count;}
 else{
  next.groups=ocBuild(names,count);if(count&&!next.groups.names){ovFree(&next);return 0;}
  OVPair*pairs=malloc((size_t)(count+1)*sizeof(*pairs));if(!pairs){ovFree(&next);return 0;}int n=0;
  for(int i=0;i<count;i++)if(visible[i]){int group=ocFind(&next.groups,names[i]);if(group>=0)pairs[n++]=(OVPair){i,group};}
  qsort(pairs,n,sizeof(*pairs),ovCompare);int previous=-1,hidden=0;
  for(int i=0;i<n;i++){int group=pairs[i].group;if(group!=previous){previous=group;next.rows[next.count++]=-group-1;hidden=collapsed&&ocFind(collapsed,next.groups.names[group])>=0;}next.items++;if(!hidden)next.rows[next.count++]=pairs[i].item;}
  free(pairs);
 }
 ovFree(out);*out=next;return 1;
}
static int ovItem(const OVIndex*index,int row){return row>=0&&row<index->count&&index->rows[row]>=0?index->rows[row]:-1;}
#endif
