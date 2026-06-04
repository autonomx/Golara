# Phase 32 Payment Webhook Service Transition Note

Last updated: 2026-06-04

This note supplements `docs/production-roadmap-phase32-payment-webhooks.md` for the webhook service transition integration slice.

## Completed in this slice

- Updated `lib/checkout/payment-webhook-service.ts` to use `planPaymentWebhookStateChange`.
- Payment attempts now include current attempt status plus current order status and latest payment-result timeline event when matched.
- Inbound webhook events are still created through `CheckoutPaymentEvent` before state mutation is attempted.
- Trusted webhook state plans can update the matched `CheckoutPaymentAttempt` status.
- Trusted webhook state plans can update the matched `CheckoutOrder` status.
- Trusted webhook state plans can create a checkout order payment-result timeline event.
- Duplicate webhook events still return without mutating payment/order state.
- Missing payment-attempt matches still return needs-attention without mutating payment/order state.
- Added supplemental source guard coverage in `tests/unit/payment-webhook-service-transition.test.ts`.

## Intentionally deferred

- Wiring the supplemental test into `tests/unit/run-tests.ts` because runner edits have been unreliable in this connector environment.
- Settlement reconciliation records/views.
- Live provider dashboard validation.

## Notes

This slice makes trusted payment webhooks the first DB-backed authoritative path for matched checkout order/payment-attempt state transitions. Real production trust still depends on configured webhook signatures and live provider dashboard validation.
