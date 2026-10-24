# Verified features

- Save links with titles, notes, tags, favorites, collections and reading status; meaningful URL fragments are retained.
- Upload arbitrary file types, up to 25 MiB per file, and download authenticated copies. Uploading a ZIP stores the archive without executing or extracting it.
- Create articles and code snippets in the web editor with autosave, drafts, conflict handling, history and safe previews. Code whitespace is preserved; the web preview provides syntax coloring.
- Organize web collections with nesting, icons, colors and optional images; choose Grid/List/Compact/Board views. Dashboard widgets and sidebar preferences persist per account.
- Use Arabic RTL or English LTR and dark/light/system web appearance. Windows keeps its native dark presentation and Arabic/English strings.
- Synchronize authenticated account data across the native client and both website routes. The updated API uses conditional revisions and bounded pagination.
- Export a complete per-account application backup with files/history and restore by staged append. This is distinct from an all-account provider disaster-recovery snapshot.

Native editing is plain text/Markdown. Native visual image previews, syntax colors, persistent offline document caching and full independent nested collection management are not provided. Collection deletion/reordering and a rating editor are not claimed as available UI workflows. See [features](features.md) for details.

Use Add link to enter a URL, optional title, why it matters, tags and collection. Edit metadata from the item menu. Favorite/archive changes preserve unrelated fields and stale revisions return a conflict instead of overwriting newer work. Duplicate URL checks keep meaningful fragments distinct. Titles/notes/tags/URLs/collections are searchable in Arabic and English.

Deleted items move to recoverable trash. Trash still counts toward the 10,000-item account limit. Permanent purge is not implemented. Archived items remain associated with their collection; active collection views exclude archived/trash records consistently. Favorites include archived starred records. Unassigned items do not appear in unrelated collections.

Collection appearance and parent selection are available on the web. Some color/drag/custom-picker operations were verified at API level but not through every graphical tool/device. The account's selected view and dashboard settings persist; theme/language remain device-local preferences.

The web editor provides full document loading,900 ms autosave, explicit save, a dirty/saving state, retained drafts during interrupted requests, history preview and revision restore. Markdown links and supported uploaded images render safely. Stored HTML is displayed as text; unsafe link schemes are inert. Copy uses the document body without running code. Code language selection and whitespace are preserved.

Documents are limited to 1 MiB of UTF-8 text; highly escaped content has an additional serialized-size bound. Native editing refuses above 250,000 UTF-16 units rather than truncating. The history UI shows the latest 100 prior revisions, while complete account backups include all stored revisions. Inline-image insertion and safe previews were exercised in the web QA campaign. Browser undo/redo input was tool-limited and is not claimed as a verified acceptance result.

Visible clients refresh about every 15 seconds and on focus/reconnection. Pagination, unchanged/delta responses and generation checks reduce repeated data transfer and stale refresh replacement. Writes require expected revisions; a 409 keeps the conflicting draft available. Concurrent edits are not silently merged.

The browser can retain an encrypted owner-scoped library and previously opened complete article/snippet bodies for offline reading. Open a document online first. File/image bytes are not cached for offline use, and unsaved writes are not queued for later automatic submission. Sign-out clears local account caches and completes server sign-out on reconnection if interrupted. Native Windows has no persistent offline document cache.
