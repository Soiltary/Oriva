# Release acceptance — 30 October 2026

[العربية](release-acceptance.ar.md) · [README](../README.md)

**Published:** [Oriva v1.0.0 — Initial Stable Release](https://github.com/Soiltary/Oriva/releases/tag/v1.0.0), marked Latest, not draft or prerelease. Tag v1.0.0 points to reviewed source79ae45f. Later documentation commits do not change the shipped code or tag.

The compatible Sites18 API and website remain live and unchanged. New updater routes returned404 because their files were absent from the deployed archive, while the old1.5.3 feed returned200. This proves missing deployed content, not a platform routing prohibition. The existing website's Windows link opens this repository's releases page. New clients use GitHub, so no Sites deployment or credential workaround is required.

| Area | Actual evidence | Limits |
|---|---|---|
| Public delivery | Anonymous Stable API discovery and all five assets downloaded; sizes and SHA-256 match. Actual native WinHTTP metadata/manifest/CDN/executable verification passed | GitHub availability and anonymous rate limits can defer checks |
| Windows install/update | Public ZIP extracted and installed inside Windows Sandbox; real GUI offer/Yes/download/parent exit/replacement/relaunch passed with an explicitly labeled older GitHub-aware QA fixture; previous bytes, synthetic session and language preserved | QA fixture accepted the public preview before Stable promotion; separate shipping-client Stable detection passed afterward. No claim of automatic legacy Sites-to-GitHub migration |
| Recovery/security | Core policy, real transport seam and actual apply/launch-failure rollback fixtures passed; malformed metadata, escaped duplicate keys, wrong origins, downgrade, corrupt/truncated/oversized downloads and partial cleanup tested | Previous bytes restore on immediate launch failure; a later crash is not automatically detected. Executable is unsigned |
| Existing API/storage | Retained verified48 synthetic API requests,29 local suites, actual isolated D1/R2 interruption and full512MiB/32MiB allowance restore | Provider-wide disaster restoration remains unverified; account backups are not provider snapshots |
| Existing native/web UI | Retained actual synthetic login/session, article/snippet autosave/history, collections, conflict/account isolation, desktop/mobile refresh/logout and10,000-item acceptance | Physical High-DPI, full physical iOS/Android/PWA and long endurance remain unverified |

The native window work-area and History-read/autosave fixes remain included. No owner installation, host registry, production accounts or persistent resources were replaced or reset. Installation/update mutations occurred only in the disposable guest. Public code and packages exclude private test profiles, staging credentials and the QA executable.

ZIP SHA-256: `24d55d617585fb278dfa3c5f669936553107fae61958a255252e3c625aaf0bc8` (294048bytes). Executable SHA-256: `2433e58c4be5ad76e02e1a7d30d7f1be69e4ef097c1e885ecb0ad5d8c27c7774` (482816bytes). The nine ZIP entries and internal checksums passed. Product/file version1.0.0; monotonic updater ordering2.0.0. MIT license and paired English/Arabic documentation are published.

Old internal1.5.3 clients retain fixed Sites endpoints. Supported transition is manual installation of the verified GitHub ZIP into the same per-user profile; new1.0.0 clients then use GitHub Stable updates. No external legacy customer migration is claimed. Normal library layout requires850×720 work-area pixels at the tested scaling. Native editing is text/Markdown; persistent offline document editing is not provided.

The owner explicitly approved the earlier exact Sites18 additive-deployment risk without a complete provider backup. Code rollback does not restore D1/R2; use schema-compatible containment and forward repair for that historical deployment. This release changes update delivery, not the production schema.
