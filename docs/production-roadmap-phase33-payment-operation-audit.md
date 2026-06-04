# Phase 33 Payment Operation Audit Note

Last updated: 2026-06-04

This note records the audit groundwork for Phase 33 payment operations. It supplements `docs/production-roadmap-phase33-payment-operations.md` because large updates to that progress document may be blocked by the connector safety layer.

## Scope

`lib/checkout/payment-operation-audit.ts` adds append-only admin audit payload helpers for payment-operation preview/request/blocked states and idempotency outcomes.

Covered event kinds:

- `preview_requested`
- `preview_blocked`
- `preview_manual_review`
- `pending_record_created`
- `idempotency_duplicate_reused`
- `idempotency_conflict_blocked`

## Boundary

The audit helper uses the existing `recordAdminAuditLog` helper and does not add a new table or migration.

This slice does not add:

- live provider refund calls;
- live provider void calls;
- checkout order status mutation;
- checkout payment attempt mutation;
- inventory or capacity release;
- admin refund/void execution buttons;
- provider dashboard imports.

## Current status

The helper can build normalized audit payloads and can record them through the existing admin audit log path.

Audit wiring added after the initial helper slice:

- `buildAuditedPaymentOperationPreviewRequestResult` records preview-request audit events for valid preview requests.
- Blocked previews record `preview_blocked`.
- Manual-review previews record `preview_manual_review`.
- Ready previews record `preview_requested`.
- `createPendingPaymentOperationRecordIfConfirmed` records `pending_record_created` after a pending operation record is created.
- Duplicate idempotency reuse records `idempotency_duplicate_reused`.
- Idempotency conflicts record `idempotency_conflict_blocked`.

The existing static admin preview page still uses the non-audited preview helper so page views do not create audit noise. Real flows can call the audited helper when a submitted preview request should create an operator-visible audit trail.

The pending-record service remains gated by `PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED`; if the target migration is not operator-confirmed, it returns `migration_unconfirmed` before repository or audit writes.

## Connector note

An attempted large replacement of `tests/unit/payment-operation-migration-contract.test.ts` to add more source guards for the audit wiring was blocked by the connector safety layer. Existing guard coverage for `lib/checkout/payment-operation-audit.ts` remains in that file from the prior slice, and this note records the wiring added in this slice.

## Recommended next work

- Add submitted/succeeded/failed repository status transitions behind the same migration gate.
- Add source/unit guard coverage for audited preview request and service wiring if the connector accepts a smaller guard-file approach.
- Add provider refund/void adapters only after preview, persistence, audit, and idempotency rules are fully wired and guarded.

## Verification status

Source guard coverage exists for the audit helper, but local verification is pending and expanded guard wiring was blocked. Do not claim `npm run test:unit`, `npm run typecheck`, migration application, audit write execution, repository write execution, or live provider validation passed unless actually run.
