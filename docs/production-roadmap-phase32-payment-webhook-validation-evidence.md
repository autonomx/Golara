# Phase 32 Payment Webhook Validation Evidence Template

Last updated: 2026-06-04

This is a blank operator evidence template for Phase 32 provider and environment validation. It does not claim that staging or production validation has been completed.

Use this file after running `docs/production-roadmap-phase32-payment-webhook-smoke-tests.md` against the intended staging or production environment.

## Validation scope

- Environment:
- Checkout mode:
- Commit SHA deployed:
- Operator:
- Date/time:
- Provider dashboards used:
- Database or migration target:

## Completion checklist

Do not mark this evidence complete until every item below has a concrete value, link, screenshot reference, command output, provider event identifier, or operator note.

- Deployed SHA matches the target environment:
- Settlement migration application is verified in the target database:
- Settlement migration confirmation flag was enabled only after migration verification:
- Stripe provider-generated success case is recorded, if Stripe is enabled:
- Stripe duplicate replay and invalid-signature cases are recorded, if Stripe is enabled:
- ZarinPal provider-generated success case is recorded, if ZarinPal is enabled:
- ZarinPal duplicate replay and invalid-signature cases are recorded, if ZarinPal is enabled:
- Durable settlement records are visible in `/admin/payments/settlement`:
- Attention/alert states are reviewed in `/admin/payments/alerts`:
- Gateway deploy-readiness output is recorded:
- Rollback path to inquiry or assisted checkout is confirmed:
- Webhook smoke-test confirmation flag was enabled only after this evidence was captured:

## Preconditions

- `CHECKOUT_MODE="gateway"` is intended for this validation:
- `PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED="true"` was set only after migration application was verified:
- `PAYMENT_WEBHOOK_SMOKE_TESTS_CONFIRMED="true"` was set only after this evidence was captured:
- Stripe webhook endpoint configured:
- ZarinPal webhook endpoint configured:
- Admin access confirmed for `/admin/payments/settlement`:
- Admin access confirmed for `/admin/payments/alerts`:

## Stripe evidence

- Provider event ID:
- Event type:
- Checkout/order token:
- Expected normalized status:
- Signature header verified from provider-generated request:
- Webhook route response:
- Recorded `CheckoutPaymentEvent` row or identifier:
- Recorded `PaymentSettlementReconciliation` row or identifier:
- Order/attempt transition observed:
- Duplicate replay result:
- Invalid signature result:
- Notes:

## ZarinPal evidence

- Provider authority/reference:
- Provider status/code:
- Checkout/order token:
- Expected normalized status:
- Signature behavior verified from provider-generated request:
- Webhook route response:
- Recorded `CheckoutPaymentEvent` row or identifier:
- Recorded `PaymentSettlementReconciliation` row or identifier:
- Order/attempt transition observed:
- Duplicate replay result:
- Invalid signature result:
- Notes:

## Settlement reconciliation evidence

- Migration applied in target environment:
- Durable settlement records visible:
- Settlement summary source shown as durable reconciliation records:
- Needs-attention rows reviewed:
- Missing-attempt behavior verified:
- Settlement mismatch behavior reviewed:
- Notes:

## Deploy-readiness evidence

- Deploy-readiness command or check run:
- Result with gateway mode before confirmations:
- Result with gateway mode after confirmations:
- Result with inquiry-first mode if rollback is needed:
- Notes:

## Admin verification evidence

- `/admin/payments/settlement` summary reviewed:
- `/admin/payments/settlement` recent rows reviewed:
- `/admin/payments/alerts` reviewed:
- Alert/needs-attention copy reviewed:
- Screenshot or runbook reference:
- Notes:

## Exit criteria

- Stripe positive webhook validated:
- Stripe negative or invalid-signature webhook rejected:
- Stripe duplicate replay stayed idempotent:
- ZarinPal positive webhook validated:
- ZarinPal negative or invalid-signature webhook rejected:
- ZarinPal duplicate replay stayed idempotent:
- Durable settlement reconciliation table populated:
- Admin settlement and alert pages reviewed:
- Rollback to inquiry-first checkout confirmed:

## Sign-off

- Operator sign-off:
- Date/time:
- Remaining exceptions:
- Follow-up tasks:
