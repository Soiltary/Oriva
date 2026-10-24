#ifdef ORIVA_STAGING_ONLY
#error "Private staging tooling is excluded from this public source export; refusing this build configuration."
#endif
#ifndef ORIVA_TRANSPORT_H
#define ORIVA_TRANSPORT_H
/* All API traffic and file downloads use these fixed-destination primitives. */
static BOOL orivaNoRedirect(HINTERNET request){
 DWORD policy=WINHTTP_OPTION_REDIRECT_POLICY_NEVER;
 if(!WinHttpSetOption(request,WINHTTP_OPTION_REDIRECT_POLICY,&policy,sizeof(policy)))return FALSE;
 return TRUE;
}
static BOOL orivaResponseIdentity(HINTERNET request){
 (void)request;return TRUE;
}
static HINTERNET orivaConnect(HINTERNET session){
 HINTERNET connection=WinHttpConnect(session,ORIVA_HOST,ORIVA_PORT,0);
 return connection;
}
#endif
