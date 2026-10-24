#ifdef ORIVA_STAGING_ONLY
#error "Private staging tooling is excluded from this public source export; refusing this build configuration."
#endif
#ifndef ORIVA_CONFIG_H
#define ORIVA_CONFIG_H
/* Production remains the default. Only an explicit compiler flag selects staging. */
#define ORIVA_ORIGIN L"https://oriva.soltairy.chatgpt.site"
#define ORIVA_HOST L"oriva.soltairy.chatgpt.site"
#define ORIVA_PORT INTERNET_DEFAULT_HTTPS_PORT
#define ORIVA_REQUEST_FLAGS WINHTTP_FLAG_SECURE
#define ORIVA_PROXY WINHTTP_ACCESS_TYPE_AUTOMATIC_PROXY
#define ORIVA_COOKIE L"__Host-oriva="
#define ORIVA_WINDOW_CLASS L"OrivaDesktop"
#define ORIVA_MUTEX L"Local\\OrivaDesktop.Singleton"
#define ORIVA_WINDOW_TITLE L"Oriva " ORIVA_VERSION_W
#define ORIVA_ENTROPY NULL
static BOOL orivaAllowedPath(const wchar_t *path){return path!=NULL;}
static BOOL orivaSessionCookie(const wchar_t *value){
 size_t n=wcslen(ORIVA_COOKIE);
 if(wcsncmp(value,ORIVA_COOKIE,n))return FALSE;
 return TRUE;
}
#endif
