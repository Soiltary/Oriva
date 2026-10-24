# Changelog

## 1.0.0 — initial official release identity (preparation; unpublished)

- Preserve the existing Win32/shared desktop-mobile application while fixing stale metadata writes, atomic quotas, URL fragments, drafts, resource naming, filtering and bounded library sync.
- Include the verified article/snippet, backup, owner isolation, Arabic authentication and modal/editor fixes documented in the release verification report.
- Patch audited dependency vulnerabilities and preserve pinned lockfile/supply-chain policy.
- Separate public version 1.0.0 from updater compatibility order 2.0.0, with regressions using the original 1.5.3 comparator. Prepare an unsigned native candidate; do not activate its update feeds yet.
- Publish MIT source and equivalent English/Arabic documentation independently from a Stable binary release. Production recovery, coordinated legacy writes and native installed-upgrade acceptance remain gates.

Earlier entries below are internal development identifiers, not earlier official public releases.

# Changelog

## 1.6.0 development candidate — 2026-10-23

Local development only. No deployment, release publication, installer execution, registry change or installed-app replacement occurred. The production website and stable download manifests remain unchanged.

- Prevent stale full-snapshot writes with item revisions, narrow mutations, atomic compare-and-swap updates and explicit legacy-client upgrade responses.
- Enforce the 10,000-item quota inside a single conditional SQL insert, including imports, files and restore. Test concurrency against local workerd/D1 bindings.
- Preserve URL fragments, meaningful queries and special characters. Keep duplicate comparison separate from stored navigable URLs.
- Protect link and document drafts, refresh/close paths, competing edits and in-flight saves. Debounce native search and article autosave.
- Add generation-checked keyset paging, unchanged polls, web delta synchronization, stable indexes, request deduplication and bounded card rendering. Keep previous complete libraries after failed synchronization.
- Align archived collection filtering across native and web clients; preserve uncategorized behavior. Correct the icon-resource packaging workflow and validate Windows resources.
- Add independent, empty and nested collections with cycle prevention, icons, colors, images, rename preservation, drag/drop assignment, pins and recoverable trash.
- Add article and snippet creation/editing, full-document fetching, debounced autosave, revision history/restore, safe article previews and inert LTR code highlighting on the web. Add a native plain-text article/snippet editor with autosave, current revision fetching, conflict recovery, copy and history restore.
- Add encrypted owner-scoped browser caches for library information and complete opened documents. Clear local caches/drafts on sign-out, including offline sign-out; prevent in-flight writes from resurrecting cleared data.
- Keep large escaped revision backups within restore/D1 row boundaries by serializing snapshots once, with earlier development-format compatibility.
- Add streamed complete backup and resumable, owner-isolated append restore with file/image remapping, byte integrity checks, preview/confirmation, retained settings, all saved revisions and recoverable rollback.
- Add a configurable dashboard, favorite collections, keyboard/drag widget ordering, sidebar ordering, grid/list/compact/board views and Arabic/English dark/light layouts.
- Add optional deterministic duplicate review and conservative browser-only health reports/checks/notifications. No automatic merge/deletion or server-side destination fetch is enabled.
- Add public-shell-only service worker caching and 192/512 PNG PWA icons derived from the existing artwork. Preserve the /iphone shared route.
- Preserve the native updater and optional Explorer integration. Add bounded changelog display and generate an unsigned development package separately from stable downloads.
- Add migration snapshots, regression/component/security/runtime tests, measured performance evidence, release/rollback documentation and a future constrained plugin design. No third-party plugin execution is enabled.

Outstanding release gates and platform limits are listed in docs/ORIVA_UPGRADE_ROADMAP.md and docs/ORIVA_DEVELOPMENT_REPORT.md. This candidate is not approved for production release.
