#include <assert.h>
#include "native-check.h"
#include <stdio.h>
#include "../desktop/windows/oriva-update-core.h"
#include "../desktop/windows/oriva-version.h"
#undef ORIVA_UPDATE_CORE_H
#define updateVersionParts legacyVersionParts
#define updateIsNewer legacyIsNewer
#define updateHex64 legacyHex64
#define updateSafePath legacySafePath
#include "fixtures/legacy-1.5.3-update-core.h"
#undef updateVersionParts
#undef updateIsNewer
#undef updateHex64
#undef updateSafePath
int main(void){
 assert(updateIsNewer(L"1.6.0",L"1.5.0"));assert(updateIsNewer(L"1.5.1",L"1.5.0"));assert(updateIsNewer(L"1.10.0",L"1.9.9"));assert(!updateIsNewer(L"1.5.0",L"1.5"));assert(!updateIsNewer(L"1.4.9",L"1.5.0"));
 assert(!updateIsNewer(L"1.5.0-evil",L"1.5.0"));assert(!updateIsNewer(L"9999999999999999999999.0",L"1.5"));assert(!updateIsNewer(L"1.6.",L"1.5"));assert(!updateIsNewer(L"2.0.0.0.0",L"1.5"));
 assert(updateSafePath(L"/downloads/Oriva-Windows-x64-v1.5.0.exe"));assert(!updateSafePath(L"https://evil.test/update.exe"));assert(!updateSafePath(L"/downloads/Oriva-Windows-x64-v1.6.exe?url=evil"));assert(!updateSafePath(L"/downloads/Oriva-Windows-x64-v../../evil.exe"));assert(!updateSafePath(L"/downloads/Oriva-Windows-x64-v1.6/evil.exe"));assert(!updateSafePath(L"/downloads/Oriva-Windows-x64-v1.6.exe.bat"));
 assert(updateHex64(L"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"));assert(!updateHex64(L"0123"));assert(!updateHex64(L"g123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"));
 /* Run the original1.5.3 comparator, not a replacement model of it. */
 assert(!legacyIsNewer(ORIVA_VERSION_W,L"1.5.3"));
 assert(legacyIsNewer(ORIVA_UPDATE_VERSION_W,L"1.5.3"));
 assert(legacyIsNewer(ORIVA_UPDATE_VERSION_W,L"1.6.0"));
 assert(legacySafePath(L"/downloads/Oriva-Windows-x64-v2.0.0.exe"));
 const wchar_t*hash=L"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
 assert(updateReleaseValid(L"1.0.0",L"2.0.0",L"/downloads/Oriva-Windows-x64-v1.0.0.exe",hash,448512));
 assert(!updateReleaseValid(L"1.0.0",NULL,L"/downloads/Oriva-Windows-x64-v1.0.0.exe",hash,448512));
 assert(!updateReleaseValid(L"1.0.0",L"2.0.0",L"/downloads/Oriva-Windows-x64-v2.0.0.exe",hash,448512));
 assert(!updateReleaseValid(L"1.0.0",L"2.0.0",L"https://github.com/Soiltary/Oriva/releases/download/v1.0.0/Oriva.exe",hash,448512));
 assert(!updateIsNewer(L"2.0.0",ORIVA_UPDATE_VERSION_W));
 assert(!updateIsNewer(L"1.6.0",ORIVA_UPDATE_VERSION_W));
 assert(updateIsNewer(L"2.0.1",ORIVA_UPDATE_VERSION_W));
 puts("PASS native updater: numeric version ordering, no downgrades, strict versioned same-origin paths and SHA256 field validation");return 0;
}
