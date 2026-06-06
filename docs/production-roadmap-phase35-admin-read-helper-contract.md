# Phase 35 — Admin Read Helper Contract

This note ties the current pure admin read helper sequence together before any storage-backed read path is introduced.

## Helper sequence

The Phase 35 admin read foundation is intentionally split across small pure helpers:

- `lib/settings/outbound-webhook-admin-read-model.ts` builds safe admin DTOs, filter normalization, sort normalization, pagination envelopes, and redaction labels.
- `lib/settings/outbound-webhook-admin-read-query.ts` builds the safe query spec, selected fields, cursor normalization, and rejected-input audit labels.
- `lib/settings/outbound-webhook-admin-read-plan.ts` builds list and detail read plans without touching persistence.
- `lib/settings/outbound-webhook-admin-read-memory.ts` exercises the list/detail contract against in-memory records, including `hasNextPage`, `nextCursor`, and `afterCursor` metadata.

## Boundary

This remains a pure helper contract. It does not add storage access, endpoint handlers, admin pages, state mutation, external calls, signing, retry behavior, or recovery controls.

## Cursor contract reminder

The current memory helper uses a normalized `cursor` token to continue after a matching in-memory record id in the filtered and sorted result set. A future storage-backed path must define a durable cursor contract before replacing the pure in-memory helper with repository-backed reads.

## Guard

`tests/unit/outbound-webhook-admin-read-model.test.ts` guards this document so future Phase 35 read work keeps the helper files, pure boundary, pagination metadata, and deferred runtime concerns visible.
