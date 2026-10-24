#ifndef ORIVA_COLLECTIONS_H
#define ORIVA_COLLECTIONS_H
#include <stdlib.h>
#include <wchar.h>
static int ocAssigned(const wchar_t*s){if(!s)return 0;for(;*s;s++){unsigned c=(unsigned)*s;if(c!=32&&!(c>=9&&c<=13)&&c!=0xa0&&c!=0x1680&&!(c>=0x2000&&c<=0x200a)&&c!=0x2028&&c!=0x2029&&c!=0x202f&&c!=0x205f&&c!=0x3000&&c!=0xfeff)return 1;}return 0;}
static int ocVisible(const wchar_t*name,int archived){return !archived&&ocAssigned(name);}
typedef struct{const wchar_t**names;int count;} OCIndex;
static int ocCompare(const void*a,const void*b){return wcscmp(*(const wchar_t*const*)a,*(const wchar_t*const*)b);}
static OCIndex ocBuild(const wchar_t*const*names,int count){OCIndex out={0};if(!count)return out;out.names=(const wchar_t**)malloc((size_t)count*sizeof(wchar_t*));if(!out.names)return out;int assigned=0;for(int i=0;i<count;i++)if(ocAssigned(names[i]))out.names[assigned++]=names[i];qsort(out.names,assigned,sizeof(wchar_t*),ocCompare);for(int i=0;i<assigned;i++)if(!out.count||wcscmp(out.names[i],out.names[out.count-1]))out.names[out.count++]=out.names[i];return out;}
static int ocFind(const OCIndex*index,const wchar_t*name){int lo=0,hi=index->count;while(lo<hi){int mid=lo+(hi-lo)/2,order=wcscmp(index->names[mid],name);if(order<0)lo=mid+1;else hi=mid;}return lo<index->count&&!wcscmp(index->names[lo],name)?lo:-1;}
static void ocFree(OCIndex*index){free(index->names);index->names=NULL;index->count=0;}
#endif
