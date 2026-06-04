# Phase 32 Payment Webhook Service Note

Last updated: 2026-06-04

This note supplements `docs/production-roadmap-phase32-payment-webhooks.md` for the DB-backed inbound payment webhook service slice.

## Completed in this slice

- Added `lib/checkout/payment-webhook-service.ts`.
- Added `recordPaymentWebhookEvent` as a server-only service entry point.
- Normalizes provider webhook input before persistence.
- Checks existing `CheckoutPaymentEvent` rows by the existing unique provider/idempotency key.
- Resolves the target `CheckoutPaymentAttempt` by provider reference first, then by order number or public lookup token.
- Creates a `CheckoutPaymentEvent` row through the existing persistence input builder.
- Returns duplicate and needs-attention results without applying authoritative order/payment-attempt mutations.
- Added supplemental source guard coverage in `tests/unit/payment-webhook-service.test.ts`.

## Intentionally deferred

- Route handlers for Stripe and ZarinPal webhooks.
- Wiring the supplemental test into `tests/unit/run-tests.ts` because large runner edits have been unreliable in this connector environment.
- Authoritative paid-state mutation of checkout orders/payment attempts.
- Settlement reconciliation records/views.

## Notes

The service records inbound webhook events idempotently but deliberately does not update `CheckoutOrder` or `CheckoutPaymentAttempt` state yet. The next safe slice should add route cores or a pure authoritative transition service, then wire routes after the behavior is covered.
