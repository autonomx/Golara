# Phase 33 Payment Operation Admin Navigation

Last updated: 2026-06-04

This note maps the read-only admin surfaces for Phase 33 refund, void, and payment-operation diagnostics. It is intentionally documentation-only and does not enable provider execution.

## Entry points

- `/admin/payments/settlement`
  - Existing payment settlement entry point.
  - Links to the Phase 33 payment operations landing page and individual diagnostics.
  - Settlement review remains separate from refund/void execution.
- `/admin/payments/operations`
  - Read-only Phase 33 landing page for payment-operation diagnostics.
  - Links to provider readiness, operation history, and operation preview.
- `/admin/payments/operations/providers`
  - Read-only provider readiness diagnostics.
  - Shows credential environment variable names, endpoint mapping evidence, target-environment validation evidence, manual-review state, and unavailable provider state.
  - Always reports execution disabled.
- `/admin/payments/operations/history`
  - Read-only operation history view for a supplied order ID.
  - Reads persisted `PaymentOperationRecord` rows only when the target environment confirms the migration gate.
  - Shows migration-unconfirmed guidance otherwise.
  - History/admin polish may add read-only filters, summaries, and empty-state copy, but must not add execution controls.
- `/admin/payments/operations/preview`
  - Read-only static preview sample for refund/void planning.
  - Uses route-core preview normalization and view helpers without creating records or executing provider adapters.

## Navigation expectations

- Settlement should link to `/admin/payments/operations` as the top-level Phase 33 operation entry point.
- Settlement may also link directly to provider readiness, history, and preview diagnostics for convenience.
- Provider readiness, history, and preview pages should each link back to `/admin/payments/operations`.
- Operation pages may link to each other when useful, but all links must remain plain navigation.

## History/admin polish boundaries

Approved read-only history improvements include:

- clearer migration-unconfirmed empty states;
- operator-facing summary rows for already persisted operation records;
- display-only filtering labels based on existing query parameters;
- status, retryability, provider, and order labels derived from already loaded records;
- links back to read-only Phase 33 operation pages.

History/admin polish must not introduce:

- operation-record creation;
- provider adapter execution;
- refund or void submission;
- order/payment mutation;
- inventory/capacity release;
- default HTTP clients;
- live provider endpoint URLs;
- execution buttons or click handlers.

## Safety boundaries

These admin surfaces must remain read-only until later guarded execution work is deliberately added. They must not add:

- live Stripe or ZarinPal refund calls;
- live Stripe or ZarinPal void calls;
- concrete live provider endpoint URLs;
- default `fetch` behavior;
- caller-invisible provider HTTP clients;
- provider credential values or secret display;
- Prisma model/client access for `PaymentOperationRecord`;
- pending operation-record creation from navigation pages;
- provider adapter execution from navigation pages;
- order mutation;
- payment mutation;
- inventory or capacity release;
- refund/void buttons;
- click handlers that trigger execution.

## Operator workflow intent

1. Start from `/admin/payments/settlement` or `/admin/payments/operations`.
2. Review `/admin/payments/operations/providers` to confirm which providers still need operator evidence.
3. Use `/admin/payments/operations/preview` to inspect read-only planning copy and transition guidance.
4. Use `/admin/payments/operations/history?orderId=<order-id>` only after target-environment migration confirmation exists.
5. Do not attempt live refund/void execution from these pages; execution remains a future guarded Phase 33 slice.

## Validation expectations

Source/unit guards should continue checking the navigation pages for:

- required read-only links;
- no default provider calls;
- no adapter execution;
- no direct Prisma client/model use for operation records;
- no live provider endpoint URLs;
- no refund/void buttons or click handlers;
- no order/payment mutation SQL;
- no history/admin polish language that implies execution is available.
