# Phase 32 Payment Webhook Smoke Test Runbook

Last updated: 2026-06-04

This runbook documents the operator checks needed before Phase 32 payment webhook work can be trusted for production traffic. It does not record completed live validation; it is a staging/production checklist.

## Scope

Use this checklist for:

- Stripe Checkout Session webhook receipt and signature verification.
- ZarinPal callback/webhook-style payment event receipt and configured HMAC verification.
- Trusted matched webhook state transitions for checkout payment attempts and orders.
- Durable settlement reconciliation upserts from recorded webhook events.
- Operator visibility in the admin settlement and alert pages.

## Required application URLs

Configure the provider dashboards with the deployed application base URL:

- Stripe webhook endpoint: `/api/webhooks/payments/stripe`
- ZarinPal webhook endpoint: `/api/webhooks/payments/zarinpal`
- Hosted checkout return endpoint: `/orders/return`
- Admin settlement page: `/admin/payments/settlement`
- Admin payment alerts page: `/admin/payments/alerts`

## Required environment variables

Phase 32 webhook validation depends on the webhook secrets below when configured:

- `STRIPE_WEBHOOK_SECRET`
- `ZARINPAL_WEBHOOK_SECRET`

Phase 31 live payment gateway configuration must also be present for checkout creation and provider redirects. Confirm the deployed environment has the gateway credentials and callback/return URL settings used by:

- `lib/checkout/payment-gateway-config.ts`
- `lib/checkout/payment-gateway-adapters.ts`
- `lib/checkout/payment-provider.ts`

Do not mix staging provider secrets with production callback URLs.

## Database prerequisites

Before webhook smoke tests, confirm the deployed database has the Phase 32 settlement migration applied:

- `prisma/migrations/20260604170000_add_payment_settlement_reconciliation/migration.sql`

The `PaymentSettlementReconciliation` table is migration-backed and accessed through raw SQL by `lib/checkout/payment-settlement-repository.ts`. It is not currently represented in `prisma/schema.prisma`.

## Stripe staging smoke test

1. Configure the Stripe dashboard webhook endpoint for the deployed staging URL plus `/api/webhooks/payments/stripe`.
2. Set `STRIPE_WEBHOOK_SECRET` in the deployed staging environment from that endpoint's signing secret.
3. Create a checkout order using the Stripe payment path.
4. Complete the hosted Stripe Checkout Session with a Stripe test card.
5. Confirm the customer-facing return/confirmation flow does not show an error state.
6. Confirm a `CheckoutPaymentEvent` row was recorded with provider `stripe` and a stable idempotency key.
7. Confirm the matched `CheckoutPaymentAttempt.status` and `CheckoutOrder.status` moved to the expected paid state for a trusted matched event.
8. Confirm a payment-result `CheckoutOrderTimelineEvent` was recorded.
9. Confirm a `PaymentSettlementReconciliation` row was upserted for the recorded webhook event.
10. Confirm `/admin/payments/settlement` shows the paid/settled event in the summary.
11. Confirm `/admin/payments/alerts` does not show an unexpected missing-attempt, stale-pending, or settlement-mismatch alert for the successful payment.
12. Replay the same Stripe webhook event from the Stripe dashboard and confirm duplicate handling does not create a second business-state transition.

## Stripe negative checks

1. Send a Stripe webhook with a missing or invalid signature while `STRIPE_WEBHOOK_SECRET` is configured.
2. Confirm the route rejects the request before recording an event.
3. Send or replay an expired/cancelled checkout session event.
4. Confirm the event records idempotently and the state transition matches the planned cancellation behavior.
5. Send or replay a payment failure-style event.
6. Confirm the admin alert surface shows the expected failed-payment operator attention item when applicable.

## ZarinPal staging smoke test

1. Configure the ZarinPal dashboard/callback settings for the deployed staging URL plus `/api/webhooks/payments/zarinpal` where supported.
2. Set `ZARINPAL_WEBHOOK_SECRET` in the deployed staging environment to the shared secret used for Golara/ZarinPal-style HMAC verification.
3. Create a checkout order using the ZarinPal payment path.
4. Complete the hosted ZarinPal test payment or provider sandbox equivalent.
5. Confirm `/orders/return` parses the provider status/authority response without an error state.
6. Confirm a `CheckoutPaymentEvent` row was recorded with provider `zarinpal` and a stable idempotency key.
7. Confirm the matched `CheckoutPaymentAttempt.status` and `CheckoutOrder.status` moved to the expected paid state for a trusted matched event.
8. Confirm a payment-result `CheckoutOrderTimelineEvent` was recorded.
9. Confirm a `PaymentSettlementReconciliation` row was upserted for the recorded webhook event.
10. Confirm `/admin/payments/settlement` shows the paid/settled event in the summary.
11. Confirm `/admin/payments/alerts` does not show an unexpected missing-attempt, stale-pending, or settlement-mismatch alert for the successful payment.

## ZarinPal negative checks

1. Send a ZarinPal-style request with a missing or invalid `x-zarinpal-signature` or `x-golara-signature` while `ZARINPAL_WEBHOOK_SECRET` is configured.
2. Confirm the route rejects the request before recording an event.
3. Send or replay an `NOK`, cancelled, or failed status.
4. Confirm the event records idempotently and the state transition matches the planned failed/cancelled behavior.
5. Confirm the admin alert surface shows the expected failed-payment operator attention item when applicable.

## Reconciliation checks

For each provider test, confirm:

- Duplicate webhook events do not double-apply payment/order state changes.
- Missing payment-attempt references produce `needs_attention` handling without mutating an unrelated order.
- Settlement summaries distinguish paid, failed, cancelled, pending, amount mismatch, currency mismatch, and needs-attention records.
- Admin pages remain read-only operator visibility surfaces.

## Exit criteria

Phase 32 webhook validation can be considered complete only after:

- Stripe signature behavior is validated against the live/staging Stripe dashboard.
- ZarinPal signature behavior is validated against the live/staging ZarinPal dashboard or sandbox callback behavior.
- The settlement migration is applied in the target environment.
- Successful, duplicate, failed/cancelled, and invalid-signature cases have been exercised for each configured provider.
- Admin settlement and alert pages have been checked after real provider-generated events.

## Current status

Not yet completed. This document is a runbook for future staging/production validation and does not claim that live provider validation or smoke tests have been run.
