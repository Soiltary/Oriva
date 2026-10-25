# Hands-on QA follow-up — 2026-10-25

[English](qa-followup.md) | [العربية](qa-followup.ar.md)

This records local Windows and browser testing with synthetic accounts and isolated D1/R2. It is not production acceptance or a Stable release announcement.

## Confirmed defects fixed

1. After a recoverable restore rollback, the browser reused the rolled-back cached session forever. A mounted React regression reproduced one start instead of the required second start. Successful rollback now clears the cache; old rolled-back and missing404 sessions also start afresh. Completed sessions resume without duplicating a restore. Authentication/server failures preserve the resumable session, and unavailable sessionStorage falls back to memory for the mounted operation.
2. Backup/restore failures could display English while Arabic was selected. Integrity, incomplete/unsupported backup, expired session and generic restore errors now display Arabic. Invalid checksums prevent staging.
3. Native Arabic logout shrank the mirrored library window while retaining physical positions of authentication controls, leaving them outside the client area. Reapply their logical bounds on auth layout/resize. The existing application and production configuration are preserved.

Changed implementation: `app/backup-panel.tsx`, `desktop/windows/Oriva.c` and `desktop/windows/oriva-auth-layout.h`. Regressions: `tests/backup-panel.mjs`, `tests/run.mjs`, `tests/native-auth-layout.c`.

## Verification

- All21 JavaScript regression suites pass in both private development and sanitized public source, including mounted restore rollback/restage, stale/404 cache, completed resume,401/500 retry, blocked session storage and Arabic checksum rejection. TypeScript and production web build pass.
- Actual Arabic browser on the rebuilt localhost preview: restore, recoverable rollback and a second restore of the same synthetic backup complete; an older article remains. A corrupted backup is refused in Arabic before staging.
- Actual Windows main interface: synthetic login, library search, favorites, archive, Arabic switching, collection grouping and logout exercised. Readback verifies unrelated URL/note/tags/collection metadata survives the flag edits. The patched app successfully logs in and out in Arabic with100 and1,000 records; authentication controls remain in bounds after the resize.
- Hidden Win32 regression passes80 library/login resize transitions with repeated LTR/RTL changes and exact control bounds. It uses no profile, registry, tray or network. Build/run this Windows fixture separately with the same Zig toolchain: `zig cc -target x86_64-windows-gnu -O2 tests/native-auth-layout.c -o <workspace>/native-auth-layout.exe -luser32`.
- Patched loopback-only x64 test executable compiles and passes actual local D1/R2 login, article creation/edit, library, file upload/download byte equality and logout. Static inspection confirms no production hostname or registry/launcher imports. Production configuration compiles separately and is never run against production.
- The refreshed dependency audit reports0 known advisories; this does not cover unknown vulnerabilities. No dependency changes or installation scripts were needed.

## Scale observations and honest limits

Single samples of actual local emulator HTTP calls, including serialization, not native render/startup or production latency:

|Synthetic library|First100 rows|Unchanged response|Legacy complete list|
|---:|---:|---:|---:|
|100|9.561ms /63,932B|7.679ms /30B|10.205ms /57,188B|
|1,000|7.575ms /49,490B|6.664ms /30B|21.643ms /441,588B|
|10,000|7.109ms /49,701B|6.563ms /31B|243.418ms /4,303,588B|

All complete list counts and a11,930-code-unit mixed Arabic/English note matched exactly. Native screenshots show100,1,000 and10,000 saved records. At10,000, accessibility enumeration fails and attempted interaction produces a temporary Not Responding state. One process sample shows about267MiB working set and258MiB private memory, not an accepted memory target or a measured improvement. Application rendering versus automation accessibility overhead is unresolved; full10,000-item native interaction is not marked passed. Do not infer a performance improvement from these single samples.

The native owned article editor opens, but the available input helper cannot route typing into its child controls; no saved-editor GUI result is claimed. Headless article tests are separate evidence. Installed upgrade/relaunch, Explorer/registry changes and physical mobile-device acceptance were not performed.

## Production and release gates

Existing Sites connector access remains owner-authorized, but its exposed tools do not provide a verified complete paired D1/R2 export and fresh isolated restore, including all accounts, schema/indexes/migration ledger, object bytes and metadata. The owner has no separate browser sign-in account; creating another account would not establish project ownership or recovery. No further sign-in request is pending. No assertion is made about backups internal to the provider.

A library export and source rollback do not recover all accounts/files or undo data mutations. The safe available strategy is to preserve the current production deployment, publish sanitized source fixes independently and request project-scoped provider-assisted capture/restore/ledger evidence through an authorized private support channel. A request template exists in [provider recovery request](provider-recovery-request.md); it has not been sent automatically. Until verified, production accounts/sessions and R2 files without an independent complete capture have no demonstrated recovery path. Existing local synthetic recovery rehearsals do not change that fact.

Historical migration SQL and metadata remain untouched. The schema-only/bounded-backfill proposal needs actual provider ledger evidence before activation. Revisionless1.5.3 writes deliberately fail428; transparent concurrent legacy writes remain unresolved. Product1.0.0/update order2.0.0 comparator tests are distinct from write compatibility. Restore staging retention/capacity/endurance, native large-library/editor/installed acceptance and remaining device tests also stay open.

No production migration/deployment, destructive user-data action, active update-feed change, officialv1.0.0 tag, Stable Release or public Windows package is performed by this source publication. See [release status](windows-release-status.md), [deployment safety](deployment-safety.md) and [recovery plan](backup-recovery.md).
