# Phase 33 Refunds, Voids, and Payment Operations Progress

Last updated: 2026-06-04

This note tracks Phase 33 work after the Phase 32 repo-side webhook and settlement reconciliation foundation.

## Current status

Phase 33 has provider-neutral refund/void planning, no-mutation preview generation, a pure preview input normalization helper, a read-only preview view model, a route-core style preview result, a request-core wrapper for normalized preview requests, a compact read-only admin preview panel, a static-sample admin preview route for admin-safe display, a documentation-only persistence design for future refund/void operation records, pure order/payment transition plus inventory/capacity release planning, read-only transition guidance in the admin preview payload/UI, a migration-backed table contract for future payment operation records, a blank operator evidence template for target-environment payment-operation migration validation, and a read-only migration status helper for checking whether the target environment has been operator-confirmed. This remains repo-side foundation work: the table migration, evidence template, and status helper are added, but no repository/service writes, provider calls, order/payment mutations, inventory/capacity release, audit writes, or execution buttons have been added.

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
- Added `lib/checkout/payment-operation-preview-input.ts` as a pure preview input normalization helper for future admin form/query payloads.
- Extended `tests/unit/payment-operation-plan.test.ts` to guard valid preview input normalization, structured field errors, identifier/currency/amount validation, and source-level no-mutation constraints for the normalizer.
- Added `lib/checkout/payment-operation-preview-request-core.ts` as a route-core wrapper that combines preview input normalization with `buildPaymentOperationPreviewRouteResult`.
- Extended `tests/unit/payment-operation-plan.test.ts` to guard request-core success responses, `status: 400` structured validation errors, and source-level no-mutation constraints.
- Added `app/admin/payments/operations/preview/page.tsx` as a compact read-only admin route that uses `buildPaymentOperationPreviewRequestResult` with static sample data and renders the existing preview panel.
- Extended `tests/unit/payment-operation-plan.test.ts` to guard the admin preview route as static-sample, read-only, and free of provider calls, Prisma, mutations, click handlers, and execution buttons.
- Added `docs/production-roadmap-phase33-refund-void-persistence-design.md` to document future refund/void operation records, idempotency, audit, order/payment timelines, and inventory/capacity release planning before any migration.
- Extended `tests/unit/payment-operation-plan.test.ts` to guard the persistence design note and its explicit no-migration/no-provider-mutation boundary.
- Added `lib/checkout/payment-operation-transition-plan.ts` for pure post-provider-success order/payment transition recommendations and inventory/capacity release planning.
- Added `tests/unit/payment-operation-transition-plan.test.ts` for blocked, manual-review, partial refund, full refund, and void transition/release scenarios.
- Wired `tests/unit/payment-operation-transition-plan.test.ts` into `tests/unit/run-tests.ts`, raising the runner count from 116 to 117 files.
- Fed `planPaymentOperationTransition` into `buildPaymentOperationPreview` so preview payloads now include advisory transition/release planning without mutation.
- Extended `normalizePaymentOperationPreviewInput` to accept optional fulfillment status and perishable-capacity context for transition planning.
- Extended `buildPaymentOperationPreviewView` and `AdminPaymentOperationPreviewPanel` to show read-only advisory transition rows for future post-provider-success outcomes.
- Extended `tests/unit/payment-operation-transition-plan.test.ts` to guard transition context normalization, preview integration, view rows, and read-only admin display boundaries.
- Added `prisma/migrations/20260604200000_add_payment_operation_records/migration.sql` for the future `PaymentOperationRecord` table.
- Added `docs/production-roadmap-phase33-payment-operation-migration-contract.md` to document target-environment migration application, raw-SQL/Prisma caveats, and future persistence prerequisites.
- Added `tests/unit/payment-operation-migration-contract.test.ts` to guard the migration SQL, migration contract note, and absence of a Prisma model.
- Wired `tests/unit/payment-operation-migration-contract.test.ts` into `tests/unit/run-tests.ts`, raising the runner count from 117 to 118 files.
- Added `docs/production-roadmap-phase33-payment-operation-migration-validation-evidence.md` as a blank operator evidence template for target-environment `PaymentOperationRecord` migration validation.
- Extended `tests/unit/payment-operation-migration-contract.test.ts` to guard the migration validation evidence template and its no-execution boundary. The runner count remains 118 files.
- Added `lib/checkout/payment-operation-migration-status.ts` as a read-only helper for the `PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED` environment gate.
- Extended `tests/unit/payment-operation-migration-contract.test.ts` to guard the migration status helper, its prerequisite copy, and its no-Prisma/no-fetch/no-order-payment-source boundary. The runner count remains 118 files.

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

`normalizePaymentOperationPreviewInput` can normalize future admin form/query payloads into `PaymentOperationPreviewInput` by:

- accepting unknown raw values so routes or forms can pass untrusted input safely;
- validating refund vs void operation kind;
- validating required order/payment status, provider, amount, and currency fields;
- normalizing cent amounts into positive integers;
- normalizing currencies to uppercase safe codes;
- trimming optional reason, order number, payment attempt ID, and provider reference values;
- normalizing optional fulfillment status for transition planning;
- normalizing optional perishable-capacity context for release planning;
- returning structured field errors for display when input is invalid;
- avoiding database writes, provider calls, order mutation, and payment attempt mutation.

`buildPaymentOperationPreviewRequestResult` can:

- accept the same draft input shape as `normalizePaymentOperationPreviewInput`;
- return `status: 400` with `{ ok: false, errors }` when input validation fails;
- return the existing read-only `PaymentOperationPreviewRouteResult` when input is valid;
- keep route wiring free of provider execution, persistence, order mutation, payment attempt mutation, inventory/capacity release, and audit-log writes.

`buildPaymentOperationPreview` can return admin-safe display data for:

- ready operations;
- blocked operations with human-readable warnings;
- manual-review operations;
- transition/release guidance from `planPaymentOperationTransition`;
- order number and payment attempt identifiers when supplied;
- next-action copy that keeps provider execution deferred until preview, persistence, audit, and idempotency rules are defined.

`buildPaymentOperationPreviewView` can format preview data into:

- success, warning, and danger tones;
- status labels;
- operation detail rows;
- transition recommendation rows;
- action labels;
- disabled-reason copy for read-only admin display.

`buildPaymentOperationPreviewRouteResult` can wrap the preview view into a route-core response shape for future admin routes without adding database writes, provider calls, order mutation, payment attempt mutation, inventory/capacity release, or audit-log writes.

`AdminPaymentOperationPreviewPanel` can render the route-core preview result into a compact admin panel with:

- preview status tone;
- summary and next-action copy;
- read-only operation details;
- read-only advisory transition guidance;
- warning copy for blocked/manual-review states;
- disabled action copy;
- no refund/void execution button.

`/admin/payments/operations/preview` can render a static sample payment-operation preview for authenticated admins. It uses `buildPaymentOperationPreviewRequestResult` and `AdminPaymentOperationPreviewPanel`, and it does not submit refunds, void authorizations, create records, call providers, or mutate orders/payment attempts.

`docs/production-roadmap-phase33-refund-void-persistence-design.md` defines the intended future persistence shape before any migration, including:

- durable operation record fields;
- provider idempotency key rules;
- append-only audit timeline events;
- order/payment transition planning;
- inventory/capacity release planning;
- admin execution prerequisites;
- explicit no-goals for migrations, provider calls, mutations, audit writes, and execution buttons.

`planPaymentOperationTransition` can recommend future post-provider-success behavior without mutating anything:

- blocked operations keep order/payment/release state unchanged;
- manual-review operations stay unchanged until operator review;
- partial refunds recommend partial payment status and no automatic release;
- full refunds before fulfillment may evaluate capacity release;
- full refunds after fulfillment starts require manual release review;
- voids before fulfillment may cancel after provider success and evaluate capacity release;
- voids after fulfillment starts require manual review before cancellation/release.

`PaymentOperationRecord` migration-backed storage is now defined for future persistence. The table is intentionally raw-SQL-backed for this slice and is not in `prisma/schema.prisma`; `prisma generate` does not validate a Prisma client model for it. Target environments must apply and verify `prisma/migrations/20260604200000_add_payment_operation_records/migration.sql` before any repository/service writes depend on it.

`docs/production-roadmap-phase33-payment-operation-migration-validation-evidence.md` defines the operator evidence expected before considering the `PaymentOperationRecord` migration target-environment verified. It captures target SHA, migration command/job evidence, table/column verification, foreign key and index verification, application read-access evidence, rollback mode, execution-boundary confirmation, and operator sign-off. It is a blank template only and does not claim migration application or production validation.

`getPaymentOperationRecordsMigrationStatus` can summarize the read-only `PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED` environment gate. It returns the flag name, raw value, migration path, evidence path, prerequisite behavior that must not depend on the table before confirmation, and warnings when the target environment has not been operator-confirmed. It does not use Prisma, fetch, provider adapters, order/payment mutation, inventory/capacity release, audit writes, or admin execution controls.

## Preview and persistence boundary acceptance criteria

The current boundary should continue to:

- accept an order/payment snapshot and desired refund or void request;
- normalize untrusted admin form/query inputs through a pure helper before route-core preview construction;
- return structured field errors for invalid preview input;
- return `status: 400` only for malformed preview request input, not for eligible blocked payment-operation decisions;
- call `planPaymentOperation` as the single source of eligibility truth;
- return a preview payload that is safe for admin display;
- include operation kind, decision, provider, amount, currency, reasons, manual-review state, and provider-reference requirements;
- include clear copy for blocked and manual-review states;
- include transition/release planning as advisory-only display data;
- render read-only admin UI without execution controls;
- keep static/demo preview routes free of provider calls, persistence, order mutation, payment attempt mutation, and execution affordances;
- keep persistence design documentation explicit when migrations or provider mutation have not been added;
- keep transition/release planning pure and advisory until persistence, audit, and operator approval paths exist;
- keep `PaymentOperationRecord` raw-SQL-backed until a deliberate Prisma/client decision is made;
- require target-environment migration verification before repository/service writes;
- capture operator migration evidence before any execution path depends on the table;
- keep migration confirmation helpers read-only until execution behavior is deliberately added in a later guarded slice;
- avoid repository/service writes until an idempotent creation layer is added;
- avoid checkout order mutation;
- avoid payment attempt mutation;
- avoid inventory or capacity release;
- avoid audit-log writes;
- avoid live provider calls;
- be covered by source/unit guards before provider execution is added.

## Explicit non-goals for this slice

This slice intentionally does not add:

- live provider refund calls;
- live provider void calls;
- Prisma model/client access for `PaymentOperationRecord`;
- repository writes;
- service writes;
- order status mutation;
- payment attempt mutation;
- inventory or capacity release;
- refund/void audit logs;
- admin refund/void execution buttons;
- provider dashboard settlement imports.

Those remain future Phase 33 slices after the migration contract is accepted and target-environment migration verification is complete.

## Recommended next work

1. Add a repository/service design note for future idempotent operation-record creation.
2. Add a repository/service layer that can create pending operation records idempotently only after the target migration is applied, verified, and gated.
3. Add append-only audit events for preview/request/blocked states.
4. Add provider adapters for Stripe/ZarinPal refund and void execution only after preview, persistence, audit, and idempotency rules are defined.

## Verification status

Source/unit guard coverage has been added, but local verification is pending. Do not claim `npm run test:unit`, `npm run typecheck`, `npx prisma generate`, `npx prisma migrate status`, migration application, or live provider validation passed unless those checks are actually run.
