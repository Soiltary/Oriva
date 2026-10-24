#include <assert.h>
#include "native-check.h"
#include <stdio.h>
#include <string.h>
#include "../desktop/windows/oriva-mutation.h"
static char*body(const char*s){char*b=malloc(strlen(s)+1);assert(b);strcpy(b,s);return b;}
int main(void){
 OMQueue q={0};wchar_t state[30]=L"reading";char*b=body("favorite=true");
 assert(omAppend(&q,L"first",state,0,0,502,b));state[0]=L'X';
 assert(!wcscmp(q.head->previousState,L"reading"));assert(q.count==1&&q.tail==q.head);
 b=body("duplicate");assert(!omAppend(&q,L"first",L"archived",1,1,503,b));free(b);
 assert(omAppend(&q,L"second",L"archived",1,1,503,body("restore")));
 /* Completion removes only the active row; another row remains queued. */
 OMChange*c=omPop(&q);assert(!wcscmp(c->id,L"first"));assert(!strcmp(c->body,"favorite=true"));assert(!c->previousFavorite&&!c->previousArchived);omFree(c);
 assert(!omPending(&q,L"first")&&omPending(&q,L"second"));
 c=omPop(&q);assert(c->previousFavorite&&c->previousArchived);assert(!wcscmp(c->previousState,L"archived"));
 /* Failed archive can transfer the original state back without double-free. */
 wchar_t*restored=c->previousState;c->previousState=NULL;omFree(c);assert(!wcscmp(restored,L"archived"));free(restored);assert(!q.head&&!q.tail&&!q.count);
 /* Rapid batch: bounded memory, FIFO order, no dropped or duplicate rows. */
 for(int round=0;round<500;round++){
  for(int i=0;i<128;i++){wchar_t id[40];swprintf(id,40,L"row-%d",i);assert(omAppend(&q,id,L"inbox",i%2,0,502,body("{}")));}
  b=body("overflow");assert(!omAppend(&q,L"overflow",L"inbox",0,0,502,b));free(b);assert(q.count==128);
  for(int i=0;i<128;i++){wchar_t id[40];swprintf(id,40,L"row-%d",i);c=omPop(&q);assert(c&&!wcscmp(c->id,id));assert(c->previousFavorite==i%2);omFree(c);}
  assert(!q.head&&!q.tail&&!q.count&&!omPop(&q));
 }
 assert(omAppend(&q,L"cancel",L"done",1,0,503,body("{}")));omClear(&q);assert(!q.head&&!q.tail&&!q.count);
 b=body("invalid");assert(!omAppend(&q,L"1234567890123456789012345678901234567890",L"inbox",0,0,502,b));free(b);
 puts("PASS rapid mutation FIFO, duplicate prevention, bounded capacity, rollback snapshots and cleanup");
}
