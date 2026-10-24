# Backup and recovery for Sites-managed Oriva

## Current decision

**Production migrations, API deployment and the Stable binary release are on hold.** The owner confirms that D1 and R2 are managed by ChatGPT Sites and that no independently verified provider recovery copy exists. No direct Cloudflare credentials are assumed or requested.

The authorized Sites connection confirms the existing project, public audience, source commit and storage bindings. Read-only D1 overview exposes the user tables `attempts`, `items`, `sessions`, `users`. Source at saved version 17 confirms bindings `DB` and `BUCKET` and migrations 0000–0002. The follow-up bounded schema inspection retained column names only; private row values were not logged, saved in reports or published. No production file bytes were downloaded. Saved source version 17 remains available, but its source archive does not establish a database/object recovery copy. See the exact [deployment/recovery decision](deployment-safety.md) and its [Arabic version](deployment-safety.ar.md).

## Supported versus unverified capabilities

| Capability | Evidence and result |
|---|---|
| Preserve source and deployment history | Sites lists saved versions and associated source commits/archives. This covers code and deployment artifacts. |
| Read live D1 overview/rows | Advertised management tools support bounded overview and paged table inspection. They do not provide a coherent database export transaction or complete restore action. Row-by-row copies are insufficient for this gate. |
| Complete managed D1 backup/export/bookmark | No such operation is advertised by this session's Sites tools. Official Sites documentation reviewed does not establish a customer-accessible complete export/PITR contract. Provider-internal backups may exist; availability, retention and recovery for this project are unverified. |
| Complete managed R2 inventory/download/restore | No bucket inventory, recursive object export, snapshot or restore operation is advertised by this session's Sites tools. Source repository credentials cover Git, not live storage. |
| Cloudflare D1 capabilities | Cloudflare documents SQL exports and Time Travel. Paid retention is up to 30 days; Free retention up to 7 days. The actual managed project's plan/backend/bookmarks are unknown. Cloudflare Time Travel restores in place and overwrites the target, so it is not a safe rehearsal target. |
| Cloudflare R2 capabilities | The S3 compatibility matrix supports paginated ListObjectsV2, GetObject and HeadObject, but does not implement bucket versioning. This is not evidence of a snapshot or historical object versions for this managed bucket. |

OpenAI explicitly separates saved Site versions from visitor records/uploads: [Create a site](https://learn.chatgpt.com/docs/sites/creating-a-site), [Manage a site](https://learn.chatgpt.com/docs/sites/managing-a-site), [Data and connections](https://learn.chatgpt.com/docs/sites/data-and-connections). Cloudflare references: [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/), [SQL export](https://developers.cloudflare.com/d1/best-practices/import-export-data/), [export API](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/export/), [R2 compatibility](https://developers.cloudflare.com/r2/api/s3/api/), [R2 permissions](https://developers.cloudflare.com/r2/api/tokens/), [bucket locks](https://developers.cloudflare.com/r2/buckets/bucket-locks/).

Cloudflare's SQL export API can temporarily make a database unavailable while it exports. No live export has been initiated, and no extra maintenance window is assumed. R2 bucket locks protect deletion/overwrite; they are not a historical backup. Do not apply locks to the production bucket as an improvised backup because doing so can break normal application cleanup. A dedicated backup destination can be considered separately with the provider.

## Minimum request to the Sites provider

The required next access is **project-scoped Sites export/recovery support**, not a Cloudflare global API key, administrator account, production SQL write permission or another user's Oriva credentials. Ask the Sites owner/support channel for:

1. A documented, authorized **full D1 schema-and-data export** at a consistent point/bookmark, including every application table, constraints, indexes, migration ledger and required metadata. The old deployment's four tables are a minimum, not a permanent allowlist. Authentication tables contain sensitive hashes/tokens and must remain private.
2. A complete **R2 inventory and byte export** for the same recoverable data set: all pages, keys, sizes, HTTP/custom metadata, object content and timestamps/ETags where available. Include historical/soft-deleted/revision/attachment references if present. Do not filter down to one logged-in account.
3. Provider confirmation of the **coherence boundary** between the SQL snapshot and object set. A current object listing is not an atomic cross-service snapshot. The existing live code can delete replaced images/files, so reference validation alone cannot recover an object already lost during capture. The provider must supply a paired snapshot or arrange an explicitly approved consistency procedure without deleting/modifying user records.
4. A private, authorized download/transfer channel and an **independent durable backup destination**, retention policy and access controls. No public URLs, GitHub assets, logs, chat transcripts or ordinary Site uploads. Store encryption keys in a separate owner-controlled secret vault with a tested recovery path.
5. Permission to restore a copy **only into newly provisioned isolated D1/R2 resources**, with separate bindings and denied outbound access. No production overwrite, alias switch, delete, reset or restore-in-place permission is requested.
6. Actual restore results and a rollback contract: exact snapshot IDs, capture times, storage locations, expiry/retention, last tested recovery, recovery-point boundaries and data written after the snapshot. A deployment rollback alone cannot undo migrations or recover R2 bytes.

The provider may instead perform and attest the paired export and isolated restoration itself. This is preferable to granting broad storage credentials. If no such supported operation exists, the recovery gate remains failed; do not add an ad-hoc public export endpoint, impersonate other accounts or deploy an exporter that requires schema changes merely to obtain a backup.

## Completeness and integrity acceptance

Keep the detailed manifest private. Record the full SQL checksum, schema/migration fingerprint, per-table row counts/canonical digests, all object keys/sizes/SHA-256 digests and metadata, total bytes and the capture boundary. ETags alone are not reliable whole-object SHA-256 checksums. Verify every D1 file/image/revision/attachment reference against restored objects. Preserve extra objects rather than deleting them to force a count match.

Encrypt artifacts before transferring or storing them offsite, authenticate the encrypted container, and keep the key separate. Restore from the stored copy, not the live source or a working memory buffer. Test wrong keys, modified ciphertext, modified SQL, altered object bytes and missing objects. A hash manifest detects corruption but requires a trusted/authenticated origin; encryption with authentication and controlled keys addresses this in the rehearsal.

On an isolated restoration, check SQLite integrity and schema/indexes; compare row counts and digests before test logins alter session/rate-limit tables. Verify representative file bytes and metadata, account ownership/isolation, authentication, history and downloads. Rehearse candidate migrations on that copy; retain an unmodified recovery copy. Never point the restored worker at production storage or external destinations.

## Isolated rehearsal performed

the private isolated recovery harness creates only synthetic, local workerd/D1/R2 resources and uses the official Wrangler **local** SQL export/import commands. It accepts no production configuration or credentials. It creates a new target directory and never restores into the source.

The rehearsal passed 8 checks covering 12 application tables,3 R2 objects (including a 1.1 MB binary file and image), HTTP/custom metadata, exact row/object integrity, AES-256-GCM storage/reopening with a separately stored synthetic key, wrong-key/tamper/missing-object rejection, SQLite quick_check and restored authentication/account isolation/file download. See `docs/evidence/provider-backup-rehearsal.json` in the internal verification checkout or the delivered verification report.

The test's private SQL, ciphertext and synthetic key stay outside public source. This small in-memory packaging fixture does not establish a production-scale streaming exporter, managed Sites backup availability, real storage ACLs, durable offsite retention, production recovery time or actual production recovery coverage. It is an independent rehearsal, not a passed provider recovery gate.

## Safest release strategy while recovery is unavailable

- Preserve the currently deployed Site and storage. Do not apply migrations 0003–0007 or activate the revision-aware API yet.
- Publish the reviewed MIT source and bilingual documentation independently, clearly distinguishing source availability from a Stable binary release.
- Prepare/checksum Windows 1.0.0 as a private candidate. Keep the public product version 1.0.0 separate from monotonic updater compatibility sequence 2.0.0. Do not serve candidate update manifests or tag/publish Stable.
- Keep legacy download/update endpoints unchanged until the same-origin compatibility aliases, matching API and paired recovery plan are all verified. The new native client needs API routes absent from the current deployed version.
- Obtain the provider-assisted paired backup and isolated restoration. Resolve legacy-client rollout and remaining security/data-loss/acceptance gates. Only then publish matching API/web/native artifacts and activate manifests in the verified order.

There is no claim that Sites has no internal backups. The exact limitation is the absence of an exposed, verified, complete D1+R2 export/restore mechanism for this account/project through the available supported management surface.
