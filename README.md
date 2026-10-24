[English](README.md) | [العربية](README.ar.md)

# Oriva

**Windows download status:** no Stable Windows package is available yet. The API compatibility gate was reproduced using isolated synthetic data; see [Windows release verification](docs/windows-release-status.md).

The latest [deployment and recovery decision](docs/deployment-safety.md) records the exact schema differences, tested write containment and remaining recovery/legacy-client gates.

![Oriva](public/oriva-logo.png)

**Oriva 1.0.0 is the first official release identity. This repository contains its reviewed release preparation; no Stable binary release or matching production deployment is claimed until the recovery and compatibility gates pass.** Historical 1.5.3/1.6.0 identifiers describe internal development, not earlier official public releases.

Oriva is a personal digital library for links, files, articles, code snippets and the notes that help you find them again. It keeps the existing native Win32 application and the shared desktop/mobile website. It does not replace them with a new architecture.

[Desktop website](https://oriva.soltairy.chatgpt.site/) · [Mobile website](https://oriva.soltairy.chatgpt.site/iphone) · [Repository](https://github.com/Soiltary/Oriva) · [Windows releases](https://github.com/Soiltary/Oriva/releases)

The existing website may still run the historical deployment. The releases page is the authoritative destination for future verified Windows assets; a v1.0.0 asset is not available merely because source is public.

## Features and platform coverage

- Save links with titles, notes, tags, favorites, collections and reading status; meaningful URL fragments are retained.
- Upload arbitrary file types, up to 25 MiB per file, and download authenticated copies. Uploading a ZIP stores the archive without executing or extracting it.
- Create articles and code snippets in the web editor with autosave, drafts, conflict handling, history and safe previews. Code whitespace is preserved; the web preview provides syntax coloring.
- Organize web collections with nesting, icons, colors and optional images; choose Grid/List/Compact/Board views. Dashboard widgets and sidebar preferences persist per account.
- Use Arabic RTL or English LTR and dark/light/system web appearance. Windows keeps its native dark presentation and Arabic/English strings.
- Synchronize authenticated account data across the native client and both website routes. The updated API uses conditional revisions and bounded pagination.
- Export a complete per-account application backup with files/history and restore by staged append. This is distinct from an all-account provider disaster-recovery snapshot.

Native editing is plain text/Markdown. Native visual image previews, syntax colors, persistent offline document caching and full independent nested collection management are not provided. Collection deletion/reordering and a rating editor are not claimed as available UI workflows. See [features](docs/features.md) for details.

## Actual interface

The following image is an actual browser capture using synthetic local QA data, not a production-account screenshot or a mockup. It does not establish physical-phone or native-editor acceptance.

![Authenticated Arabic library — synthetic QA](docs/images/library-ar.jpg)

More verified coverage and limits are in [release verification](docs/release-verification.md).

## Windows installation and first-time setup

Windows 10/11 x64 is the intended native target. No bundled browser engine, Python or .NET runtime is needed. Internet access is needed for cloud operations. The prepared executable is **unsigned**; checksums detect changed bytes but are not independent publisher authentication. Do not bypass Windows security warnings.

Only install a verified official package after it appears on the releases page. Download the ZIP and SHA256SUMS.txt, verify its exact SHA-256, extract the complete package and run its included Setup.cmd in your own Windows profile. The existing installer adds shortcuts and optional Explorer integration without administrator elevation. These instructions describe the preserved installer; the new candidate's installed update/registry flow has not been exercised.

Create an account on the website, save the one-time recovery code privately, then sign in on each device. Sessions are separate per client, while library data belongs to the same account. No email-verification or emailed password-reset service is configured. An existing account's recovery code is required for password recovery. Never put a real password or recovery code in an issue/report.

Do not install or run a private candidate against real accounts. The candidate needs the matching revision-aware API, which is not yet deployed. See [installation](docs/installation.md) and [update compatibility](docs/update-transition.md).

## Library and collections

Use Add link to enter a URL, optional title, why it matters, tags and collection. Edit metadata from the item menu. Favorite/archive changes preserve unrelated fields and stale revisions return a conflict instead of overwriting newer work. Duplicate URL checks keep meaningful fragments distinct. Titles/notes/tags/URLs/collections are searchable in Arabic and English.

Deleted items move to recoverable trash. Trash still counts toward the 10,000-item account limit. Permanent purge is not implemented. Archived items remain associated with their collection; active collection views exclude archived/trash records consistently. Favorites include archived starred records. Unassigned items do not appear in unrelated collections.

Collection appearance and parent selection are available on the web. Some color/drag/custom-picker operations were verified at API level but not through every graphical tool/device. The account's selected view and dashboard settings persist; theme/language remain device-local preferences.

## Articles and code snippets

The web editor provides full document loading, 900 ms autosave, explicit save, a dirty/saving state, retained drafts during interrupted requests, history preview and revision restore. Markdown links and supported uploaded images render safely. Stored HTML is displayed as text; unsafe link schemes are inert. Copy uses the document body without running code. Code language selection and whitespace are preserved.

Documents are limited to 1 MiB of UTF-8 text; highly escaped content has an additional serialized-size bound. Native editing refuses above 250,000 UTF-16 units rather than truncating. The history UI shows the latest 100 prior revisions, while complete account backups include all stored revisions. Inline-image insertion and safe previews were exercised in the web QA campaign. Browser undo/redo input was tool-limited and is not claimed as a verified acceptance result.

## Synchronization and offline reading

Visible clients refresh about every 15 seconds and on focus/reconnection. Pagination, unchanged/delta responses and generation checks reduce repeated data transfer and stale refresh replacement. Writes require expected revisions; a 409 keeps the conflicting draft available. Concurrent edits are not silently merged.

The browser can retain an encrypted owner-scoped library and previously opened complete article/snippet bodies for offline reading. Open a document online first. File/image bytes are not cached for offline use, and unsaved writes are not queued for later automatic submission. Sign-out clears local account caches and completes server sign-out on reconnection if interrupted. Native Windows has no persistent offline document cache.

## Backup and restore

Use the account menu's Backup and restore panel for a complete application export rather than the metadata-only JSON download. Keep backups private: they contain plaintext library content and attachments, though authentication credentials are excluded. The format verifies manifests/chunks and remaps imported IDs/private references. Restore stages records and appends under keep-existing rules; it does not reset the account. A recoverable rollback moves imported items to trash; it retains collections/settings/temporary objects and is not a provider-wide rollback.

The application backup does not include every production account, authentication table or provider setting. Sites source versions also do not establish a D1/R2 recovery copy. A complete, paired provider export and isolated restoration is still a release gate. The synthetic local export/encrypted-storage/restore rehearsal passed, but no production recovery copy is claimed. Read [backup and recovery](docs/backup-recovery.md).

## Windows integration and updates

The preserved native application supports Explorer Save to Oriva, a naming/confirmation screen before upload, tray hide/reopen, a single running instance and authenticated streaming downloads. On Windows 11, classic Explorer entries may be under Show more options. The original local file is not renamed. Removing context-menu integration keeps cloud data. Installer/registry/tray end-to-end acceptance for the new candidate remains unverified; no installed application was changed during this work.

Public product version 1.0.0 is separate from updater compatibility version 2.0.0. Old 1.5.3 clients would reject a plain 1.0.0 numeric offer. The transition uses an old-format same-origin compatibility feed/EXE alias and a new v2 feed with separate public/update versions; both must identify the same verified bytes. Existing clients do not follow a GitHub redirect. Size/SHA-256, HTTPS and strict same-origin paths remain required. The original comparator passed transition regressions; actual installed replacement/relaunch has not been exercised. Existing production feeds remain unchanged while release gates are open.

## Mobile and PWA

The `/iphone` route uses the same application/API with a mobile presentation. Manifests and 192/512 icons are included. The service worker caches only public shell/assets; private API responses and blobs are excluded. Physical iOS/Android installation, OS notification permissions, virtual keyboards and full OS-offline behavior have not been accepted. A browser responsive viewport is not a physical-device test.

Optional link-health checks run in the foreground browser only and require an explicit action/opt-in. CORS failures, redirects and timeouts remain inconclusive. There is no background server link scanner or push scheduler.

## Technical architecture

Native Windows is C/Win32 using WinHTTP, DPAPI and system controls. The website is React 19/TypeScript with Next-compatible routing built by Vinext/Vite for Cloudflare Workers. D1 holds accounts/metadata/history/preferences; R2 stores private file/image bytes. Desktop and `/iphone` share the application and API. Production mutations enforce same-origin JSON, ownership and conditional revisions. There is no server-side fetch of saved-link destinations.

See [architecture](docs/architecture.md), [development](docs/development.md) and [third-party notices](THIRD_PARTY_NOTICES.md). The public source snapshot omits private Site identity/configuration, runtime data, compiled binaries, internal QA artifacts and staging-only delivery files. It does not publish the private development Git history.

## Development and builds

Use Node 22.13+ and the pinned pnpm 11.25.0 toolchain. Preserve `pnpm-workspace.yaml` supply-chain rules and the lockfile. Install with `pnpm install --frozen-lockfile --ignore-scripts`. No package lifecycle script is required by the documented pure tests. Keep dependency directories and local data out of Git.

Run `node tests/run.mjs`, `node node_modules/typescript/bin/tsc --noEmit --incremental false`, and `node scripts/run-framework.mjs build`. Actual D1/R2 and paired recovery checks used private disposable local verification tools, excluded from this public export. Public regression tests use in-memory fixtures with per-run generated inputs and no live accounts. For a browser preview, configure only isolated local bindings and apply migrations locally; use `wrangler.local.json` and the [local commands](docs/development.md). Do not turn local commands into remote commands.

Native source compiles with Zig 0.14.1 and Windows system libraries; commands are in desktop/windows/README.md. Compile into a separate workspace directory. Building production configuration does not authorize executing it against real accounts or running its installer. Native pure console tests exercise parsers/collections/mutations/language/updater without installation.

## Validation and known limits

The current dependency security audit reported 0 known advisories after pinned security fixes. The 19-suite regression runner, TypeScript, web build, actual local D1/R2 authentication/concurrency/backup tests and original Windows updater comparison passed. Registration/login/refresh/logout, Arabic errors, content persistence and cross-account isolation were exercised in the actual browser before this source publication; the post-dependency browser follow-up also passed synthetic registration, login, Arabic credential errors, refresh/session persistence, logout, separate empty account isolation, saved-link persistence and language switching.

These results do not establish production migration/recovery, native installed upgrade acceptance, signing, physical-phone behavior or full maximum-size endurance. Large-library fixtures reached 10,000 items; local fixture timing is not production latency. Candidate migrations include an existing collection backfill that requires provider-scale rehearsal. Temporary restore retention/capacity policy and coordinated legacy writes remain release work. See [verification](docs/release-verification.md), [backup plan](docs/backup-recovery.md) and [changelog](CHANGELOG.md).

## Troubleshooting and security

Wrong credentials return 401; an existing email returns 409. Too many attempts require waiting 15 minutes. Save the recovery code privately. A failed connection requires the correct local services/origin or a healthy official deployment; do not try real credentials on a local candidate. Stale edits return 409; review the newest revision and retain your draft. Missing expected revision returns 428 for legacy clients; the coordinated rollout must address this before production.

Passwords are salted PBKDF2-SHA256 hashes; session/recovery tokens are hashed in D1. Production cookies are Secure/HttpOnly/SameSite. Native sessions use user-scoped DPAPI; downloads validate ownership and byte bounds. Image signatures are checked and SVG uploads are rejected. Files are treated as downloads, not executed. Application backup content remains sensitive even though credentials are excluded.

Report reproducible issues without credentials, private backups or real records. See [SECURITY.md](SECURITY.md), [troubleshooting](docs/troubleshooting.md) and [contributing](CONTRIBUTING.md). Do not disable TLS validation, origin checks, session ownership, update hashes or local isolation to clear a test.

## License

Oriva's original source is licensed under the [MIT License](LICENSE), selected by its owner. Third-party components retain their own licenses and notices. No claim of ownership over third-party components is made. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).


The public export omits optional private connector-preview and local identity emulation. It preserves Oriva’s own authentication and shared API. The public native source is the production view and refuses the private staging compiler flag rather than falling back to a production connection. Private staging guards remain intact in the private development checkout.
