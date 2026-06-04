# Phase 33 Refunds, Voids, and Payment Operations Progress

Last updated: 2026-06-04

This note tracks Phase 33 work after the Phase 32 repo-side webhook and settlement reconciliation foundation.

## Current status

Phase 33 has started with a provider-neutral refund/void planning helper. This is a repository-side planning foundation only; it does not call Stripe, ZarinPal, or any other live provider, and it does not mutate payment attempts, orders, refunds, inventory, or audit logs.

## Completed in Phase 33 so far

- Added `lib/checkout/payment-operation-plan.ts` for pure refund/void operation planning.
- Added `tests/unit/payment-operation-plan.test.ts` for refund and void eligibility coverage.
- Wired `tests/unit/payment-operation-plan.test.ts` into `tests/unit/run-tests.ts`, raising the runner count from 115 to 116 files.

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

## Explicit non-goals for this slice

This slice intentionally does not add:

- live provider refund calls;
- live provider void calls;
- database writes;
- order status mutation;
- payment attempt mutation;
- inventory or capacity release;
- refund/void audit logs;
- admin refund/void buttons;
- provider dashboard settlement imports.

Those remain future Phase 33 slices after the provider-neutral planning contract is stable.

## Recommended next work

1. Add a repository/service boundary that can consume `planPaymentOperation` and return a no-mutation preview for admin display.
2. Add persistent refund/void records only when the storage model is clear.
3. Add audit-log and inventory/capacity release planning before any live provider mutation.
4. Add provider adapters for Stripe/ZarinPal refund and void execution only after preview, persistence, audit, and idempotency rules are defined.

## Verification status

Source/unit guard coverage has been added, but local verification is pending. Do not claim `npm run test:unit`, `npm run typecheck`, `npx prisma generate`, `npx prisma migrate status`, or live provider validation passed unless those checks are actually run.
