#include <assert.h>
#include "native-check.h"
#include <stdio.h>
#include "../desktop/windows/oriva-collections.h"
int main(void){assert(ocVisible(L"Study",0));assert(!ocVisible(L"Study",1));assert(!ocVisible(L"",0));assert(!ocVisible(L" ",0));
 const wchar_t*names[]={L"Movies",L"دراسة",L"",L"Movies",L"شغل",L"دراسة",L"movies"};OCIndex groups=ocBuild(names,7);assert(groups.count==4);assert(ocFind(&groups,L"")==-1);assert(!ocAssigned(L""));assert(!ocAssigned(L" \t \n"));assert(!ocAssigned(L"\u00a0\u2003"));assert(ocAssigned(L"دراسة"));assert(ocFind(&groups,L"دراسة")>=0);assert(ocFind(&groups,L"Movies")!=ocFind(&groups,L"movies"));assert(ocFind(&groups,L"Missing")==-1);ocFree(&groups);assert(!groups.names&&!groups.count);
 const wchar_t*empty[]={L"",L" ",L"\t"};groups=ocBuild(empty,3);assert(groups.count==0);ocFree(&groups);
 groups=ocBuild(NULL,0);assert(!groups.count&&ocFind(&groups,L"none")==-1);ocFree(&groups);
 wchar_t storage[10000][24];const wchar_t*many[10000];for(int i=0;i<10000;i++){swprintf(storage[i],24,L"Collection %04d",i%500);many[i]=storage[i];}groups=ocBuild(many,10000);assert(groups.count==500);for(int i=0;i<10000;i++)assert(ocFind(&groups,many[i])>=0);ocFree(&groups);
 puts("PASS native collection grouping: Arabic, exclusion of unfiled/blank names, exact names, deduplication and 10000 saved items");
}
