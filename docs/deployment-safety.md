[English](deployment-safety.md) | [العربية](deployment-safety.ar.md)

# Deployment and recovery decision — 2026-10-24

**Hold production deployment, migrations and the v1.0.0 Stable binary.** Safe source preparation continues from public checkpoint `4347620`. No production environment, account, file, feed or deployment was changed. The work runs on the owner's local Windows PC, using synthetic local test data.

## Verified deployment differences

The existing Sites project still reports saved version 17. Its checked-out source is `4ef52234373ad0c0c499e1d3db2fc8b371d205b3`. A bounded live schema inspection retained column names only; private cell values were neither logged nor included in reports/public source. The four live application tables and their columns match migrations 0000–0002 in that source. This establishes the column difference, not a complete provider schema/index/ledger export.

| Area | Current deployment | Candidate |
|---|---|---|
| Authentication | Same-origin JSON, `__Host-oriva`, Secure/HttpOnly/SameSite=Lax; PBKDF2 hashes and existing sessions | Same cookie/hash contract; malformed JSON objects rejected and missing-account password timing hardened |
| Library | Full `/api/items`; no `/api/library` | Bounded library pages, incremental change sequence, per-item revisions |
| Writes | Revisionless full snapshots accepted; stale edits overwrite newer notes | Conditional atomic revisions; stale409, missing revision428 |
| Content | Links/files | Links/files/articles/snippets, text/history/attachments |
| Removal | Hard deletion, including R2 bytes | Recoverable trash and preserved revision references |
| Organisation/recovery | Collection text on items; legacy JSON import/export | Collection records/preferences, streamed per-account backup, staged append restore, health reports |

Exact live table column names:

- `attempts`: key, count, expires.
- `users`: id, email, name, salt, password_hash, recovery_hash, created.
- `sessions`: token, user_id, expires.
- `items`: id, user_id, url, title, note, tags, collection, status, favorite, created, updated, image, kind, file_key, file_name, file_size, file_type.

Candidate migration differences:

| Migration | Schema/data effect | Deployment gate |
|---|---|---|
| 0003_stability | items.revision; users.library_revision; owner/order index | Existing rows receive defaults; provider ledger/state still needs verification |
| 0004_workspace | items.body/language/pinned/deleted_at/rating; collections/item_revisions/attachments/preferences plus indexes | Contains `INSERT … SELECT … GROUP BY` collection backfill; conflicts with Sites schema-only/bounded migration guidance |
| 0005_restore | items.restore_session; restore_sessions/restore_records/restore_maps | Retention/capacity and interrupted restore acceptance remain open |
| 0006_incremental | items.change_seq and owner/change index | Large-library provider execution cost unverified |
| 0007_health | item_health and owner/checked index | Provider execution/configuration unverified |

The candidate has 12 application tables, adding eight. Applied migration history must remain immutable. Do not edit or delete previously applied SQL/snapshots/journal entries, blindly replay a partially applied chain, or reset the database. A supported deployment plan must reconcile the actual provider migration ledger, separate bounded collection backfill from schema application, and test interruption/resumption at production scale. The small local rehearsal preserves all old values but does not clear these provider gates.

## What Sites can and cannot establish here

The available management connection exposes code versions, deployments, runtime configuration, D1 overview and bounded row projections. Row inspection can omit/truncate values and has pagination limits. It is not a coherent, complete SQL export. No complete D1 backup/restore or R2 inventory/byte-export/restore operation is exposed in this connection. This does not establish whether the provider maintains internal backups.

OpenAI's [current Sites help](https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites) explicitly states that publishing may change the database before the code is live, that a failed publish can already have changed the database, and that restoring a previous Site version restores code rather than the database or uploaded files. A saved version/source ZIP and an account library JSON are therefore insufficient recovery artifacts.

## Non-destructive alternative, with explicit limits

The candidate now supports runtime `ORIVA_LIBRARY_READ_ONLY=1`. It rejects newly admitted authenticated library mutations with503 / `library_read_only` / Retry-After300, while allowing library/file reads, account backup and logout. Registration/login/recovery remain available. Setting/removing it changes no stored user records by itself. It has **not** been enabled in production.

This is incident containment only: it does not drain in-flight requests, freeze authentication writes, protect an old worker that ignores the flag, capture SQL/R2, or recover lost data. It requires an already schema-compatible deployment. Do not deploy the current migration chain merely to obtain this flag. Before a coherent capture, the provider must supply a supported write-admission/drain boundary across all workers or a documented paired snapshot mechanism.

After a provider capture is available, keep the untouched database/object recovery set and use a separate restored namespace for migration rehearsal. Store authenticated encrypted artifacts in an independent private durable destination, with the key in a separate owner-controlled vault. Verify stored-copy reopening, schema/index/ledger and row digests, every object byte/metadata, ownership, login and representative downloads before any production change. Retain extra unreferenced objects; do not delete them to force a manifest match.

If an incident occurs after migration, prefer the schema-compatible candidate in containment mode and a reviewed forward repair. Reverting to version17 code is unsafe: the local rehearsal demonstrates that it exposes content kinds it cannot represent and hard-deletes a file from the new data set. Never reset the live database to an older snapshot as an improvised rollback. Restore a recovery copy into fresh isolated resources, reconcile writes after capture, and separately review any future cutover.

Without a complete paired capture, the following remain unrecoverable through the current account-export/tool access:

- Other accounts and their credentials/recovery hashes, sessions and rate-limit state.
- Unexported metadata, collections, preferences, history and attachments.
- Missing file/image bytes, object metadata and extra objects not referenced by one account's export.
- Writes after the capture boundary without a separately preserved change journal.
- Content overwritten/deleted before capture and outside any provider retention.

Containment and account exports reduce exposure but cannot close these gaps. Keep production unchanged if the provider cannot supply the recovery prerequisite.

## Validation and remaining release gates

The new synthetic deployment rehearsal passed eight checks: stored encrypted pre-migration SQLite/R2 capture, wrong-key/tamper rejection, complete legacy-column preservation through all pending migrations, old-session/read compatibility, modern concurrent edits200/409, containment without deletion, unsafe old-code rollback reproduction, fresh isolated restore with authentication/exact file bytes, partial-migration recovery, and account-export coverage exclusions. Related assertions are grouped into eight checks. It uses a local SQLite image backup; the separate local workerd/D1/R2 rehearsal uses Wrangler local SQL export/import. Neither is a production backup.

The public regression adds direct legacy full-snapshot requests (no test-helper revision injection), modern concurrency and ten blocked mutation families. Legacy reads filter articles/trash that1.5.3 cannot represent. Legacy revisionless PATCH/DELETE safely return428. Full transparent1.5.3 write compatibility is **not** claimed; guessing a last-read baseline is unsafe because polling can advance it while an edit dialog holds stale content.

Preserve the existing public1.0.0 / monotonic updater2.0.0 transition. Its comparator tests pass, but installed replacement/relaunch and native interactive acceptance remain unverified. A coordinated client transition is required before revisionless writes can be retired without disrupting users. Restore staging retention/capacity, scale/interruption acceptance and the remaining native/device checks in [release verification](release-verification.md) are also open. Source test success alone is not Stable acceptance.

## Minimum actionable next step

The owner should submit the prepared [provider request](provider-recovery-request.md) privately to Sites support: **perform or expose a project-scoped full coherent D1 schema/data plus all R2 bytes/metadata capture, privately store it, and restore it into fresh isolated resources with integrity evidence**. No direct Cloudflare access, global API key, production SQL writes or credentials in chat are requested. The provider can perform the recovery rehearsal itself. Any availability impact must be explained before capture.

Once recoverability is verified: reconcile the migration ledger and bounded backfill plan; complete legacy/native/restore gates; push/save the exact reviewed source through the existing Sites project; deploy and verify its status/API; complete final Windows acceptance; publish the official release and checksums; verify actual asset bytes; only then activate download links and same-origin compatible update feeds. No official tag, Stable asset or feed has been activated by this checkpoint.
