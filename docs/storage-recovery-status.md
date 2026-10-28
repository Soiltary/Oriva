# Storage and first-release recovery status

[العربية](storage-recovery-status.ar.md)

This is release preparation, **not a Stable release announcement**. No verified Windows download or matching production deployment is claimed.

The owner confirmed this is Oriva's first public launch, with no external users or valuable development content. Existing installed software and hosted resources remain preserved. There is no mandatory migration of a nonexistent public 1.5.3 customer base.

The approved account allowance is 512 MiB of files/images and 32 MiB of content, history and charged metadata, with 10,000 items. Trash and revisions count. Atomic accounting reserves object space before R2 writes; failed or ambiguous operations retain their reservation until safely reconciled. Exceeding the allowance does not silently truncate content or discard an editor draft.

The backup panel now exposes account usage, unused settled uploads, staging sessions and recoverable trash in English and Arabic. Cleaning unused uploads requires explicit confirmation and protects current content, attachments, collections and revision references. Active uploads remain charged. Permanent deletion requires a trashed item, its current revision and confirmation; associated history is permanently removed. Download a complete backup first. Inspect unused uploads afterward to reclaim the deleted item's file space. Permanent deletion forces a full synchronization on other clients.

Moving an item to trash and restoring its exact content remain possible when the content allowance is full; these operations can omit an additional duplicate snapshot while preserving existing history. Arbitrary edits still require their history allowance. File download links identify items, while embedded image URLs identify objects; restoration remaps both correctly, including revision bodies and preferences with forward references.

Actual isolated local D1/R2 recovery has verified 512 MiB of files, near 32 MiB of charged metadata/history, 21 file hashes, 33 articles, interrupted/resumed staging and commit, owner isolation and bounded temporary cleanup. This proves application-level portability at the approved allowance. It does **not** prove provider-wide disaster recovery or recovery of account credentials, every account or unknown untracked objects.

**Remaining Stable gate:** worker termination during an ordinary object reservation or deletion can leave `pending` or `purging` capacity charged without a proven safe reconciliation path. Releasing it on a guessed timeout could permit a late storage operation to escape accounting or delete reused bytes. No such timeout waiver is implemented. Ordinary settled failures, concurrent cleanup and ambiguous write responses have regression coverage; process-death recovery still needs implementation and actual interruption tests.

The current hosted source retains its original three migrations and four user tables; the release candidate adds revisions, collections, documents, synchronization, restore staging and accounting. `first-release-schema.mjs` prepares a verified-empty database only. `first-release-bridge.mjs` prepares an offline, additive schema proposal from the existing hosted baseline and preserves every original synthetic account/item field. Neither applies SQL, replaces migration history or authorizes deployment. Historical migrations remain immutable; the file-reference correction appends migration 0012.

Available Sites tools expose source versions, database table inspection and deployment management, but no complete paired D1/R2 backup/export/isolated restore or provider migration ledger. A code rollback restores code, not uploaded files or database data. The owner has no separate Sites browser account; another login is not the next step. Supported migration provenance and the remaining local recovery gate must be resolved before production publication.

Source publication is independent of Stable acceptance. Installer replacement, registry integration, signed-package verification, final Windows asset upload and public download acceptance remain separate gates. Do not install an unverified candidate over the owner's development application.
