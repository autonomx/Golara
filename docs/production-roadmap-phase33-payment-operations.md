# Phase 33 Refunds, Voids, and Payment Operations Progress

Last updated: 2026-06-04

This note tracks Phase 33 work after the Phase 32 repo-side webhook and settlement reconciliation foundation.

## Current status

Phase 33 has provider-neutral refund/void planning, no-mutation preview generation, pure preview input normalization, read-only preview view models, route-core preview/request helpers, compact read-only admin preview display, documentation-only persistence design, pure order/payment transition plus inventory/capacity release planning, a migration-backed `PaymentOperationRecord` table contract, target-environment migration evidence templates, a read-only migration status helper, repository/service design notes, gated raw-SQL repository/service foundations, append-only admin audit-log wiring for operation-record lifecycle events, provider operation adapter contracts, inert mock/manual/unavailable adapter behavior, symbolic Stripe/ZarinPal request/response mappers, injected provider HTTP adapter factories, migration-gated service-level execution orchestration for existing operation records, read-only payment operation history view/panel helpers, a migration-gated payment operation history route-core helper, a compact read-only admin operation-history route, a documentation-only provider endpoint mapping readiness worksheet, read-only provider-operation readiness diagnostics, a compact read-only admin provider-readiness panel component, and a read-only provider-readiness route-core composition helper.

This remains repo-side foundation work: no default live Stripe or ZarinPal refund/void HTTP calls, concrete live provider endpoint URLs, order/payment mutations, inventory/capacity release, admin refund/void execution buttons, provider credentials, or Prisma model/client access for `PaymentOperationRecord` have been added. Repository/service access and history reads remain gated behind target-environment migration confirmation. Provider-operation diagnostics always report `executionEnabled: false` and do not execute adapters.

## Completed in Phase 33 so far

- Added `lib/checkout/payment-operation-plan.ts` for pure refund/void operation planning.
- Added `tests/unit/payment-operation-plan.test.ts` for refund and void eligibility coverage and wired it into `tests/unit/run-tests.ts`, raising the runner count from 115 to 116 files.
- Added no-mutation preview acceptance criteria so Phase 33 repository slices keep clear boundaries before persistence or live provider operations.
- Added `lib/checkout/payment-operation-preview.ts` to convert `planPaymentOperation` results into admin-safe preview payloads without persistence, provider calls, order mutation, payment attempt mutation, inventory/capacity release, or audit-log writes.
- Extended `tests/unit/payment-operation-plan.test.ts` to guard ready, blocked, and manual-review preview behavior plus source-level no-mutation constraints.
- Added `lib/checkout/payment-operation-preview-view.ts` to format preview results into read-only admin display rows, status labels, tones, action labels, and disabled-reason copy.
- Added `lib/checkout/payment-operation-preview-route-core.ts` to return a stable route-core result shape around `buildPaymentOperationPreviewView` without persistence or provider calls.
- Added `components/admin/AdminPaymentOperationPreviewPanel.tsx` as a compact read-only admin preview panel without execution controls.
- Added `lib/checkout/payment-operation-preview-input.ts` as a pure preview input normalization helper for future admin form/query payloads.
- Added `lib/checkout/payment-operation-preview-request-core.ts` as a route-core wrapper that combines preview input normalization with `buildPaymentOperationPreviewRouteResult`.
- Added `app/admin/payments/operations/preview/page.tsx` as a compact read-only admin route that uses static sample data and renders the existing preview panel.
- Added `docs/production-roadmap-phase33-refund-void-persistence-design.md` to document future refund/void operation records, idempotency, audit, order/payment timelines, and inventory/capacity release planning before any migration.
- Added `lib/checkout/payment-operation-transition-plan.ts` for pure post-provider-success order/payment transition recommendations and inventory/capacity release planning.
- Added `tests/unit/payment-operation-transition-plan.test.ts` and wired it into `tests/unit/run-tests.ts`, raising the runner count from 116 to 117 files.
- Fed `planPaymentOperationTransition` into `buildPaymentOperationPreview` so preview payloads include advisory transition/release planning without mutation.
- Extended preview input, view, and admin panel helpers to show read-only advisory transition rows for future post-provider-success outcomes.
- Added `prisma/migrations/20260604200000_add_payment_operation_records/migration.sql` for the future `PaymentOperationRecord` table.
- Added `docs/production-roadmap-phase33-payment-operation-migration-contract.md` to document target-environment migration application, raw-SQL/Prisma caveats, and future persistence prerequisites.
- Added `tests/unit/payment-operation-migration-contract.test.ts` to guard the migration SQL, migration contract note, and absence of a Prisma model, then wired it into `tests/unit/run-tests.ts`, raising the runner count from 117 to 118 files.
- Added `docs/production-roadmap-phase33-payment-operation-migration-validation-evidence.md` as a blank operator evidence template for target-environment `PaymentOperationRecord` migration validation.
- Added `lib/checkout/payment-operation-migration-status.ts` as a read-only helper for the `PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED` environment gate.
- Added `docs/production-roadmap-phase33-payment-operation-repository-design.md` to document future idempotent `PaymentOperationRecord` repository/service semantics before implementation.
- Added `lib/checkout/payment-operation-record-repository.ts` as a raw-SQL repository for pending operation records with idempotency-key duplicate reuse and conflict detection.
- Added `lib/checkout/payment-operation-record-service.ts` as a migration-confirmed service gate around pending record creation, order-history reads, record transitions, and existing-record execution orchestration.
- Extended `lib/checkout/payment-operation-audit.ts` with submitted/succeeded/failed operation-record audit kinds and wired the service layer to append admin audit-log entries after migration-gated record transitions.
- Added `lib/checkout/payment-operation-adapters.ts` as a provider operation adapter contract for future refund/void execution boundaries, with provider normalization, manual-review behavior, unavailable-provider behavior, and inert mock adapters for Stripe/ZarinPal/manual/unknown.
- Added `tests/unit/payment-operation-adapters.test.ts` and wired it into `tests/unit/run-tests.ts`, raising the runner count from 118 to 119 files.
- Extended provider adapters with symbolic Stripe/ZarinPal request/response mappers, credential/provider-reference preflight results, idempotency headers, provider-operation references, provider status normalization, retryable-vs-rejected error categories, and injected HTTP client factories.
- Added `executePaymentOperationRecordIfConfirmed` to orchestrate execution for an existing operation record through migration confirmation, executable-state checks, submitted transition, injected adapter execution, and succeeded/failed/manual-review result handling without order/payment mutation.
- Added `lib/checkout/payment-operation-history-view.ts` to build read-only payment operation history rows and view models from `PaymentOperationRecord` rows, including status tones, provider references, operator labels, timestamps, retryability, and error details.
- Added `components/admin/AdminPaymentOperationHistoryPanel.tsx` as a read-only admin history/status panel that renders operation records without buttons, click handlers, provider calls, Prisma access, or order/payment mutation.
- Added `lib/checkout/payment-operation-history-route-core.ts` as a migration-gated route-core helper that validates order-history read inputs, calls `listPaymentOperationRecordsForOrderIfConfirmed`, returns migration-unconfirmed state when the target environment is not confirmed, and passes confirmed records through `buildPaymentOperationHistoryView` without provider calls or mutation.
- Added `app/admin/payments/operations/history/page.tsx` as an authenticated, read-only admin route that accepts `orderId` and optional `limit` query parameters, renders `AdminPaymentOperationHistoryPanel` for confirmed reads, and renders migration-unconfirmed/validation guidance without creating records, calling providers, or mutating orders/payments.
- Added `docs/production-roadmap-phase33-provider-endpoint-mapping-readiness.md` as a documentation-only worksheet for later Stripe/ZarinPal endpoint mapping evidence, required operator confirmations, idempotency semantics, response/error normalization expectations, and non-goals before concrete provider endpoints are added.
- Added `lib/checkout/payment-operation-provider-readiness.ts` as a pure read-only provider-operation readiness diagnostics helper for Stripe, ZarinPal, manual, and unknown providers. It checks credential environment variable presence, endpoint-mapping confirmation, provider validation evidence, manual-review behavior, and unsupported providers without secrets, provider calls, default HTTP clients, adapter execution, Prisma access, order/payment mutation, or execution controls.
- Added `tests/unit/payment-operation-provider-readiness.test.ts` and wired it into `tests/unit/run-tests.ts`, raising the runner count from 119 to 120 files.
- Added `components/admin/AdminPaymentOperationProviderReadinessPanel.tsx` as a compact read-only panel for provider-operation readiness summary display. It shows provider counts, credential environment variable names, endpoint/validation evidence states, manual-review states, and disabled execution copy without buttons, click handlers, provider calls, Prisma access, or mutation paths.
- Added `lib/checkout/payment-operation-provider-readiness-route-core.ts` as a read-only route-core composition helper that builds default Stripe/ZarinPal/manual diagnostics, accepts optional provider lists and evidence flags, returns `status: 200`, and always returns `executionEnabled: false` without provider calls, adapter execution, fetch, Prisma, order/payment mutation, inventory/capacity release, or admin controls.
- Extended `tests/unit/payment-operation-provider-readiness.test.ts` to guard the provider-readiness panel and route-core source boundaries, including no fetch, no Prisma, no adapter execution, no buttons, no click handlers, no live provider endpoints, and no order/payment mutation.

## Current helper behavior

`planPaymentOperation` can evaluate refund vs void operation kind, provider name normalization, manual/inquiry/assisted provider manual-review behavior, provider-reference requirements, positive amount requirements, amount not exceeding original payment amount, currency mismatch blocking, closed-order blocking, refundable statuses, voidable statuses, full vs partial amount metadata, and operator reason metadata.

`normalizePaymentOperationPreviewInput` can normalize future admin form/query payloads into `PaymentOperationPreviewInput` by accepting untrusted values, validating operation/order/payment/provider/amount/currency fields, normalizing identifiers and optional transition context, returning structured field errors, and avoiding database writes, provider calls, order mutation, and payment attempt mutation.

`buildPaymentOperationPreviewRequestResult` can return `status: 400` structured validation errors for malformed input or the existing read-only `PaymentOperationPreviewRouteResult` when input is valid. `buildPaymentOperationPreview`, `buildPaymentOperationPreviewView`, and `AdminPaymentOperationPreviewPanel` produce admin-safe preview display data, warnings, next-action copy, detail rows, and advisory transition/release planning without execution controls.

`PaymentOperationRecord` migration-backed storage is defined by `prisma/migrations/20260604200000_add_payment_operation_records/migration.sql`. The table is intentionally raw-SQL-backed and is not represented in `prisma/schema.prisma`; `prisma generate` does not validate a Prisma client model for it. Target environments must apply and verify this migration before any repository/service reads or writes depend on it.

`getPaymentOperationRecordsMigrationStatus` summarizes the read-only `PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED` environment gate. It does not use Prisma, fetch, provider adapters, order/payment mutation, inventory/capacity release, audit writes, or admin execution controls.

`paymentOperationRecordRepository` can create pending operation records idempotently by `idempotencyKey`, reuse matching duplicates, report conflicts for mismatched duplicate keys, find records by idempotency key, mark records submitted/succeeded/failed, and list records for an order. It uses raw SQL and does not call providers, mutate orders/payment attempts, release inventory/capacity, or write audit logs.

`paymentOperationRecordService` gates repository access through `getPaymentOperationRecordsMigrationStatus`. If `PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED` is not true for the target environment, it returns `migration_unconfirmed` instead of creating, transitioning, listing records, or orchestrating operation execution. When the gate is confirmed and repository transition updates succeed, the service appends admin audit-log entries for submitted, succeeded, and failed operation-record states. `executePaymentOperationRecordIfConfirmed` can orchestrate an existing operation record by blocking non-executable statuses/decisions, marking the record submitted, calling injected provider adapters through `executePaymentOperationAdapter`, and marking the record succeeded or failed based on normalized adapter results. Manual-review adapter results are returned without order/payment mutation.

`buildPaymentOperationHistoryView` can format persisted operation records into read-only admin rows with status tones, amount/provider/reference labels, operator attribution, timestamps, retryability, error categories, and operation details. `AdminPaymentOperationHistoryPanel` can render those rows for admin review without provider calls, Prisma access, click handlers, buttons, order mutation, or payment mutation.

`buildPaymentOperationHistoryRouteResult` validates an order ID and optional limit, calls `listPaymentOperationRecordsForOrderIfConfirmed`, returns `status: 503` plus migration status and an empty read-only history view when the target environment is not confirmed, and returns `status: 200` plus `buildPaymentOperationHistoryView(records)` when records are available. It does not execute provider operations, create payment-operation records, use direct Prisma access, call fetch, mutate orders/payments, release inventory/capacity, or render admin execution controls.

`/admin/payments/operations/history` can render authenticated read-only operation history for an `orderId` query parameter. It calls `buildPaymentOperationHistoryRouteResult`, displays validation errors or migration-unconfirmed guidance when appropriate, and renders `AdminPaymentOperationHistoryPanel` for confirmed reads. It does not create pending records, execute provider operations, expose refund/void buttons, call fetch, use direct Prisma access, mutate orders/payments, or release inventory/capacity.

`docs/production-roadmap-phase33-provider-endpoint-mapping-readiness.md` defines the operator evidence and worksheet needed before concrete provider endpoint mappings are added. It requires target environment, provider mode, operation identifiers, idempotency semantics, credential source names, success/rejected/retryable response fields, dashboard evidence, rollback behavior, and confirmation that endpoint mapping alone does not enable admin execution. It explicitly avoids live endpoint URLs, default HTTP clients, provider credentials, provider calls, order/payment mutation, inventory/capacity release, and admin execution controls.

`buildPaymentOperationProviderReadiness` can report read-only diagnostics for Stripe, ZarinPal, manual, and unknown providers. It checks expected credential environment variable names without exposing secret values, endpoint mapping confirmation, target-environment validation evidence, manual-review provider behavior, and unsupported providers. Its result always includes `executionEnabled: false`, does not call providers, does not execute adapters, does not use Prisma, does not mutate orders/payments, and does not release inventory/capacity.

`buildPaymentOperationProviderReadinessSummary` can aggregate multiple provider diagnostics into ready, needs-operator-evidence, manual-review, and unavailable counts without enabling execution. `buildPaymentOperationProviderReadinessRouteResult` composes that summary for default Stripe/ZarinPal/manual diagnostics or caller-supplied providers and returns a stable read-only route result with `executionEnabled: false`. `AdminPaymentOperationProviderReadinessPanel` can render that summary as a read-only admin panel with status counts, provider cards, credential environment variable names, check details, and disabled execution copy. It does not render buttons or click handlers and does not perform provider calls or mutation.

`payment-operation-adapters.ts` defines a provider operation adapter contract for future refund/void execution. It can normalize providers, route operations through supplied adapters, return manual-review results for manual operations, return unavailable results for unconfigured providers, provide inert mock Stripe/ZarinPal/manual behavior for source/unit coverage, build symbolic Stripe/ZarinPal request envelopes, normalize Stripe/ZarinPal operation responses into succeeded/failed/retryable result shapes, and execute provider operation adapters only through caller-injected `ProviderPaymentOperationHttpClient` functions. If no HTTP client is injected, the Stripe/ZarinPal HTTP adapters return `provider_http_client_missing`. This module does not make default live provider HTTP calls, use Prisma, mutate order/payment state, release inventory/capacity, or expose admin execution controls.

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
- require target-environment migration verification before repository/service reads, writes, or execution orchestration;
- capture operator migration evidence before any execution path depends on the table;
- keep migration confirmation helpers read-only until execution behavior is deliberately added in a later guarded slice;
- append admin audit-log entries only for repository/service lifecycle events already gated by migration confirmation;
- keep provider operation adapters injectable and inert by default until live provider execution is intentionally wired;
- keep provider-specific mapper endpoints symbolic until target-environment endpoint mapping is deliberately added;
- require caller-injected HTTP clients for any provider operation adapter execution path;
- require provider-reference, idempotency, status, and error normalization before any live provider adapter is exposed to admin flows;
- require provider endpoint mapping evidence before adding concrete endpoint constants;
- keep provider-operation readiness diagnostics read-only with `executionEnabled: false` until operator evidence and execution controls are approved;
- keep provider-operation readiness route-core helpers and panels read-only and free of execution controls, click handlers, provider calls, direct Prisma access, and mutation paths;
- block execution orchestration for non-executable operation-record statuses or blocked preview decisions;
- keep admin operation-history/status route-core and page/panel display read-only until target-environment migration and provider validation are complete;
- avoid checkout order mutation;
- avoid payment attempt mutation;
- avoid inventory or capacity release;
- avoid default live provider calls;
- be covered by source/unit guards before admin execution controls are added.

## Explicit non-goals for this slice

This slice intentionally does not add:

- default live provider refund HTTP calls;
- default live provider void HTTP calls;
- concrete provider endpoint URLs;
- provider credentials or secret material;
- Prisma model/client access for `PaymentOperationRecord`;
- order status mutation;
- payment attempt mutation;
- inventory or capacity release;
- provider-success order/payment timeline mutation;
- admin refund/void execution buttons;
- provider dashboard settlement imports.

Those remain future Phase 33 slices after target-environment migration verification is complete and provider execution boundaries are defined.

## Recommended next work

1. Add a read-only admin route or page section that renders `AdminPaymentOperationProviderReadinessPanel` from `buildPaymentOperationProviderReadinessRouteResult` without provider calls or execution controls.
2. Add concrete provider endpoint mappings only after operators fill the provider endpoint mapping readiness worksheet and staging/live contracts are confirmed.
3. Add admin execution controls only after provider execution, provider error normalization, migration validation, and post-success order/payment transition behavior are explicitly guarded.

## Verification status

Source/unit guard coverage has been added, but local verification is pending. Do not claim `npm run test:unit`, `npm run typecheck`, `npx prisma generate`, `npx prisma migrate status`, migration application, repository read/write execution, adapter execution in a target environment, orchestration execution in a target environment, read-only history display in a target environment, provider endpoint validation, provider-operation readiness diagnostics in a target environment, provider-operation readiness panel display in a target environment, provider-operation readiness route-core execution in a target environment, or live provider validation passed unless those checks are actually run.
