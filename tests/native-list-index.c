#include <assert.h>
#include "native-check.h"
#include "../desktop/windows/oriva-list-index.h"
int main(void){
 enum{N=10000};const wchar_t**names=malloc(N*sizeof(*names));unsigned char*visible=malloc(N);assert(names&&visible);OVIndex index={0};
 for(int i=0;i<N;i++){names[i]=i%3==0?L"عربي":i%3==1?L"English":L"Group";visible[i]=1;}
 assert(ovBuild(&index,names,visible,N,0,NULL));assert(index.count==N&&index.items==N);for(int i=0;i<N;i++)assert(ovItem(&index,i)==i);
 assert(ovPageCount(&index)==50&&ovPageStart(&index,49)==9800&&ovPageSize(&index,49)==200);
 for(int page=0;page<ovPageCount(&index);page++){assert(ovPageSize(&index,page)<=200);for(int row=0;row<ovPageSize(&index,page);row++)assert(ovItem(&index,ovPageStart(&index,page)+row)==page*200+row);}
 assert(ovPageStart(&index,-1)==0&&ovPageStart(&index,999)==9800);
 assert(ovItem(&index,-1)==-1&&ovItem(&index,N)==-1);
 assert(ovBuild(&index,names,visible,N,1,NULL));assert(index.groups.count==3&&index.count==N+3&&index.items==N);
 unsigned char*seen=calloc(N,1);assert(seen);int headers=0;for(int r=0;r<index.count;r++){int i=ovItem(&index,r);if(i<0)headers++;else{assert(!seen[i]);seen[i]=1;}}assert(headers==3);for(int i=0;i<N;i++)assert(seen[i]);
 const wchar_t*collapsedNames[]={L"English"};OCIndex collapsed={collapsedNames,1};assert(ovBuild(&index,names,visible,N,1,&collapsed));assert(index.items==N&&index.count==N+3-N/3);for(int r=0;r<index.count;r++){int i=ovItem(&index,r);assert(i<0||wcscmp(names[i],L"English"));}
 // Filtering, exact Unicode grouping and retained source indexes under rebuild.
 memset(visible,0,N);visible[9999]=1;assert(ovBuild(&index,names,visible,N,1,NULL));assert(index.count==2&&index.items==1&&ovItem(&index,1)==9999);assert(!wcscmp(index.groups.names[-index.rows[0]-1],L"عربي"));
 for(int round=0;round<200;round++){for(int i=0;i<N;i++)visible[i]=(i+round)%7==0;assert(ovBuild(&index,names,visible,N,round%2,NULL));int matches=0;memset(seen,0,N);for(int r=0;r<index.count;r++){int i=ovItem(&index,r);if(i>=0){assert(visible[i]&&!seen[i]);seen[i]=1;matches++;}}assert(matches==index.items);for(int i=0;i<N;i++)assert(seen[i]==visible[i]);}
 memset(visible,0,N);assert(ovBuild(&index,names,visible,N,1,NULL)&&index.count==0&&index.items==0);
 assert(!ovBuild(&index,names,visible,100001,1,NULL)&&index.count==0);ovFree(&index);ovFree(&index);free(seen);free(names);free(visible);
 puts("PASS virtual10k source-index identity, exact Unicode groups, collapse/expand, filtering, 200 repeated rebuilds, no duplicates/loss and cleanup");return 0;
}
