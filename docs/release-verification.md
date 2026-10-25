# Release verification — 2026-10-24

This is a source-publication and candidate-preparation record, not Stable release acceptance. Product identity: Oriva 1.0.0. Requested future release: **Oriva v1.0.0 — Initial Stable Release**. The release tag and downloadable Stable assets are withheld until all critical gates pass.

| Check | Actual result |
|---|---|
| Regression runner | All 20 suites passed on the patched dependency stack. API fixtures, React editor, IndexedDB/crypto and worker VM checks are synthetic; they are not production tests. |
| TypeScript and production web compilation | Passed after dependency security updates. |
| Dependency security audit | Zero known advisories reported by the resolved dependency audit at verification time; this is not a guarantee against unknown vulnerabilities. Package lifecycle scripts were disabled during installation. |
| Actual disposable D1/R2 | Authentication, ownership, conditional updates, quota and complete application backup/restore with a 1.1 MB multichunk file passed. |
| Paired recovery rehearsal | Eight checks passed across 12 local application tables and three R2 objects, including encrypted stored-artifact reopening, wrong-key/tamper rejection, schema/row/object metadata integrity and restored authentication/downloads. No production export occurred. |
| Browser authentication and content | Actual synthetic registration, login, refresh/session persistence, logout, Arabic error messages, link/article persistence and a separate empty account passed during the auth follow-up. The post-dependency follow-up passed new synthetic registration201, login200, wrong-password401 with Arabic text, refresh/session persistence, logout200, independent empty account, link save/refresh persistence and English switching. All requests reached the identified loopback staging API; no production account was used. |
| Native source | x64 GUI/resource candidate compiled; file/product version 1.0.0. Pure native harnesses include the preserved legacy updater comparator. Candidate is unsigned and was not installed or executed against production. |
| Earlier large-library fixtures | 10,000-item correctness/pagination fixtures exist. Their local timings do not establish production latency, full maximum-file endurance or device memory acceptance. |

## Critical gates still open

- Complete Sites-managed D1 and R2 paired backup, independent private storage and isolated restoration are unverified. Source versions do not restore user data.
- Current production API and candidate client differ. Candidate migrations include a collection backfill that needs provider-scale rehearsal; legacy revisionless writes need a coordinated compatibility strategy.
- Temporary restore staging retention/capacity policy and interrupted/maximum-size endurance remain unfinished acceptance work.
- Native installed update/relaunch/profile preservation, new installer/Explorer/registry acceptance and complete native editor interactions were not exercised. Native input tooling was limited; no alternate input bypass was used.
- Physical iOS/Android PWA install, OS permissions and full device-offline tests were not performed. Responsive browser coverage is distinct.
- No signing certificate is available. Checksums verify bytes, not publisher identity; do not describe the candidate as signed.

Public source availability is independent of these production/Stable gates. No production migration, deployment, data reset, R2 deletion or active update-feed change is part of this source publication. See [backup/recovery](backup-recovery.md), [version transition](update-transition.md), [installation](installation.md) and [Arabic README](../README.ar.md).

## Deployment safety follow-up

The new [deployment/recovery decision](deployment-safety.md) ([العربية](deployment-safety.ar.md)) records live column inspection, eight additional synthetic migration/recovery checks, partial-migration failure and fresh-copy recovery, unsafe code-only rollback reproduction, and direct legacy-write/read contracts. Actual disposable workerd/D1/R2 also passed runtime read-only containment, exact file reads/logout and explicit resume. These local checks do not verify managed production recovery or transparent1.5.3 write compatibility.

## Latest continuation

All20 suites passed. The collection rollout adds10,000-row immutable-data, exact-name/timestamp, interrupted-batch, replay/resume and indexed paging checks. Actual disposable D1 passed231-row/eight-page/concurrent replay. The current native loopback-only test executable passed15 isolation cases and actual local D1/R2 login/article edit/library/file upload-download/logout; the original1.5.3 updater comparator passed again. This is headless native validation, not GUI/installer/production acceptance. [Migration preparation](migration-rollout.md) records why hosted ledger/recovery approval still blocks activation.

## Hands-on follow-up — 2026-10-25

All21 regression suites and the hidden Win32 RTL resize fixture pass. Actual browser restore/rollback/restage and corrupt-file Arabic refusal pass. Native main-interface tests now exercise search, favorite/archive, collection grouping and Arabic logout; the large10,000-item interaction and owned-editor input limits are explicit. See [English](qa-followup.md) / [العربية](qa-followup.ar.md) for fixes, measurements and remaining gates. Earlier headless-only statements above are historical. No production or Stable publication occurred.
