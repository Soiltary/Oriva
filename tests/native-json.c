#include <assert.h>
#include "native-check.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "../desktop/windows/oriva-json.h"
static void rejects(const char*s){int n=0;OJToken*t=ojParse(s,&n);assert(t==NULL);}
int main(void){
 const char*s="{\"items\":[{\"title\":\"سلام \\ud83d\\ude00\",\"favorite\":true,\"note\":\"line 1\\nline 2 \\\"quoted\\\"\",\"tags\":[\"a\",\"b\"]}],\"extra\":null}";
 int n=0;OJToken*t=ojParse(s,&n);assert(t&&n>10);int array=ojField(s,t,0,"items"),item=array+1;assert(t[array].type=='['&&t[item].type=='{');assert(ojTrue(s,t,ojField(s,t,item,"favorite")));
 wchar_t*title=ojWide(s,t,ojField(s,t,item,"title"));assert(title&&title[0]==0x633&&title[1]==0x644&&title[2]==0x627&&title[3]==0x645&&title[4]==32&&title[5]==0xd83d&&title[6]==0xde00&&title[7]==0);free(title);
 wchar_t*note=ojWide(s,t,ojField(s,t,item,"note"));assert(note&&wcschr(note,L'\n')&&wcschr(note,L'"'));free(note);char*tags=ojRaw(s,t,ojField(s,t,item,"tags"));assert(tags&&!strcmp(tags,"[\"a\",\"b\"]"));free(tags);assert(ojField(s,t,item,"missing")==-1);free(t);
 const char*raw="{\"s\":\"😀\"}";t=ojParse(raw,&n);assert(t);title=ojWide(raw,t,ojField(raw,t,0,"s"));assert(title&&title[0]==0xd83d&&title[1]==0xde00&&title[2]==0);free(title);free(t);
 const char*badWide="{\"s\":\"\\ud800x\"}";t=ojParse(badWide,&n);assert(t);assert(ojWide(badWide,t,ojField(badWide,t,0,"s"))==NULL);free(t);
 rejects("");rejects("{\"items\":[,]}");rejects("{\"a\":1,}");rejects("[1,]");rejects("[01]");rejects("[1.]");rejects("[1e+]");rejects("{\"a\":\"\\uZZZZ\"}");rejects("[true] garbage");
 char deep[200];memset(deep,'[',90);memset(deep+90,']',90);deep[180]=0;rejects(deep);
 size_t cap=1500000;char*large=malloc(cap);size_t used=0;used+=(size_t)sprintf(large+used,"{\"items\":[");for(int i=0;i<10000;i++)used+=(size_t)sprintf(large+used,"%s{\"id\":%d,\"title\":\"File %d\",\"tags\":[\"one\",\"two\"]}",i?",":"",i,i);strcpy(large+used,"]}");t=ojParse(large,&n);assert(t);array=ojField(large,t,0,"items");int entries=0;for(int i=array+1;i<t[array].next;i=t[i].next)entries++;assert(entries==10000);free(t);free(large);
 unsigned seed=7;for(int trial=0;trial<30000;trial++){char fuzz[130];seed=seed*1664525u+1013904223u;int len=(int)(seed%128);for(int j=0;j<len;j++){seed=seed*1664525u+1013904223u;fuzz[j]=(char)(1+seed%126);}fuzz[len]=0;t=ojParse(fuzz,&n);if(t){for(int i=0;i<n;i++){assert(t[i].start>=0&&t[i].end<=len&&t[i].end>=t[i].start&&t[i].next>i&&t[i].next<=n);if(t[i].type=='"'){wchar_t*w=ojWide(fuzz,t,i);free(w);}}free(t);}}
 puts("PASS native JSON: Arabic and emoji UTF-16, escaped notes, tags, malformed data, nesting limits, 10000 items and 30000 fuzz inputs");return 0;
}
