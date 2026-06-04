# Phase 33 Payment Operation Repository Design

Last updated: 2026-06-04

This note defines the intended repository/service contract for future durable `PaymentOperationRecord` creation. It is design-only and does not add database writes, provider calls, order mutation, payment attempt mutation, inventory/capacity release, audit-log writes, or admin execution buttons.

## Scope

The future repository/service layer should create and read durable refund/void operation records only after:

- `prisma/migrations/20260604200000_add_payment_operation_records/migration.sql` is applied and verified in the target database;
- `docs/production-roadmap-phase33-payment-operation-migration-validation-evidence.md` is completed by an operator;
- `PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED=true` is set for that target environment;
- preview planning has returned a ready or manual-review decision that the admin flow is allowed to persist;
- audit and execution boundaries are explicitly defined in a later slice.

## Future repository responsibilities

A future `PaymentOperationRecord` repository should own raw-SQL access to the table while it remains absent from `prisma/schema.prisma`. It should provide narrow methods such as:

- `createPendingPaymentOperationRecord(input)` for first-write persistence;
- `findPaymentOperationRecordByIdempotencyKey(key)` for duplicate handling;
- `markPaymentOperationSubmitted(...)` after a provider request is accepted for processing;
- `markPaymentOperationSucceeded(...)` after provider success is verified;
- `markPaymentOperationFailed(...)` after provider failure or exhausted retry handling;
- `listPaymentOperationRecordsForOrder(orderId)` for admin read-only history.

The repository should not call Stripe, ZarinPal, notification providers, or audit services. It should only persist and read operation rows.

## Idempotent create-pending semantics

`createPendingPaymentOperationRecord(input)` should be idempotent by `idempotencyKey`.

Expected behavior:

- If no row exists for the idempotency key, insert a new pending row with the preview decision, preview reasons, transition plan, operator context, and request metadata.
- If a row already exists with the same idempotency key and matching normalized operation inputs, return the existing row without creating a duplicate.
- If a row already exists with the same idempotency key but conflicting order, payment attempt, operation kind, amount, currency, or provider context, return a conflict result and do not mutate the existing row.
- Never silently overwrite provider execution references, status fields, transition plans, operator fields, or metadata for an existing row.

## State transitions

The future service layer should move records through explicit statuses. A compact initial set is:

- `pending`: record created before provider execution;
- `submitted`: provider request accepted or queued;
- `succeeded`: provider confirmed refund/void success;
- `failed`: provider rejected the request or retry handling has ended;
- `manual_review`: operator review is required before execution or final transition.

Rules:

- Status transitions must be monotonic unless a later recovery flow is explicitly designed.
- Provider references must be attached before or during transition to `submitted` or `succeeded`.
- Failure details must be stored without losing the original preview decision and transition plan.
- `succeeded` must not automatically mutate checkout orders, payment attempts, inventory, or capacity until a separate service slice defines those writes.

## Audit coupling

audit writes should be coupled at the service layer, not the raw repository layer.

Future audit events should include:

- preview persisted;
- duplicate idempotency reuse;
- idempotency conflict blocked;
- provider submission attempted;
- provider submission accepted;
- provider failure recorded;
- provider success recorded;
- order/payment transition applied;
- inventory/capacity release applied or skipped;
- manual review required or resolved.

Repository writes and audit writes should be designed so operator-visible history remains explainable even when provider execution fails.

## Execution boundary

This design does not approve execution. The following remain future work:

- live Stripe refund calls;
- live Stripe void/cancel calls;
- live ZarinPal refund calls;
- live ZarinPal void/cancel calls, if supported;
- checkout order status mutation;
- checkout payment attempt mutation;
- inventory or capacity release;
- audit-log persistence;
- admin refund/void execution controls.

## Acceptance criteria for the implementation slice

Before implementation, the next code slice should:

- keep the repository behind the migration confirmation helper;
- use raw SQL while `PaymentOperationRecord` is not in `prisma/schema.prisma`;
- include source/unit guards for no provider calls and no order/payment mutation;
- test idempotent create-pending behavior;
- test duplicate idempotency reuse;
- test idempotency conflict blocking;
- keep execution controls disabled until provider and audit slices are ready;
- keep target-environment migration verification marked pending unless actually performed.
