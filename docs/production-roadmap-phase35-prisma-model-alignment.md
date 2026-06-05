# Phase 35 Prisma Model Alignment

Status: model alignment planning, source coverage, schema-update preflight, and canonical model snippet contract only; no Prisma schema model is added in this slice.

Last updated: 2026-06-05

## Scope

This slice documents the readiness contract for aligning Prisma schema metadata with the outbound delivery storage migration added in Phase 35.

The storage migration already creates the future `OutboundWebhookDelivery` table. This planning slice keeps the actual Prisma schema model deferred so the future model can be added with a focused full-schema update and generated-client validation.

## Future model contract

The future Prisma model should align to the existing migration fields:

- `id`
- `configurationKey`
- `eventType`
- `eventRef`
- `payloadDigest`
- `idempotencyKey`
- `status`
- `attemptCount`
- `lastOutcomeCategory`
- `nextEligibleAttemptAt`
- `lastResponseCode`
- `deadLetterSummary`
- `createdAt`
- `updatedAt`

The model should preserve these storage guarantees:

- unique `idempotencyKey`
- index on `configurationKey` plus `status`
- index on `eventType` plus `eventRef`
- index on `status` plus `nextEligibleAttemptAt`
- index on `createdAt`
- non-negative `attemptCount` handled by the migration check constraint
- lifecycle status values aligned with the Phase 35 tracker

## Expected Prisma model shape

The future schema model should be added as a passive client mapping only. It should expose the storage table to generated Prisma Client without adding application read/write paths in the same slice.

Expected field mapping:

| Field | Prisma type | Required/default expectation |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` or another reviewed repository id convention before changing the SQL default. |
| `configurationKey` | `String` | Required. |
| `eventType` | `String` | Required. |
| `eventRef` | `String` | Required. |
| `payloadDigest` | `String` | Required. |
| `idempotencyKey` | `String` | Required and unique. |
| `status` | `String` | Required, defaulting to `planned` if the schema default is mirrored. |
| `attemptCount` | `Int` | Required, defaulting to `0`; the migration check keeps values non-negative. |
| `lastOutcomeCategory` | `String?` | Optional safe latest outcome label. |
| `nextEligibleAttemptAt` | `DateTime?` | Optional future eligibility timestamp. |
| `lastResponseCode` | `Int?` | Optional safe response-code summary. |
| `deadLetterSummary` | `String?` | Optional safe operator summary. |
| `createdAt` | `DateTime` | Required, defaulting to `now()`. |
| `updatedAt` | `DateTime` | Required, using `@updatedAt`. |

Expected schema indexes:

- `@@unique([idempotencyKey])`
- `@@index([configurationKey, status])`
- `@@index([eventType, eventRef])`
- `@@index([status, nextEligibleAttemptAt])`
- `@@index([createdAt])`

Generated-client validation must run on the exact PR head before merging the future schema model slice. CI's `Generate Prisma client` step is enough evidence if it completes on the exact head.

## Canonical passive model snippet

The future schema model slice should insert exactly one passive model block equivalent to this snippet, adjusted only if the repository chooses a different reviewed id-default convention before implementation:

```prisma
model OutboundWebhookDelivery {
  id                    String    @id @default(cuid())
  configurationKey      String
  eventType             String
  eventRef              String
  payloadDigest         String
  idempotencyKey        String    @unique
  status                String    @default("planned")
  attemptCount          Int       @default(0)
  lastOutcomeCategory   String?
  nextEligibleAttemptAt DateTime?
  lastResponseCode      Int?
  deadLetterSummary     String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([configurationKey, status])
  @@index([eventType, eventRef])
  @@index([status, nextEligibleAttemptAt])
  @@index([createdAt])
}
```

The snippet is intentionally passive. It should not be paired with service writes, background processors, delivery execution, recovery controls, or live external calls.

## Schema update preflight

The schema file is long enough that connector edits must not be made from a partial/truncated response. The actual Prisma model slice should only update `prisma/schema.prisma` after the full file has been reconstructed from complete, ordered chunks or another verified full-file source.

Preflight rules for the future schema model slice:

- Record the source schema blob SHA before editing.
- Read the entire file in ordered chunks and confirm the final chunk reaches the end of `schema.prisma`.
- Preserve all existing models, generators, datasource configuration, relations, indexes, and formatting outside the new passive model block.
- Insert only one `model OutboundWebhookDelivery` block.
- Do not alter the existing outbound delivery migration SQL unless the PR explicitly documents a migration correction.
- After the schema update, inspect the PR diff and confirm the schema diff contains only the intended additive model block.
- Treat any truncated schema read as a blocker and switch back to documentation/source-guard work rather than replacing the schema.
- Use exact-head GitHub Actions as the source of truth for generated-client validation.

A future schema model PR should document that the `Generate Prisma client` job passed on the exact PR head before merging.

## Runtime boundary

Adding a Prisma model must not introduce:

- service write paths
- background processors
- delivery execution
- external calls
- secret access
- recovery controls
- route handlers
- live provider behavior

## Source guard expectations

The source guard for the future schema model slice should verify both halves of the boundary:

- the migration exists and includes the expected storage fields/indexes
- `prisma/schema.prisma` contains `model OutboundWebhookDelivery`
- the schema model contains `idempotencyKey`, `nextEligibleAttemptAt`, `deadLetterSummary`, and `attemptCount`
- the schema model contains the expected unique/index declarations
- no service write path is added in the same slice
- no background processor, delivery executor, route handler, or recovery control is added in the same slice

## Follow-up implementation gate

The actual model-alignment slice should:

1. Add `model OutboundWebhookDelivery` to `prisma/schema.prisma`.
2. Keep the existing SQL migration unchanged unless a correction is required.
3. Run `npm run db:generate` or the CI `Generate Prisma client` step on the exact PR head.
4. Keep source coverage verifying the model exists and runtime behavior remains deferred.
5. Avoid service write paths until a dedicated persistence-access slice.
6. Confirm the schema diff is additive and limited to the passive model block.

This note is intentionally planning-only and does not make outbound delivery operational.
