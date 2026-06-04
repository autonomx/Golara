# Phase 33 Refunds, Voids, and Payment Operations Progress

Last updated: 2026-06-04

This note tracks Phase 33 work after the Phase 32 repo-side webhook and settlement reconciliation foundation.

## Current status

Phase 33 has provider-neutral refund/void planning, no-mutation preview generation, a pure preview input normalization helper, a read-only preview view model, a route-core style preview result, a request-core wrapper for normalized preview requests, a compact read-only admin preview panel, a static-sample admin preview route for admin-safe display, a documentation-only persistence design for future refund/void operation records, pure order/payment transition plus inventory/capacity release planning, read-only transition guidance in the admin preview payload/UI, a migration-backed table contract for future payment operation records, a blank operator evidence template for target-environment payment-operation migration validation, a read-only migration status helper for checking whether the target environment has been operator-confirmed, a docs-only repository/service design, a gated raw-SQL repository/service foundation for idempotent pending operation-record creation, append-only admin audit-log wiring for pending/duplicate/conflict/submitted/succeeded/failed operation-record lifecycle events, and a provider operation adapter contract with inert mock/manual/unavailable execution boundaries for future refund/void provider integration. This remains repo-side foundation work: no live Stripe or ZarinPal refund/void HTTP calls, order/payment mutations, inventory/capacity release, or admin execution buttons have been added. Repository/service use is gated behind target-environment migration confirmation.

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
- Added `docs/production-roadmap-phase33-payment-operation-repository-design.md` to document future idempotent `PaymentOperationRecord` repository/service semantics before implementation.
- Extended `tests/unit/payment-operation-migration-contract.test.ts` to guard the repository design note, idempotency requirements, audit coupling, and no-execution boundary. The runner count remains 118 files.
- Added `lib/checkout/payment-operation-record-repository.ts` as a raw-SQL repository for pending operation records with idempotency-key duplicate reuse and conflict detection.
- Added `lib/checkout/payment-operation-record-service.ts` as a migration-confirmed service gate around pending record creation and order-history reads.
- Extended `tests/unit/payment-operation-migration-contract.test.ts` to guard the repository/service source boundaries, idempotency handling, migration gate, no provider calls, and no order/payment mutation. The runner count remains 118 files.
- Extended `lib/checkout/payment-operation-audit.ts` with submitted/succeeded/failed operation-record audit kinds and wired `payment-operation-record-service.ts` to append admin audit-log entries after migration-gated record transitions.
- Extended `tests/unit/payment-operation-migration-contract.test.ts` to guard submitted/succeeded/failed transition audit wiring, provider-operation reference/error metadata capture, and the continued no-provider/no-order-mutation source boundary. The runner count remains 118 files.
- Added `lib/checkout/payment-operation-adapters.ts` as a provider operation adapter contract for future refund/void execution boundaries, with provider normalization, manual-review behavior, unavailable-provider behavior, and inert mock adapters for Stripe/ZarinPal/manual/unknown.
- Added `tests/unit/payment-operation-adapters.test.ts` to guard adapter normalization, mock success behavior, missing provider-reference failure behavior, manual-review behavior, unavailable-provider behavior, source-level no-fetch/no-Prisma/no-mutation boundaries, and this progress note.
- Wired `tests/unit/payment-operation-adapters.test.ts` into `tests/unit/run-tests.ts`, raising the runner count from 118 to 119 files.

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

`docs/production-roadmap-phase33-payment-operation-repository-design.md` defines the future idempotent repository/service contract for creating pending `PaymentOperationRecord` rows. It covers create-pending semantics, duplicate idempotency reuse, conflict blocking, pending/submitted/succeeded/failed/manual-review transitions, service-layer audit coupling, and implementation acceptance criteria. It is design-only and does not approve execution.

`paymentOperationRecordRepository` can create pending operation records idempotently by `idempotencyKey`, reuse matching duplicates, report conflicts for mismatched duplicate keys, find records by idempotency key, mark records submitted/succeeded/failed, and list records for an order. It uses raw SQL because `PaymentOperationRecord` is not a Prisma model. It does not call providers, mutate orders/payment attempts, release inventory/capacity, or write audit logs.

`paymentOperationRecordService` gates repository access through `getPaymentOperationRecordsMigrationStatus`. If `PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED` is not true for the target environment, it returns `migration_unconfirmed` instead of creating, transitioning, or listing records. When the gate is confirmed and repository transition updates succeed, the service appends admin audit-log entries for submitted, succeeded, and failed operation-record states with provider-operation reference, provider status, error category, retryability, and transition metadata.

`buildPaymentOperationAuditLogInput` can normalize payment-operation audit events into the existing admin audit-log shape for preview, blocked/manual-review, pending record creation, idempotency duplicate reuse, idempotency conflict blocking, and submitted/succeeded/failed record transitions. It does not call providers, mutate orders/payment attempts, or release inventory/capacity.

`payment-operation-adapters.ts` defines a provider operation adapter contract for future refund/void execution. It can normalize providers, route operations through supplied adapters, return manual-review results for manual operations, return unavailable results for unconfigured providers, and provide inert mock Stripe/ZarinPal/manual behavior for source/unit coverage. It does not make live provider HTTP calls, use Prisma, mutate order/payment state, release inventory/capacity, or expose admin execution controls.

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
- keep transition/release planning pure and advisory until provider execution and operator approval paths exist;
- keep repository/service implementation behind target-environment migration verification and explicit idempotency rules;
- keep `PaymentOperationRecord` raw-SQL-backed until a deliberate Prisma/client decision is made;
- require target-environment migration verification before repository/service writes;
- capture operator migration evidence before any execution path depends on the table;
- keep migration confirmation helpers read-only until execution behavior is deliberately added in a later guarded slice;
- append admin audit-log entries only for repository/service lifecycle events already gated by migration confirmation;
- keep provider operation adapters injectable and inert by default until live provider execution is intentionally wired;
- require provider-reference, idempotency, status, and error normalization before any live provider adapter is exposed to admin flows;
- avoid checkout order mutation;
- avoid payment attempt mutation;
- avoid inventory or capacity release;
- avoid live provider calls;
- be covered by source/unit guards before provider execution is added.

## Explicit non-goals for this slice

This slice intentionally does not add:

- live provider refund HTTP calls;
- live provider void HTTP calls;
- Prisma model/client access for `PaymentOperationRecord`;
- order status mutation;
- payment attempt mutation;
- inventory or capacity release;
- provider-success order/payment timeline mutation;
- admin refund/void execution buttons;
- provider dashboard settlement imports.

Those remain future Phase 33 slices after target-environment migration verification is complete and provider execution boundaries are defined.

## Recommended next work

1. Add provider-specific request/response mappers for Stripe/ZarinPal refund and void operations behind injected HTTP clients, still without wiring admin execution controls.
2. Add service-level execution orchestration that requires migration confirmation, an existing pending operation record, idempotency, audit transition logging, and adapter result normalization.
3. Add admin execution controls only after provider execution, provider error normalization, and post-success order/payment transition behavior are explicitly guarded.

## Verification status

Source/unit guard coverage has been added, but local verification is pending. Do not claim `npm run test:unit`, `npm run typecheck`, `npx prisma generate`, `npx prisma migrate status`, migration application, repository write execution, adapter execution in a target environment, or live provider validation passed unless those checks are actually run.
