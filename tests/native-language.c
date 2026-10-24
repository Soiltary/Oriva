#include <assert.h>
#include "native-check.h"
#include <stdio.h>
#include "../desktop/windows/oriva-text.h"
static int formats(const wchar_t*s,wchar_t*out){int n=0;for(;*s;s++)if(*s==L'%'){s++;if(*s==L'%')continue;while(*s&&wcschr(L"0123456789.-+ #hlzjt",*s))s++;assert(*s);assert(n<30);out[n++]=*s;}out[n]=0;return n;}
int main(void){
 orivaArabic=0;assert(!wcscmp(tr(L"Library"),L"Library"));
 orivaArabic=1;assert(!wcscmp(tr(L"Library"),L"المكتبة"));assert(!wcscmp(tr(L"Add Link"),L"إضافة رابط"));assert(!wcscmp(tr(L"Email or password is incorrect"),L"البريد الإلكتروني أو كلمة المرور غير صحيحة"));
 const wchar_t*user=L"Sultan — ملفي https://example.com";assert(tr(user)==user&&orivaRetranslate(user)==user);
 unsigned count=sizeof(orivaTexts)/sizeof(orivaTexts[0]);assert(count>140);
 for(unsigned i=0;i<count;i++){
  const OrivaText*text=&orivaTexts[i];assert(*text->en&&*text->ar);wchar_t a[32],b[32];assert(formats(text->en,a)==formats(text->ar,b)&&!wcscmp(a,b));
  for(unsigned j=0;j<i;j++)assert(wcscmp(text->en,orivaTexts[j].en));
  orivaArabic=1;assert(!wcscmp(tr(text->en),text->ar));assert(!wcscmp(orivaRetranslate(text->en),text->ar));
  orivaArabic=0;const wchar_t*back=orivaRetranslate(text->ar);orivaArabic=1;assert(!wcscmp(tr(back),text->ar));
 }
 printf("PASS %u Arabic translations, live round-trip switching, placeholder signatures and unchanged user content\n",count);
}
