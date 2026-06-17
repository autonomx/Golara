# Production Payment Gateway Launch Checklist

Last updated: 2026-06-16

Use this checklist before enabling `CHECKOUT_MODE="gateway"` in a production deployment. It supplements `docs/PRODUCTION_CHECKLIST.md`, `docs/production-roadmap-phase32-payment-webhooks.md`, `docs/production-roadmap-phase32-payment-webhook-smoke-tests.md`, `docs/production-roadmap-phase32-payment-webhook-validation-evidence.md`, and `docs/production-roadmap-phase32-settlement-migration-contract.md`.

This checklist is not required for an inquiry-first launch where checkout remains `CHECKOUT_MODE="inquiry"`. When multiple DigiKala-style payment methods are enabled, complete the method-level readiness gate and smoke checklist below before final owner sign-off.

## 1. Scope confirmation

Before enabling gateway checkout, record:

- Target deployment environment.
- Target git SHA.
- Enabled providers: Stripe, ZarinPal, or both.
- Enabled payment methods: gateway/IPG, wallet/store credit, manual transfer, installment credit, COD, or any local variations.
- Domestic checkout provider and currency.
- Overseas checkout provider/fallback and currency.
- Operator responsible for provider dashboard configuration.
- Operator responsible for database migration verification.
- Operator responsible for method-level smoke evidence and final launch sign-off.

## 2. Required gateway environment

For production gateway mode, configure the standard production variables from `docs/PRODUCTION_CHECKLIST.md`, plus the gateway/provider variables below.

Gateway mode:

```bash
CHECKOUT_MODE="gateway"
```

Stripe, when enabled:

```bash
STRIPE_SECRET_KEY="..."
STRIPE_WEBHOOK_SECRET="..."
```

ZarinPal, when enabled:

```bash
ZARINPAL_MERCHANT_ID="..."
ZARINPAL_WEBHOOK_SECRET="..."
ZARINPAL_REQUEST_URL="https://api.zarinpal.com/pg/v4/payment/request.json"
ZARINPAL_START_URL="https://www.zarinpal.com/pg/StartPay"
```

Do not reuse staging secrets in production or production secrets in staging.

## 3. Required Phase 32 confirmations

The production deploy-readiness guard blocks production gateway checkout until these confirmations are set:

```bash
PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED="true"
PAYMENT_WEBHOOK_SMOKE_TESTS_CONFIRMED="true"
```

Set `PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED=true` only after verifying the target database has applied:

```text
prisma/migrations/20260604170000_add_payment_settlement_reconciliation/migration.sql
```

Use `docs/production-roadmap-phase32-settlement-migration-contract.md` to confirm the migration-backed/raw-SQL contract before setting this flag.

Set `PAYMENT_WEBHOOK_SMOKE_TESTS_CONFIRMED=true` only after completing the provider checks in:

```text
docs/production-roadmap-phase32-payment-webhook-smoke-tests.md
```

Record the completed operator evidence in:

```text
docs/production-roadmap-phase32-payment-webhook-validation-evidence.md
```

## 4. Method-level readiness and smoke evidence

Before final launch sign-off, review `/admin/payment-methods` and record the non-blocking readiness summary for every enabled payment method.

For each enabled method, confirm:

- The readiness warning panel has no unexpected missing operational evidence.
- Required provider credentials or local-operation evidence are configured for that method.
- The source-controlled smoke checklist for that method has been executed in the target environment.
- Customer-facing order copy and receipt/reminder copy are visible for that method.
- Admin order/payment views show method-specific evidence after checkout or staff action.
- Settlement/reconciliation dashboards and CSV export include the method after activity is recorded.
- Rollback or disable instructions are known for the method before launch.

Method-specific smoke expectations:

- Gateway/IPG: create a provider-backed checkout, verify return/webhook method-key mapping, provider reference persistence, settlement dashboard visibility, and duplicate event safety.
- Wallet/store credit: create a wallet-funded checkout, verify debit receipt copy, refund receipt copy, wallet liability summary, and overspend protection.
- Manual transfer: submit reference/proof metadata, verify staff received/rejected/follow-up flows, customer instructions, and manual-transfer settlement totals.
- Installment: request approval, approve/reject/follow-up, create/collect schedule entries, verify installment customer messages and receivables summary.
- COD: create a COD order, record delivery collection/waiver/failure, verify fulfillment guard behavior, customer reminders, COD adjustment evidence, and COD collection totals.

This P9 readiness gate is advisory in the current codebase: it warns owners and records launch evidence expectations, but it does not block checkout until enforcement is explicitly added.

## 5. Deploy-readiness expectation

Before promoting production gateway checkout, run:

```bash
APP_MODE="production" npm run check:deploy-readiness
```

Expected result:

- Inquiry-first production can pass without gateway-specific confirmations.
- Gateway-mode production must block when required webhook secrets are missing.
- Gateway-mode production must block until settlement migration and webhook smoke-test confirmations are true.
- Gateway-mode production may still warn when inquiry notification mode is log-only.
- Method-level readiness warnings in `/admin/payment-methods` must be reviewed before final owner sign-off even when deploy-readiness passes.

## 6. Provider dashboard checks

Stripe:

- Webhook endpoint points to `/api/webhooks/payments/stripe` on the target deployment.
- Endpoint signing secret is copied to `STRIPE_WEBHOOK_SECRET` for the same environment.
- Test successful, duplicate/replayed, cancelled/expired, failed, and invalid-signature events.

ZarinPal:

- Callback/webhook endpoint points to `/api/webhooks/payments/zarinpal` where provider dashboard support exists.
- Shared signing/HMAC secret is copied to `ZARINPAL_WEBHOOK_SECRET` for the same environment.
- Test successful, duplicate/replayed, failed/cancelled, and invalid-signature events.

## 7. Admin verification

After provider-generated events are received, verify:

- `/admin/payment-methods` shows the expected readiness summary and no unexpected missing operational evidence for enabled methods.
- `/admin/payments/settlement` shows the latest settlement records and P7 dashboard panels.
- `/admin/payments/reconciliation/csv` downloads a reconciliation CSV with method-level, manual-transfer, wallet, COD, and installment sections.
- The settlement summary source badge reports durable settlement records after `PaymentSettlementReconciliation` rows exist.
- `/admin/payments/alerts` shows expected failed/missing/stale/mismatch alerts and no unexpected alert for a successful payment.
- Duplicate webhook replay does not double-apply payment/order transitions.
- Missing or unknown provider references do not mutate unrelated orders.

## 8. Rollback notes

If gateway checkout fails validation:

1. Switch `CHECKOUT_MODE` back to `inquiry` or `assisted`.
2. Keep provider dashboard endpoints disabled or pointed at staging until fixed.
3. Preserve recorded webhook events and settlement records for diagnosis.
4. Do not manually mark orders paid unless the provider dashboard confirms payment capture/settlement.
5. Disable any individual payment method with missing evidence from `/admin/payment-methods` while preserving other validated methods.
6. Re-run the method-specific smoke checklist and provider smoke-test runbook before re-enabling gateway mode or the affected method.

## Current status

This checklist is repository documentation and does not claim production/staging validation has been completed. Provider-generated webhook validation, target-environment migration verification, method-level readiness evidence, smoke-test evidence capture, and final gateway launch sign-off remain operator tasks.
