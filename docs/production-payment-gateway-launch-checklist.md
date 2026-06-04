# Production Payment Gateway Launch Checklist

Last updated: 2026-06-04

Use this checklist before enabling `CHECKOUT_MODE="gateway"` in a production deployment. It supplements `docs/PRODUCTION_CHECKLIST.md`, `docs/production-roadmap-phase32-payment-webhooks.md`, and `docs/production-roadmap-phase32-payment-webhook-smoke-tests.md`.

This checklist is not required for an inquiry-first launch where checkout remains `CHECKOUT_MODE="inquiry"`.

## 1. Scope confirmation

Before enabling gateway checkout, record:

- Target deployment environment.
- Target git SHA.
- Enabled providers: Stripe, ZarinPal, or both.
- Domestic checkout provider and currency.
- Overseas checkout provider/fallback and currency.
- Operator responsible for provider dashboard configuration.
- Operator responsible for database migration verification.

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

Set `PAYMENT_WEBHOOK_SMOKE_TESTS_CONFIRMED=true` only after completing the provider checks in:

```text
docs/production-roadmap-phase32-payment-webhook-smoke-tests.md
```

## 4. Deploy-readiness expectation

Before promoting production gateway checkout, run:

```bash
APP_MODE="production" npm run check:deploy-readiness
```

Expected result:

- Inquiry-first production can pass without gateway-specific confirmations.
- Gateway-mode production must block when required webhook secrets are missing.
- Gateway-mode production must block until settlement migration and webhook smoke-test confirmations are true.
- Gateway-mode production may still warn when inquiry notification mode is log-only.

## 5. Provider dashboard checks

Stripe:

- Webhook endpoint points to `/api/webhooks/payments/stripe` on the target deployment.
- Endpoint signing secret is copied to `STRIPE_WEBHOOK_SECRET` for the same environment.
- Test successful, duplicate/replayed, cancelled/expired, failed, and invalid-signature events.

ZarinPal:

- Callback/webhook endpoint points to `/api/webhooks/payments/zarinpal` where provider dashboard support exists.
- Shared signing/HMAC secret is copied to `ZARINPAL_WEBHOOK_SECRET` for the same environment.
- Test successful, duplicate/replayed, failed/cancelled, and invalid-signature events.

## 6. Admin verification

After provider-generated events are received, verify:

- `/admin/payments/settlement` shows the latest settlement records.
- The settlement summary source badge reports durable settlement records after `PaymentSettlementReconciliation` rows exist.
- `/admin/payments/alerts` shows expected failed/missing/stale/mismatch alerts and no unexpected alert for a successful payment.
- Duplicate webhook replay does not double-apply payment/order transitions.
- Missing or unknown provider references do not mutate unrelated orders.

## 7. Rollback notes

If gateway checkout fails validation:

1. Switch `CHECKOUT_MODE` back to `inquiry` or `assisted`.
2. Keep provider dashboard endpoints disabled or pointed at staging until fixed.
3. Preserve recorded webhook events and settlement records for diagnosis.
4. Do not manually mark orders paid unless the provider dashboard confirms payment capture/settlement.
5. Re-run the smoke-test runbook before re-enabling gateway mode.

## Current status

This checklist is repository documentation and does not claim production/staging validation has been completed. Provider-generated webhook validation, target-environment migration verification, and final gateway launch sign-off remain operator tasks.
