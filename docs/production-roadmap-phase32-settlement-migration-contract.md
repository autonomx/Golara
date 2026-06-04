# Phase 32 Settlement Migration Contract

Last updated: 2026-06-04

This note documents the Phase 32 settlement reconciliation migration contract for operators and maintainers.

It is documentation only. It does not claim the migration has been applied in staging or production.

## Contract summary

- Durable settlement reconciliation records are stored in the migration-backed `PaymentSettlementReconciliation` table.
- The table is created by `prisma/migrations/20260604170000_add_payment_settlement_reconciliation/migration.sql`.
- `PaymentSettlementReconciliation` is not represented as a Prisma model in `prisma/schema.prisma`.
- Runtime access is intentionally raw-SQL backed through `lib/checkout/payment-settlement-repository.ts`.
- `prisma generate` does not validate this table as a Prisma model.
- Target environments must apply and verify the migration before setting `PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED="true"`.

## Required table relationships

`PaymentSettlementReconciliation` is expected to retain foreign-key relationships to:

- `CheckoutPaymentEvent`
- `CheckoutPaymentAttempt`
- `CheckoutOrder`

The table is expected to remain unique per `CheckoutPaymentEvent` through the `paymentEventId` unique index.

## Required repository behavior

`lib/checkout/payment-settlement-repository.ts` is expected to:

- Build reconciliation plans from recorded payment event, payment attempt, and checkout order rows.
- Upsert one reconciliation row per payment event.
- Refresh the reconciliation row when a duplicate webhook is replayed.
- List recent reconciliation rows for read-only admin visibility.
- Avoid mutating checkout orders or payment attempts directly.

Checkout/order mutation remains owned by the webhook service transition path, not the settlement repository.

## Deployment readiness implication

Production gateway checkout should stay blocked until the target environment has evidence that:

- The settlement migration was applied successfully.
- The table exists with the expected indexes and foreign keys.
- Webhook processing can create or refresh durable reconciliation rows.
- `/admin/payments/settlement` can read durable reconciliation rows.

Only after those checks are complete should operators set `PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED="true"`.

## Pending validation

The repository contains the migration, raw-SQL repository, source guards, admin visibility, and runbook documentation. Real migration application and provider-generated webhook validation still require staging or production access.
