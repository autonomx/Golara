# Phase 33 Payment Operation Migration Contract

Last updated: 2026-06-04

This note documents the target-environment contract for `prisma/migrations/20260604200000_add_payment_operation_records/migration.sql`.

## Purpose

The migration adds `PaymentOperationRecord`, a durable table intended for future refund and void operation requests. The table is designed to support idempotency, operator attribution, preview decisions, provider execution status, transition planning metadata, and order/payment timeline correlation.

## Current repo-side boundary

This migration is repository-side schema groundwork only. Current Phase 33 code still does not create records, update records, call providers, mutate orders, mutate payment attempts, release inventory/capacity, or write audit events.

`PaymentOperationRecord` is raw-SQL migration-backed and is not currently represented as a Prisma model in `prisma/schema.prisma`. `prisma generate` therefore does not validate a Prisma client model for this table.

## Target-environment requirements

Before any future repository/service layer writes to `PaymentOperationRecord`, operators must:

1. Apply `prisma/migrations/20260604200000_add_payment_operation_records/migration.sql` in the target environment.
2. Verify that `PaymentOperationRecord` exists.
3. Verify foreign keys to `CheckoutOrder` and `CheckoutPaymentAttempt`.
4. Verify the unique idempotency index on `idempotencyKey`.
5. Verify order/payment/provider/status indexes.
6. Confirm the table is readable by the application database user.
7. Keep rollback to non-execution preview mode available.

## Required columns

The table includes:

- stable operation ID;
- order and payment attempt references;
- operation kind;
- requested amount and currency;
- original payment amount and currency;
- provider and provider reference;
- unique idempotency key;
- operator identity and reason fields;
- preview decision and preview reasons;
- execution status and provider execution references;
- retry/error fields;
- transition plan JSON metadata;
- generic metadata JSON;
- submitted/completed/created/updated timestamps.

## Explicit non-goals

This migration does not add:

- Prisma model/client access;
- repository writes;
- service writes;
- provider refund calls;
- provider void calls;
- order status mutation;
- payment-attempt mutation;
- inventory/capacity release;
- audit-log writes;
- admin execution buttons.

Those remain future Phase 33 slices after the migration contract is accepted and target-environment migration validation is complete.

## Recommended next repository sequence

1. Add a read-only migration guard or status helper around the table contract.
2. Add a repository/service layer that can create pending operation records idempotently only after target migration validation is available.
3. Add append-only audit events for preview/request/blocked states.
4. Add provider adapters only after persistence, idempotency, audit, and operator execution rules are defined.
