#ifdef ORIVA_STAGING_ONLY
#error "Private staging tooling is excluded from this public source export; refusing this build configuration."
#endif
#ifndef ORIVA_LANGUAGE_H
#define ORIVA_LANGUAGE_H
#include "oriva-text.h"
#define CHANGE_LANGUAGE 730
static HWND languageButton;
static void languageRead(){DWORD value=0,bytes=sizeof(value);if(RegGetValueW(HKEY_CURRENT_USER,L"Software\\Oriva",L"Language",RRF_RT_REG_DWORD,NULL,&value,&bytes)==ERROR_SUCCESS&&value<=1)orivaArabic=value;else orivaArabic=PRIMARYLANGID(GetUserDefaultUILanguage())==LANG_ARABIC;}
static void languageSave(){HKEY key;if(RegCreateKeyExW(HKEY_CURRENT_USER,L"Software\\Oriva",0,NULL,0,KEY_SET_VALUE,NULL,&key,NULL)==ERROR_SUCCESS){DWORD value=orivaArabic;RegSetValueExW(key,L"Language",0,REG_DWORD,(BYTE*)&value,sizeof(value));RegCloseKey(key);}}
static int orivaMessageBox(HWND owner,const wchar_t*text,const wchar_t*caption,UINT flags){
 return MessageBoxExW(owner,tr(text),tr(caption),flags|(orivaArabic?MB_RTLREADING|MB_RIGHT:0),orivaArabic?MAKELANGID(LANG_ARABIC,SUBLANG_ARABIC_SAUDI_ARABIA):0);}
static void languageDirection(HWND h,BOOL mirror){LONG_PTR ex=GetWindowLongPtrW(h,GWL_EXSTYLE);ex&=~(WS_EX_LAYOUTRTL|WS_EX_RTLREADING|WS_EX_RIGHT|WS_EX_NOINHERITLAYOUT);if(orivaArabic&&mirror)ex|=WS_EX_LAYOUTRTL|WS_EX_RTLREADING;else ex|=WS_EX_NOINHERITLAYOUT;SetWindowLongPtrW(h,GWL_EXSTYLE,ex);SetWindowPos(h,NULL,0,0,0,0,SWP_NOMOVE|SWP_NOSIZE|SWP_NOZORDER|SWP_NOACTIVATE|SWP_FRAMECHANGED);}
static void languageInput(HWND h,BOOL rtl){if(!h)return;languageDirection(h,rtl);LONG_PTR style=GetWindowLongPtrW(h,GWL_STYLE);style&=~(ES_RIGHT|ES_CENTER);if(orivaArabic&&rtl)style|=ES_RIGHT;SetWindowLongPtrW(h,GWL_STYLE,style);SetWindowPos(h,NULL,0,0,0,0,SWP_NOMOVE|SWP_NOSIZE|SWP_NOZORDER|SWP_NOACTIVATE|SWP_FRAMECHANGED);}
static void languageLabel(HWND h){if(!h)return;wchar_t text[2048];GetWindowTextW(h,text,2048);SetWindowTextW(h,orivaRetranslate(text));}
static void languageLayout(HWND owner){if(!languageButton)return;RECT r;GetClientRect(owner,&r);MoveWindow(languageButton,r.right-155,94,119,28,TRUE);SetWindowTextW(languageButton,orivaArabic?L"English":L"العربية");}
#endif
