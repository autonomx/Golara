# Phase 33 Refund/Void Persistence Design

Last updated: 2026-06-04

This document defines the intended persistence, idempotency, audit, and release-rule shape for future Phase 33 refund and void execution work. It is documentation-only and intentionally does not add a migration, Prisma model, repository, provider call, order mutation, payment-attempt mutation, or admin execution button.

## Scope

Refund and void operations should become durable only after the preview boundary is stable. The storage model should make each operator request traceable from preview to provider execution, settlement follow-up, audit timeline, and any downstream order or capacity release.

## Proposed durable record

A future refund/void record should capture:

- stable operation ID;
- order ID and order number;
- payment attempt ID;
- operation kind: `refund` or `void`;
- requested amount and currency;
- original payment amount and currency;
- provider and provider reference;
- idempotency key;
- operator identity and operator reason;
- preview decision and planning reasons at submission time;
- execution status: pending, submitted, succeeded, failed, cancelled, or manual_review;
- provider response reference and normalized provider status;
- error category and retryable flag when provider execution fails;
- created, submitted, completed, and updated timestamps.

## Idempotency

Refund and void execution must be idempotent before any provider mutation is introduced.

Recommended key shape:

```text
payment-operation:{operationKind}:{paymentAttemptId}:{amountCents}:{currency}:{stableReasonHash}
```

Rules:

- use one idempotency key per intended provider mutation;
- store the key before calling a provider;
- reject or return the existing operation when the same key is submitted again;
- make retries reuse the same provider idempotency key;
- never derive idempotency solely from a browser request ID;
- include an operator-visible duplicate/replay outcome.

## Audit timeline

A future audit trail should record append-only events such as:

- preview_generated;
- operation_requested;
- operation_blocked;
- provider_submission_started;
- provider_submission_succeeded;
- provider_submission_failed;
- manual_review_required;
- order_release_evaluated;
- inventory_or_capacity_release_applied;
- settlement_followup_required.

Audit entries should include actor, timestamp, operation ID, order ID, payment attempt ID, event kind, reason, and a small normalized metadata payload. Provider raw payloads should remain outside the audit row unless a safe redaction policy is defined.

## Order and payment timelines

Refund/void persistence should not directly overwrite order or payment-attempt status without a transition plan. Future execution work should route status changes through a pure transition helper that can decide whether:

- an order remains paid after a partial refund;
- an order becomes refunded after a full refund;
- an order returns to pending, cancelled, or voided after authorization void;
- a payment attempt becomes partially_refunded, refunded, voided, failed, or still captured;
- manual-review operations should avoid automatic status mutation.

## Inventory and capacity release planning

Inventory or capacity release should be separate from provider execution. A future release helper should consider:

- full refund vs partial refund;
- void before fulfillment vs refund after fulfillment;
- perishable or scheduled floral capacity windows;
- fulfillment status and delivery cutoff;
- whether a replacement order or store-credit workflow exists;
- whether operator approval is required before release.

No release should happen merely because a preview was generated.

## Admin execution boundary

Future admin execution UI should remain disabled until all of these exist:

- durable operation storage;
- idempotency enforcement;
- audit timeline writes;
- provider adapter contracts;
- order/payment transition rules;
- inventory/capacity release rules;
- operator permission checks;
- retry and failure-display behavior;
- staging provider validation.

## Explicit non-goals for this design note

This note does not add:

- database migrations;
- Prisma models;
- repositories or services;
- provider refund calls;
- provider void calls;
- order mutation;
- payment-attempt mutation;
- inventory or capacity release;
- audit-log writes;
- admin execution buttons.

## Recommended next implementation sequence

1. Add migration-backed operation records only after this contract is accepted.
2. Add a repository/service layer that can create pending operations idempotently.
3. Add append-only audit events for preview/request/blocked states.
4. Add pure order/payment transition planning helpers.
5. Add inventory/capacity release planning helpers.
6. Add provider execution adapters only after persistence, idempotency, audit, and transition planning are in place.
