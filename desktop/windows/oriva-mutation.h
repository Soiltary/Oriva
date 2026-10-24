#ifndef ORIVA_MUTATION_H
#define ORIVA_MUTATION_H
#include <stdlib.h>
#include <wchar.h>
/* UI-owned FIFO. A row has at most one unconfirmed change. Bodies and rollback
   snapshots stay alive until the network worker reports its result. */
typedef struct OMChange {struct OMChange *next;wchar_t id[40],*previousState;char *body;int command,previousFavorite,previousArchived;} OMChange;
typedef struct {OMChange *head,*tail;unsigned count;} OMQueue;
static int omPending(const OMQueue*q,const wchar_t*id){for(const OMChange*c=q->head;c;c=c->next)if(!wcscmp(c->id,id))return 1;return 0;}
/* Takes ownership of body only on success. */
static int omAppend(OMQueue*q,const wchar_t*id,const wchar_t*state,int favorite,int archived,int command,char*body){if(!body||wcslen(id)>=40||q->count>=128||omPending(q,id))return 0;OMChange*c=(OMChange*)calloc(1,sizeof(*c));if(!c)return 0;c->previousState=(wchar_t*)malloc((wcslen(state)+1)*sizeof(wchar_t));if(!c->previousState){free(c);return 0;}wcscpy(c->id,id);wcscpy(c->previousState,state);c->previousFavorite=favorite;c->previousArchived=archived;c->command=command;c->body=body;if(q->tail)q->tail->next=c;else q->head=c;q->tail=c;q->count++;return 1;}
static OMChange*omPop(OMQueue*q){OMChange*c=q->head;if(!c)return NULL;q->head=c->next;if(!q->head)q->tail=NULL;c->next=NULL;q->count--;return c;}
static void omFree(OMChange*c){if(c){free(c->body);free(c->previousState);free(c);}}
static void omClear(OMQueue*q){OMChange*c;while((c=omPop(q)))omFree(c);}
#endif
