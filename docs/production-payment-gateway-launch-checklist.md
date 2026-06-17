# Production Payment Gateway Launch Checklist

Last updated: 2026-06-16

Use this checklist before enabling `CHECKOUT_MODE="gateway"` in a production deployment or before launching any enabled DigiKala-style payment method as a real customer payment lane. It supplements `docs/PRODUCTION_CHECKLIST.md`, `docs/production-roadmap-phase32-payment-webhooks.md`, `docs/production-roadmap-phase32-payment-webhook-smoke-tests.md`, `docs/production-roadmap-phase32-payment-webhook-validation-evidence.md`, and `docs/production-roadmap-phase32-settlement-migration-contract.md`.

This checklist is not required for an inquiry-first launch where checkout remains `CHECKOUT_MODE="inquiry"` and all payment methods remain operationally disabled.

## 1. Scope confirmation

Before enabling production payment lanes, record:

- Target deployment environment.
- Target git SHA.
- Enabled payment method keys from the admin payment method settings panel.
- Enabled providers: Stripe, ZarinPal/Iranian IPG, wallet/store credit, manual-transfer/card-to-card, installment credit, COD, or another explicitly configured method.
- Domestic checkout provider and currency.
- Overseas checkout provider/fallback and currency.
- Operator responsible for provider dashboard configuration.
- Operator responsible for database migration verification.
- Operator responsible for method-level smoke evidence capture.

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

## 4. Method-level production readiness gate

Before promoting any enabled payment method, review the non-blocking readiness gate in:

```text
lib/settings/payment-method-readiness-gate.ts
components/admin/AdminPaymentMethodSettingsPanel.tsx
```

Expected method-level evidence:

- Gateway methods: merchant credentials, return mapping, webhook mapping, provider reference persistence, and refund/void adapter evidence.
- Wallet/store-credit methods: ledger capture, refund receipt, and wallet liability dashboard evidence.
- Manual-transfer/card-to-card methods: customer instructions, verification workflow, settlement totals, and refund/void tracking evidence.
- Installment methods: review workflow, schedule persistence, receivables dashboard, and customer message evidence.
- COD methods: collection controls, fulfillment guard, settlement evidence, and customer reminder evidence.

Readiness warnings are visible to owners in the admin payment method settings panel. They are intentionally non-blocking until an operator explicitly treats missing evidence as a launch blocker. Do not interpret `checkoutBlockingCount=0` as production sign-off; it only means the current gate is advisory.

## 5. Method-level smoke checklist

For each enabled method, capture source-controlled smoke evidence using the checklist boundary in:

```text
lib/settings/payment-method-smoke-checklist.ts
```

Every enabled method should verify:

- Checkout method is visible to eligible customers.
- Checkout payment attempt persists the selected method key.
- Customer confirmation/status copy renders for the selected method.
- Admin order detail shows method/provider evidence.
- Settlement dashboard includes the selected method.
- Reconciliation CSV exports the selected method.

Additional method-specific checks:

- Gateway: return flow, trusted payment event flow, and provider-reference persistence.
- Wallet/store credit: debit receipt and refund receipt in customer wallet history.
- Manual transfer: customer transfer instructions and admin review status.
- Installment: customer approval/rejection/follow-up message and receivables/schedule visibility.
- COD: collection status visibility and fulfillment guard behavior.

## 6. Deploy-readiness expectation

Before promoting production gateway checkout, run:

```bash
APP_MODE="production" npm run check:deploy-readiness
```

Expected result:

- Inquiry-first production can pass without gateway-specific confirmations.
- Gateway-mode production must block when required webhook secrets are missing.
- Gateway-mode production must block until settlement migration and webhook smoke-test confirmations are true.
- Gateway-mode production may still warn when inquiry notification mode is log-only.
- Method readiness and smoke checklist evidence remains advisory until an operator records launch sign-off.

## 7. Provider dashboard checks

Stripe:

- Webhook endpoint points to `/api/webhooks/payments/stripe` on the target deployment.
- Endpoint signing secret is copied to `STRIPE_WEBHOOK_SECRET` for the same environment.
- Test successful, duplicate/replayed, cancelled/expired, failed, and invalid-signature events.

ZarinPal:

- Callback/webhook endpoint points to `/api/webhooks/payments/zarinpal` where provider dashboard support exists.
- Shared signing/HMAC secret is copied to `ZARINPAL_WEBHOOK_SECRET` for the same environment.
- Test successful, duplicate/replayed, failed/cancelled, and invalid-signature events.

## 8. Admin verification

After payment events and staff workflows are exercised, verify:

- `/admin/payment-methods` shows readiness summary counts and no unexpected enabled-method evidence warnings.
- `/admin/payments/settlement` shows the latest settlement records and P7 dashboard panels.
- `/admin/payments/reconciliation/csv` exports method-level, manual-transfer, wallet, COD, and installment summaries.
- `/admin/payments/alerts` shows expected failed/missing/stale/mismatch alerts and no unexpected alert for a successful payment.
- Duplicate webhook replay does not double-apply payment/order transitions.
- Missing or unknown provider references do not mutate unrelated orders.
- Customer account order/wallet surfaces render P8 method-specific confirmation, instruction, receipt, installment, COD, and notification evidence copy where applicable.

## 9. Rollback notes

If gateway checkout or an enabled payment lane fails validation:

1. Switch `CHECKOUT_MODE` back to `inquiry` or `assisted` when online checkout is unsafe.
2. Disable the affected method in `/admin/payment-methods` while preserving method evidence for diagnosis.
3. Keep provider dashboard endpoints disabled or pointed at staging until fixed.
4. Preserve recorded webhook events, payment attempts, order timelines, wallet ledgers, COD collection evidence, installment schedules, and settlement records for diagnosis.
5. Do not manually mark orders paid unless the provider dashboard or method-specific operational evidence confirms payment capture/settlement.
6. Re-run the method-level smoke-test checklist before re-enabling the payment lane.

## Current status

This checklist is repository documentation and does not claim production/staging validation has been completed. Provider-generated webhook validation, target-environment migration verification, method-level smoke evidence capture, admin readiness warning review, and final payment launch sign-off remain operator tasks.
