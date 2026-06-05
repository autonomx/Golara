# Phase 33 Payment Operation History Route Input

Last updated: 2026-06-04

Status: repo-side read-only helper documentation. This note documents the pure route-input normalization helper for the Phase 33 payment-operation history surface.

## Scope

`lib/checkout/payment-operation-history-route-input.ts` normalizes untrusted history route query/input values before `lib/checkout/payment-operation-history-route-core.ts` calls the migration-gated history read service.

The helper is intentionally pure and presentation-adjacent:

- trims `orderId`
- rejects missing `orderId`
- defaults an omitted `limit` to `25`
- accepts numeric or string limits
- caps large limits at `100`
- rejects non-integer, non-numeric, zero, or negative limits
- returns `historyOptions` for display-only history view labels

## Behavior coverage

`tests/unit/payment-operation-history-route-input.test.ts` covers:

- trimmed order IDs
- default limit handling
- string limit parsing and capping
- numeric limit handling
- missing-order validation errors
- invalid-limit validation errors
- multiple validation errors returned together

The route-input test was first wired into `tests/unit/run-tests.ts` when the unit runner count reached `124 files`. A follow-up route-core behavior test now brings the current unit runner count to `125 files` while preserving this helper's read-only role.

## Source-boundary coverage

`tests/unit/payment-operation-migration-contract.test.ts` now guards the helper and route-core split by requiring:

- `normalizePaymentOperationHistoryRouteInput`
- `NormalizedPaymentOperationHistoryRouteInput`
- order-required validation copy
- positive-integer limit validation copy
- limit cap behavior
- generated `historyOptions`
- route-core delegation to `normalizePaymentOperationHistoryRouteInput`
- no route-core-owned `normalizeOrderId` or `normalizeLimit` functions

## Safety boundaries

This helper must remain read-only and must not add:

- provider calls
- default `fetch` behavior
- Stripe/ZarinPal live endpoint URLs
- provider credentials or secret handling
- operation-record creation
- refund or void execution
- admin execution buttons or click handlers
- order/payment mutation
- inventory/capacity release
- Prisma model/client access for `PaymentOperationRecord`

History reads remain target-environment migration gated by `PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED=true`. This helper does not change that gate and does not make history reads available by itself.
