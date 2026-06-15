# Payment Operation State Transition Evidence

Last updated: 2026-06-14

## Purpose

`PAYMENT_OPERATION_STATE_TRANSITIONS_CONFIRMED="true"` must only be set after operator evidence proves that provider-backed refund/void success or failure maps safely to Golara order, payment, inventory, capacity, audit, and timeline behavior.

This checklist is backed by `lib/checkout/payment-operation-state-transition-matrix.ts` and the focused guard:

```bash
npm run check:payment-operation-transitions
```

## Required transition cases

Record evidence for every case below before enabling live refund/void state mutation.

### full-refund-before-fulfillment

Required evidence:

- Provider success response.
- Operation record succeeded transition.
- Order timeline entry.
- Inventory or capacity release policy.

Expected behavior:

- Order status moves to `refunded_after_provider_success` only after provider success.
- Payment status moves to `refunded_after_provider_success` only after provider success.
- Inventory/capacity release is eligible only after the release policy is reviewed.

### full-refund-after-fulfillment-started

Required evidence:

- Provider success response.
- Fulfillment status snapshot.
- Manual release review record.
- Order timeline entry.

Expected behavior:

- Order and payment can record refund success after provider success.
- Inventory/capacity release must remain manual review.
- The system must not automatically release delivery or perishable capacity after fulfillment has started.

### partial-refund

Required evidence:

- Provider success response.
- Partial amount reconciliation.
- Operation record succeeded transition.
- Customer-safe order status copy.

Expected behavior:

- Order remains paid with partial refund state.
- Payment status moves to `partially_refunded_after_provider_success`.
- Inventory/capacity is not released for partial refunds.

### void-before-fulfillment

Required evidence:

- Provider void success response.
- Authorization-not-captured snapshot.
- Operation record succeeded transition.
- Inventory or capacity release policy.

Expected behavior:

- Void is only allowed before capture or under provider-supported authorization semantics.
- Order can move to `cancelled_after_provider_success` only after provider success.
- Payment can move to `voided_after_provider_success` only after provider success.

### void-after-fulfillment-started

Required evidence:

- Provider or manual-review response.
- Fulfillment status snapshot.
- Manual release review record.
- Operator decision record.

Expected behavior:

- The system must not automatically cancel orders after fulfillment starts.
- The system must not automatically release inventory/capacity after fulfillment starts.
- Operator/manual review is required.

### provider-operation-failed

Required evidence:

- Provider failure response.
- Operation record failed transition.
- Retryability classification.
- Admin-visible failure reason.

Expected behavior:

- Order status stays unchanged.
- Payment status stays unchanged.
- Inventory/capacity release stays blocked.
- Retry requires operator decision and idempotency review.

## Required guards

Before setting the confirmation flag, verify source and behavior coverage for:

- Owner-only execution.
- Idempotency key reuse.
- No state mutation before provider success.
- No state mutation after provider failure.
- No inventory/capacity release after provider failure.
- No automatic release after fulfillment has started.
- No inventory release for partial refunds.
- Bounded/redacted audit metadata.
- Customer-safe order status copy.

## Confirmation rule

Do not set `PAYMENT_OPERATION_STATE_TRANSITIONS_CONFIRMED="true"` from source existence alone. The flag requires target-environment or provider-sandbox evidence for the enabled provider path and operator-reviewed state-transition behavior.
