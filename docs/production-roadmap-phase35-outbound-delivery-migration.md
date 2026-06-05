# Phase 35 Outbound Delivery Migration

Status: additive migration slice added for the future durable outbound webhook delivery table; dispatcher, retry execution, signing runtime, admin recovery controls, persistence write paths, and live outbound delivery remain deferred.

Last updated: 2026-06-05

## Scope

This slice adds the database migration artifact for the planned outbound webhook delivery record while preserving the Phase 35 runtime safety boundary.

The migration is intentionally additive. It creates the future logical delivery table and indexes needed by later persistence, dispatcher, admin visibility, and recovery slices, but it does not create any code path that writes to or reads from the table.

## Added migration artifact

- `prisma/migrations/20260605190500_add_outbound_webhook_delivery/migration.sql`

The migration creates `OutboundWebhookDelivery` with:

- stable `id`
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

## Constraints and indexes

The migration includes:

- primary key on `id`
- unique index on `idempotencyKey`
- lookup index on `configurationKey` plus `status`
- lookup index on `eventType` plus `eventRef`
- future polling index on `status` plus `nextEligibleAttemptAt`
- admin list index on `createdAt`
- non-negative `attemptCount` check
- lifecycle-status check aligned to the Phase 35 tracker

## Runtime safety boundary

This migration slice does not add:

- dispatcher polling
- retry execution
- scheduler, queue consumer, or background loop
- outbound HTTP delivery
- signing runtime or secret reads
- admin retry, cancel, replay, or force-send controls
- repository/service write path
- route handler
- live provider delivery

## Follow-up gates

Before runtime usage, future slices still need:

1. Prisma model alignment and generated-client validation if the project chooses to expose the table through Prisma Client.
2. Repository/service read/write boundary review.
3. Admin visibility list view before recovery controls.
4. Runtime signing implementation after authenticity contract acceptance.
5. Dispatcher implementation only after persistence, signing, retry policy, and admin recovery boundaries are ready.

This migration makes durable storage possible; it does not make outbound delivery operational.
