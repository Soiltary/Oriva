#include <windows.h>
#include <stdio.h>
#include "../desktop/windows/oriva-github-release.h"
#include "native-check.h"
#define H "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
#define A "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
static const char*page="{\"draft\":false,\"prerelease\":false,\"published_at\":\"2026-10-29T00:00:00Z\",\"tag_name\":\"v1.0.0\",\"assets\":[{\"name\":\"windows-update.json\",\"id\":11,\"size\":300,\"state\":\"uploaded\",\"digest\":\"sha256:" A "\",\"url\":\"https://api.github.com/repos/Soiltary/Oriva/releases/assets/11\"},{\"name\":\"Oriva.exe\",\"id\":12,\"size\":3,\"state\":\"uploaded\",\"digest\":\"sha256:" H "\",\"url\":\"https://api.github.com/repos/Soiltary/Oriva/releases/assets/12\"}]}";
static const char*manifest="{\"schemaVersion\":1,\"version\":\"1.0.0\",\"updateVersion\":\"2.0.1\",\"assetName\":\"Oriva.exe\",\"sha256\":\"" H "\",\"size\":3}";
static char*replace(const char*s,const char*from,const char*to){const char*at=strstr(s,from);assert(at);size_t n=strlen(s)+strlen(to)+1;char*out=malloc(n);assert(out);size_t prefix=at-s;memcpy(out,s,prefix);strcpy(out+prefix,to);strcpy(out+prefix+strlen(to),at+strlen(from));return out;}
static void rejectPage(const char*from,const char*to){char*s=replace(page,from,to);OGRelease r;assert(!ogReleaseParse(s,1,&r));free(s);}
static void rejectManifest(const OGRelease*r,const char*from,const char*to){char*s=replace(manifest,from,to);OGUpdate u;assert(!ogManifestParse(s,r,&u));free(s);}
int main(void){OGRelease r;OGUpdate u;assert(ogReleaseParse(page,1,&r));assert(ogManifestParse(manifest,&r,&u));assert(ogUpdateNewer(&u,L"1.0.0",L"2.0.0"));assert(!ogUpdateNewer(&u,L"1.0.0",L"2.0.1"));assert(!ogUpdateNewer(&u,L"1.0.1",L"2.0.0"));
 rejectPage("\"draft\":false","\"draft\":true");rejectPage("\"prerelease\":false","\"prerelease\":true");rejectPage("\"draft\":false","\"draft\":false,\"draft\":true");rejectPage("\"prerelease\":false","\"prerelease\":null");
 rejectPage("v1.0.0","v01.0.0");rejectPage("v1.0.0","v1.0.0-beta");rejectPage("v1.0.0","v1.0.0\\u0000evil");rejectPage("2026-10-29T00:00:00Z","");
 rejectPage("\"size\":3","\"size\":0");rejectPage("\"size\":3","\"size\":20971521");rejectPage("\"id\":12","\"id\":1e2");rejectPage("\"id\":12","\"id\":9007199254740992");
 rejectPage("\"id\":12","\"id\":12,\"id\":13");rejectPage("uploaded","new");rejectPage("sha256:","sha512:");rejectPage("repos/Soiltary/Oriva/releases/assets/12","repos/attacker/Oriva/releases/assets/12");rejectPage("assets/12","assets/13");rejectPage("https://api.github.com","http://api.github.com");
 rejectPage("windows-update.json","Oriva.exe");rejectPage("Oriva.exe","other.exe");
 rejectManifest(&r,"1.0.0","1.0.1");rejectManifest(&r,"2.0.1","1.9.9");rejectManifest(&r,"2.0.1","2.0.1-beta");rejectManifest(&r,"\"size\":3","\"size\":4");rejectManifest(&r,"\"size\":3","\"size\":3,\"size\":4");
 rejectManifest(&r,H,A);rejectManifest(&r,"Oriva.exe","evil.exe");rejectManifest(&r,"\"schemaVersion\":1","\"schemaVersion\":2");rejectManifest(&r,"\"schemaVersion\":1","\"schemaVersion\":18446744073709551617");
 rejectPage("\"draft\":false","\"draft\":false,\"\\u0064raft\":true");
 rejectManifest(&r,"\"size\":3","\"size\":3,\"\\u0073ize\":4");
 char*preview=replace(page,"\"prerelease\":false","\"prerelease\":true");assert(ogReleaseParse(preview,0,&r));free(preview);
 puts("PASS GitHub release/manifest binding, unique fields, uploaded digests, size bounds, stable-only, product/order downgrade rejection");return 0;
}
