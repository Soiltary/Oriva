[English](migration-rollout.md) | [العربية](migration-rollout.ar.md)

# Collection migration preparation

The release still requires verified provider recovery and the actual hosted migration ledger. This work resolves local migration-tool hazards and validates a separated schema/backfill proposal. **It does not repair or activate the hosted migration chain.** Existing SQL, journal and snapshot files remain byte-for-byte unchanged.

## Implemented

`scripts/sync-migration-snapshots.mjs` previously regenerated existing snapshot identities. Its historical command name now performs read-only verification of the journal, snapshot chain and final Drizzle schema. Both no arguments and `--check` verify without writing; unsupported regeneration arguments fail. Future schema changes require appended generated migrations, not re-created history.

`scripts/collection-rollout.mjs` exports two separate operations without a network client, environment binding, apply CLI or hosting configuration change:

- `schemaOnlyProposal(root)` reads the existing SQL and returns schema statements in memory, separating exactly the reviewed collection backfill from0004. Unexpected statements fail review. The returned status remains `proposal-only`, with deployment/recovery/ledger verification false. Nothing is written back to drizzle or build output.
- `collectionBackfillPage(database, cursor, limit)` scans an indexed primary-key range, at most100 items per call, and applies collection records in one batch. It returns serializable progress; the caller must persist it after success. Deterministic IDs make replay safe. Exact Arabic/whitespace names and aggregate timestamps are retained; an existing independently created collection is not overwritten. Item rows are never updated or deleted.

The backfill is for a frozen isolated restoration during rehearsal. A maximum ID and cursor do not freeze a live source or guarantee capture of concurrent edits/new IDs. No runtime endpoint invokes it; it is not an authorized production operation. A failed batch must roll back transactionally; retrying an already committed page is safe.

## Validation

The20-suite regression runner includes collection rollout. The new test upgrades a10,000-item legacy fixture with the schema-only proposal, then backfills in37-row pages. It checks every legacy item column, exact owner/name grouping and timestamps, preservation of pre-existing collection styling/revision/parent metadata, interruption rollback, persisted cursor resume, committed-page/full replay, parameter bounds and index-based range planning. Running the snapshot command with normal/check/invalid regeneration arguments leaves all SQL/snapshot/journal hashes unchanged.

A separate private actual-D1 rehearsal passed with231 synthetic rows: eight31-row pages, concurrent first-page replay, exact timestamp aggregation and unchanged item fingerprints. The existing native source was also rebuilt as a loopback-only test executable;15 isolation cases and real local D1/R2 login/article edit/library/file byte round-trip/logout passed. These are headless checks; GUI, installed updater and production compatibility acceptance remain open. No production executable was run.

## Required provider step

The current build still packages the historical drizzle directory, including the existing0004 backfill. **Do not deploy it because a schema-only proposal exists.** Before any pending repair, obtain the actual hosted ledger and establish that the affected migration has never applied there, including partially failed deployments. If its state is uncertain or already applied, do not rewrite its SQL/metadata. The provider must confirm a supported repair/append/baseline path. Test that exact resulting source/package on an isolated restored copy before publication.

Verified paired D1/R2 recovery, independent private artifact storage and an isolated restore remain mandatory. See [deployment safety](deployment-safety.md) and [provider request](provider-recovery-request.md). Source history, a bounded database view or a single-account backup is insufficient. The browser management interface may expose additional owner controls beyond the connector; its authenticated settings must be inspected before concluding what this account can access. No absence of provider-internal backups is claimed.

## Legacy clients and publication

The original1.5.3 comparator still rejects a plain1.0.0 offer and accepts monotonic2.0.0. Product identity stays1.0.0. Existing-account sessions and link/file reads pass isolated contract tests. Revisionless PATCH/DELETE safely fail428, and competing modern edits produce200/409. This deliberately prevents silent overwrites but does not provide transparent legacy write compatibility. A coordinated client transition is still required; neither a version header nor a guessed last-read revision can recover an old client's stale baseline.

No production migration/deployment, library write-pause flag, Stable tag, Windows asset or download/update feed is activated by this work. Publish only after recovery, ledger/migration, legacy transition, restore-resource and native acceptance gates all pass.
