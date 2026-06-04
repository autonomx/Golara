# Phase 33 Refunds, Voids, and Payment Operations Progress

Last updated: 2026-06-04

This note tracks Phase 33 work after the Phase 32 repo-side webhook and settlement reconciliation foundation.

## Current status

Phase 33 has provider-neutral refund/void planning, no-mutation preview generation, a read-only preview view model, a route-core style preview result, and a compact read-only admin preview panel for admin-safe display. This is still repository-side planning only; it does not call Stripe, ZarinPal, or any other live provider, and it does not mutate payment attempts, orders, refunds, inventory, or audit logs.

## Completed in Phase 33 so far

- Added `lib/checkout/payment-operation-plan.ts` for pure refund/void operation planning.
- Added `tests/unit/payment-operation-plan.test.ts` for refund and void eligibility coverage.
- Wired `tests/unit/payment-operation-plan.test.ts` into `tests/unit/run-tests.ts`, raising the runner count from 115 to 116 files.
- Added no-mutation preview acceptance criteria below so the next Phase 33 repository slice has a clear boundary before persistence or live provider operations.
- Added `lib/checkout/payment-operation-preview.ts` to convert `planPaymentOperation` results into admin-safe preview payloads without persistence, provider calls, order mutation, payment attempt mutation, inventory/capacity release, or audit-log writes.
- Extended `tests/unit/payment-operation-plan.test.ts` to guard ready, blocked, and manual-review preview behavior plus source-level no-mutation constraints.
- Added `lib/checkout/payment-operation-preview-view.ts` to format preview results into read-only admin display rows, status labels, tones, action labels, and disabled-reason copy.
- Extended `tests/unit/payment-operation-plan.test.ts` to guard preview view success, warning, and danger states plus source-level no-mutation constraints.
- Added `lib/checkout/payment-operation-preview-route-core.ts` to return a stable route-core result shape around `buildPaymentOperationPreviewView` without persistence or provider calls.
- Extended `tests/unit/payment-operation-plan.test.ts` to guard the preview route-core helper and source-level no-mutation constraints.
- Added `components/admin/AdminPaymentOperationPreviewPanel.tsx` as a compact read-only admin preview panel that consumes `PaymentOperationPreviewRouteResult` and renders summary, details, warnings, and disabled action copy without execution controls.
- Extended `tests/unit/payment-operation-plan.test.ts` to guard the admin preview panel source boundary, including no Prisma, fetch, order/payment mutation, `onClick`, or `<button` execution affordances.

## Current helper behavior

`planPaymentOperation` can evaluate:

- refund vs void operation kind;
- provider name normalization;
- manual/inquiry/assisted provider manual-review behavior;
- provider-reference requirements for non-manual providers;
- positive operation amount requirements;
- operation amount not exceeding the original payment amount;
- order/payment currency mismatch blocking;
- closed-order blocking;
- refundable payment statuses;
- voidable payment statuses;
- full vs partial amount metadata;
- operator reason metadata.

`buildPaymentOperationPreview` can return admin-safe display data for:

- ready operations;
- blocked operations with human-readable warnings;
- manual-review operations;
- order number and payment attempt identifiers when supplied;
- next-action copy that keeps provider execution deferred until preview, persistence, audit, and idempotency rules are defined.

`buildPaymentOperationPreviewView` can format preview data into:

- success, warning, and danger tones;
- status labels;
- operation detail rows;
- action labels;
- disabled-reason copy for read-only admin display.

`buildPaymentOperationPreviewRouteResult` can wrap the preview view into a route-core response shape for future admin routes without adding database writes, provider calls, order mutation, payment attempt mutation, inventory/capacity release, or audit-log writes.

`AdminPaymentOperationPreviewPanel` can render the route-core preview result into a compact admin panel with:

- preview status tone;
- summary and next-action copy;
- read-only operation details;
- warning copy for blocked/manual-review states;
- disabled action copy;
- no refund/void execution button.

## Preview boundary acceptance criteria

The no-mutation preview boundary should continue to:

- accept an order/payment snapshot and desired refund or void request;
- call `planPaymentOperation` as the single source of eligibility truth;
- return a preview payload that is safe for admin display;
- include operation kind, decision, provider, amount, currency, reasons, manual-review state, and provider-reference requirements;
- include clear copy for blocked and manual-review states;
- render read-only admin UI without execution controls;
- avoid database writes;
- avoid checkout order mutation;
- avoid payment attempt mutation;
- avoid inventory or capacity release;
- avoid audit-log writes;
- avoid live provider calls;
- be covered by source/unit guards before any persistence or provider execution is added.

## Explicit non-goals for this slice

This slice intentionally does not add:

- live provider refund calls;
- live provider void calls;
- database writes;
- order status mutation;
- payment attempt mutation;
- inventory or capacity release;
- refund/void audit logs;
- admin refund/void execution buttons;
- provider dashboard settlement imports.

Those remain future Phase 33 slices after the provider-neutral planning and preview contracts are stable.

## Recommended next work

1. Add preview input normalization for future admin form/query payloads while keeping the boundary pure and no-mutation.
2. Add persistent refund/void records only when the storage model is clear.
3. Add audit-log and inventory/capacity release planning before any live provider mutation.
4. Add provider adapters for Stripe/ZarinPal refund and void execution only after preview, persistence, audit, and idempotency rules are defined.

## Verification status

Source/unit guard coverage has been added, but local verification is pending. Do not claim `npm run test:unit`, `npm run typecheck`, `npx prisma generate`, `npx prisma migrate status`, or live provider validation passed unless those checks are actually run.
