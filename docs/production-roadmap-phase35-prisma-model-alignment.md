# Phase 35 Prisma Model Alignment

Status: model alignment planning and source coverage only; no Prisma schema model is added in this slice.

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

## Runtime boundary

Adding a Prisma model must not introduce:

- repository/service write paths
- dispatcher polling
- retry execution
- outbound HTTP delivery
- signing runtime or secret reads
- admin retry, cancel, replay, or force-send controls
- route handlers
- live provider delivery

## Follow-up implementation gate

The actual model-alignment slice should:

1. Add `model OutboundWebhookDelivery` to `prisma/schema.prisma`.
2. Keep the existing SQL migration unchanged unless a correction is required.
3. Run `npm run db:generate` or the CI `Generate Prisma client` step on the exact PR head.
4. Keep source coverage verifying the model exists and runtime behavior remains deferred.
5. Avoid repository/service write paths until a dedicated persistence-access slice.

This note is intentionally planning-only and does not make outbound delivery operational.
