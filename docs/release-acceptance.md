# Release acceptance — 29 October 2026

[العربية](release-acceptance.ar.md) · [README](../README.md)

This is the current status. Older dated audit and rollout documents describe historical checkpoints. Oriva's existing Sites deployment is now version 18, with the compatible API and additive schema. The owner explicitly accepted the exact deployment risk without a complete provider backup. No database reset, account deletion or object relocation occurred.

| Area | Actual evidence | Remaining work |
|---|---|---|
| Production API | 48 synthetic requests passed: authentication, secure cookies, origin rejection, account isolation, revisions, concurrent-edit rejection, collections, real multipart files including empty files, exact download hashes, complete account backup and append restore | Provider-wide disaster restoration remains unverified; account backups are not provider snapshots |
| Local storage/recovery | 29 synthetic suites, actual D1/R2 interruption tests and full 512 MiB file / 32 MiB metadata allowance restore passed | No claim of provider disaster recovery or long-running endurance |
| Windows installation/update | The exact final executable passed actual Windows Sandbox installation and old internal executable replacement/relaunch; previous bytes, session sentinel and language preserved | HTTPS delivery and the final published package acceptance await verified public assets |
| Native GUI | Production login, session reuse, article autosave/edit/history/restore, clipboard round-trip, favorites, archive/restore, collections, Arabic snippet saving and logout passed using synthetic data | Physical High-DPI/device matrix remains unverified |
| Native responsiveness | Real hidden controls at 100/1,000/5,000/10,000 items and isolated 10,000-item GUI exercised; 200-row pages retain global search/grouping | Recorded timings are local samples, not service latency guarantees |
| GitHub | Reviewed source is public under MIT; English/Arabic documentation has paired links | Authenticated GitHub draft contains ZIP, executable, SHA-256 checksums and bilingual notes; GitHub-reported digests match local bytes. Anonymous download and direct Sites updater transport remain unverified |

Two further native defects were reproduced and fixed: changing from login to the larger library window could place bottom controls outside the monitor work area; and failed History reads could block autosave while a successful retry retained a stale failure message. Regression fixtures exercise the real layout and response handlers, including English/Arabic, malformed History replies, dirty drafts and prior write conflicts.

The Windows candidate is x64, unsigned, product/file version 1.0.0. Updater ordering remains 2.0.0 for internal version continuity. Normal library use requires sufficient work area for its existing minimum layout (850×720 physical pixels at the tested scaling); smaller-area geometry tests do not prove all child controls usable. High-DPI acceptance is not inferred from screenshots or bitmap enlargement.

Do not activate the official download or updater feeds until the final release asset is published, downloaded and its SHA-256 verified. Preserve the owner's installed application. Test installation/update in a disposable guest, with synthetic accounts. A first public release does not require compatibility with nonexistent external customers; conditional-revision protections remain enabled.

Sites code rollback does not restore D1/R2. After the new schema, older writable code is not a safe rollback for all file operations. Use schema-compatible write containment and forward repair; inspect any partial deployment before retrying. Complete provider-managed backup/restore remains a disclosed limitation, not a newly invented blocker for the already approved version 18 deployment.

The current draft is not a public Stable release. Final ZIP SHA-256: `4fa722ff400864bd86a731a8615191b9e6b1564f4a1a2b4b53167edf7ce3c60c`; executable: `33d7bbfe6a5deacfffd9f4a6ac31d4af41e39b2d6f935c9b656ab872c303dae7`. Production mobile refresh/session persistence and logout/refresh passed at375px without horizontal overflow; the desktop website loaded in both languages and displayed the actual native-created article/snippet under the same synthetic account. Physical High-DPI remains a coverage limitation, not a demonstrated defect. Direct update delivery remains a real acceptance gate; no official feed has been activated.
