# Phase 33 Payment Operation History Route Core

Last updated: 2026-06-04

Status: repo-side read-only route-core documentation. This note documents the Phase 33 payment-operation history route-core behavior coverage added after the route-input normalization helper.

## Scope

`lib/checkout/payment-operation-history-route-core.ts` composes the pure history route-input normalization helper with the migration-gated operation-record history service.

The route core is responsible for:

- returning `status: 400` for invalid history inputs
- trimming and normalizing valid `orderId` values before reads
- applying the capped display `limit` from `normalizePaymentOperationHistoryRouteInput`
- returning `status: 503` with `payment_operation_records_migration_unconfirmed` when the migration gate is not confirmed
- passing empty, read-only history view options into `buildPaymentOperationHistoryView` for migration-unconfirmed responses
- passing confirmed service records into `buildPaymentOperationHistoryView` only after the migration gate allows reads

## Behavior coverage

`tests/unit/payment-operation-history-route-core.test.ts` covers:

- invalid route-core input responses
- combined missing-order and invalid-limit validation errors
- migration-unconfirmed route-core responses
- normalized trimmed order IDs in blocked responses
- capped `limit` metadata in blocked responses
- `PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED` migration status metadata
- empty read-only history view state
- display-only history filter labels

The test is wired into `tests/unit/run-tests.ts`; the unit runner count is now `125 files`.

## Source-boundary coverage

`tests/unit/payment-operation-migration-contract.test.ts` guards the route-core behavior test by requiring:

- `runPaymentOperationHistoryRouteCoreTests`
- `buildPaymentOperationHistoryRouteResult`
- `status, 400`
- `status, 503`
- `payment_operation_records_migration_unconfirmed`
- `PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED`
- `Read-only history review`

## Safety boundaries

The route core and its behavior coverage must remain read-only and must not add:

- provider calls
- default `fetch` behavior
- live provider endpoint URLs
- provider credential handling
- operation-record creation
- refund or void execution
- admin execution buttons or click handlers
- order/payment mutation
- inventory/capacity release
- Prisma model/client access for `PaymentOperationRecord`

History reads remain target-environment migration gated by `PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED=true`. This route-core coverage does not enable execution and does not make history reads available by itself.
