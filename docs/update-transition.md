# Windows version transition

The requested public product version is **1.0.0**, with future Git tag `v1.0.0`. No Stable download or update feed has been published by this preparation.

The original installed 1.5.3 updater compares numeric version components and accepts only a greater version. Offering 1.0.0 directly would therefore be rejected. Its download policy requires HTTPS, the existing production origin, no redirects, an exact `/downloads/Oriva-Windows-x64-v<digits>.exe` path, a matching byte count and SHA-256, and a maximum 20 MiB executable. A GitHub asset redirect cannot satisfy that legacy policy.

The candidate separates public version `ORIVA_VERSION=1.0.0` from monotonic compatibility order `ORIVA_UPDATE_VERSION=2.0.0`. Resource metadata and user-facing version remain 1.0.0. Updated clients read `/downloads/windows-update-v2.json`, comparing `updateVersion` while displaying `version`.

After all release gates pass, the planned feeds must identify the same verified executable bytes:

| Feed | Public/display version | Comparison value | Same-origin executable path |
|---|---|---|---|
| Existing `windows-update.json` | Legacy UI necessarily displays 2.0.0 | `version: 2.0.0` | `/downloads/Oriva-Windows-x64-v2.0.0.exe` |
| New `windows-update-v2.json` | `version: 1.0.0` | `updateVersion: 2.0.0` | `/downloads/Oriva-Windows-x64-v1.0.0.exe` |

Both aliases must serve the identical bytes directly, without redirects. Preserve the existing legacy manifest fields and include the actual size/hash, not placeholders. Explain the technical 2.0.0 label in legacy update notes. Future compatibility values must exceed 2.0.0 even if the public release is 1.0.1. The candidate must neither re-offer its own sequence nor compare its public version against the legacy sequence.

`tests/native-update.c` uses a preserved copy of the original 1.5.3 comparator. It verifies rejection of a plain 1.0.0 offer, acceptance of 2.0.0 from 1.5.3 and historical 1.6.0, strict path/hash/version validation, no re-offer and later sequence acceptance. The console harness passed. This does not prove installed replacement, relaunch, DPAPI profile preservation or network delivery on every supported Windows version.

The existing replacement flow and user profile handling remain intact. Neither the installer nor registry integration was executed during preparation. Existing production manifests, stable downloads and installed applications remain unchanged.

Before activation: obtain paired provider recovery and isolated restore; rehearse migrations and legacy writes; deploy a matching API safely; validate both direct same-origin aliases and feeds; verify the public ZIP/hash; then exercise the installed transition in an isolated Windows test profile. The current live API lacks routes needed by this candidate, and old writes without expected revisions are rejected by the new API. These are unresolved coordinated rollout gates. Do not activate either feed prematurely.
