# Local E2E Commerce Validation Runbook

Status: source-controlled local validation checklist for the next operator-run E2E pass. This document does **not** claim that local, staging, or production validation has been completed.

## Scope

Use this runbook to validate the full local commerce workflow before target-environment gateway evidence is collected.

The local run should exercise:

- cart creation and checkout order creation
- selected payment-method persistence
- inquiry/manual fallback behavior
- gateway handoff preparation without live production credentials
- provider return/cancel/failure route handling with local or mocked inputs
- webhook route handling with local fixtures only
- settlement and reconciliation admin visibility
- customer notification evidence in log/manual/inert modes
- admin order, fulfillment, timeline, CSV, and settlement screens

## Safety boundary

Local E2E validation must not use production secrets, production payment provider endpoints, production customer data, or live customer notification providers.

Keep these boundaries in place unless a later owner-approved target-environment validation plan says otherwise:

- `APP_MODE` uses local or development values.
- `CHECKOUT_MODE` starts in `inquiry` or mocked gateway mode.
- `PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED` remains `false` until the target database migration is actually verified.
- `PAYMENT_WEBHOOK_SMOKE_TESTS_CONFIRMED` remains `false` until provider-generated webhook evidence exists.
- `PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED` remains `false` until the operation-record migration is verified.
- Notification providers remain disabled, log-only, manual, or inert.
- Do not commit `.env.local`, provider secrets, webhook signing secrets, private customer payloads, screenshots with secrets, or production database exports.

## Local setup checklist

1. Confirm the working tree is clean and based on the merged SHA being tested.
2. Copy `.env.example` to `.env.local` and fill only local/test values.
3. Confirm database connectivity points to a disposable local or test database.
4. Run `npm install` if dependencies are not already installed.
5. Run `npx prisma generate`.
6. Run `npx prisma migrate status` against the local database.
7. Apply local migrations only to the disposable local database.
8. Seed local catalogue, payment-method settings, admin account, and test order fixtures if the selected E2E path needs them.

## Required command sequence

Run these commands before browser/manual E2E work:

```bash
npm run typecheck
npm run test:unit
npm run test:functional
npm run test:api
npm run test:nonbrowser
npm run test:e2e
npm run test:e2e:production-like
npm run build
npm run check:performance-budget
npm run check:routes
```

Also run deployment readiness in the local/test profile used for the E2E pass:

```bash
APP_MODE="production" CHECKOUT_MODE="inquiry" npm run check:deploy-readiness
```

For gateway-mode local dry runs, use test credentials or mocks only and keep provider evidence flags false unless provider-generated target-environment evidence has been collected:

```bash
APP_MODE="production" CHECKOUT_MODE="gateway" npm run check:deploy-readiness
```

## Manual browser scenarios

Record pass/fail notes, local SHA, environment profile, and screenshots without secrets for each scenario.

### Customer checkout

- Guest customer adds an available product to the cart.
- Customer updates quantity and confirms totals stay stable.
- Customer checks out using inquiry/manual mode.
- Customer chooses each enabled payment method and confirms the selected method is persisted.
- Customer sees localized English and Persian payment guidance where available.
- Duplicate checkout submission does not create duplicate payment attempts.

### Payment routes

- Gateway handoff preparation is blocked when method/provider config is disabled or incomplete.
- Gateway return success maps back to the selected method key using local fixtures.
- Gateway cancel/failure returns safe customer-facing copy.
- Missing or invalid return tokens do not expose provider/internal details.
- Webhook fixture processing rejects invalid signatures and duplicate replays remain idempotent.

### Admin payment visibility

- `/admin/payment-methods` shows readiness warnings as advisory/non-blocking.
- `/admin/orders` shows selected method, payment attempt status, timeline entries, and staff notes.
- `/admin/payments/settlement` shows method-level summaries.
- `/admin/payments/alerts` surfaces pending/failed/missing-attempt/settlement-mismatch style states from local fixtures.
- `/admin/payments/reconciliation/csv` exports safe CSV rows for local fixture data.

### Fulfillment and notifications

- Fulfillment actions respect payment/COD collection guards.
- Notification evidence is visible in disabled/manual/log/inert mode without real provider sends.
- Customer-facing order pages do not leak raw provider references, webhook payloads, signatures, or secret names.

## Evidence to collect locally

Keep local evidence outside source control unless it is a sanitized test fixture or runbook update.

Capture:

- tested commit SHA
- date/time of the local run
- database profile used, without credentials
- command output summaries for the required command sequence
- browser scenario pass/fail notes
- sanitized screenshots of customer checkout, admin payment methods, settlement, alerts, order timeline, and CSV export
- known failures with reproduction steps
- rollback note confirming inquiry/manual checkout remains available

## Exit criteria for moving to target-environment evidence

Local E2E is ready to hand off to target-environment validation when:

- the required command sequence passes locally
- customer checkout and admin payment visibility scenarios are complete
- no live secrets or production data were used
- no payment-state, order-state, inventory, fulfillment, notification, or settlement mismatch remains unexplained
- rollback to inquiry/manual checkout is documented and accepted

Target-environment provider validation still requires the separate P10 evidence bundle, provider-generated webhooks, migration verification, and owner go/no-go sign-off.
