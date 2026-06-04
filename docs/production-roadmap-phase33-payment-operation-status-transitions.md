# Phase 33 Payment Operation Status Transition Note

Last updated: 2026-06-04

This note records the Phase 33 record-only status transition foundation for `PaymentOperationRecord`.

## Scope

`lib/checkout/payment-operation-record-repository.ts` now includes raw-SQL helpers to update only the payment operation record status:

- `markPaymentOperationRecordSubmitted`
- `markPaymentOperationRecordSucceeded`
- `markPaymentOperationRecordFailed`

`lib/checkout/payment-operation-record-service.ts` exposes migration-gated wrappers:

- `markPaymentOperationRecordSubmittedIfConfirmed`
- `markPaymentOperationRecordSucceededIfConfirmed`
- `markPaymentOperationRecordFailedIfConfirmed`

## Gate

All service-level transition helpers remain behind `PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED` through `getPaymentOperationRecordsMigrationStatus`.

If the target environment is not operator-confirmed, the service returns `migration_unconfirmed` before repository writes.

## Boundary

These helpers only update fields on `PaymentOperationRecord`:

- `status`
- `providerOperationReference`
- `providerStatus`
- `errorCategory`
- `retryable`
- `metadata`
- `submittedAt`
- `completedAt`
- `updatedAt`

They do not add:

- live provider refund calls;
- live provider void calls;
- checkout order status mutation;
- checkout payment attempt mutation;
- inventory or capacity release;
- admin refund/void execution buttons;
- provider dashboard imports.

## Current status

The transitions are repository/service foundation only. They have not been executed against a target database in this environment. The `PaymentOperationRecord` migration still must be applied and verified in the target environment before these helpers are used.

## Recommended next work

- Add source/unit guard coverage for the transition helpers if the connector accepts a smaller guard-file approach.
- Add audit events for submitted/succeeded/failed transitions before provider execution wiring.
- Add provider refund/void adapters only after preview, persistence, audit, and idempotency rules are fully guarded.

## Verification status

Local verification is pending. Do not claim `npm run test:unit`, `npm run typecheck`, migration application, transition write execution, repository write execution, audit write execution, or live provider validation passed unless actually run.
