# Phase 32 Payment Webhook Routes Note

Last updated: 2026-06-04

This note supplements `docs/production-roadmap-phase32-payment-webhooks.md` for the inbound payment webhook route slice.

## Completed in this slice

- Added `lib/checkout/payment-webhook-route-core.ts`.
- Added `handlePaymentWebhookRoute` as a provider-neutral route core.
- Added `app/api/webhooks/payments/stripe/route.ts`.
- Added `app/api/webhooks/payments/zarinpal/route.ts`.
- Routes parse JSON payloads, pass request headers, and delegate persistence to `paymentWebhookService.record`.
- The route core returns:
  - `200` for recorded or duplicate webhook results.
  - `202` for needs-attention webhook results.
  - `400` for invalid JSON-object payloads.
  - `500` for handler/service errors.
- Added supplemental route guard coverage in `tests/unit/payment-webhook-route-core.test.ts`.

## Intentionally deferred

- Provider signature verification for Stripe/ZarinPal webhook secrets.
- Wiring the supplemental test into `tests/unit/run-tests.ts` because runner edits have been unreliable in this connector environment.
- Authoritative order/payment-attempt mutation from webhook-paid events.
- Settlement reconciliation records/views.

## Notes

These route handlers make inbound payment webhooks recordable through the existing idempotent service path, but they do not yet make payment webhooks the authoritative payment state boundary. The next safe slice should add signature verification and/or a pure authoritative state transition service before order/payment-attempt updates are enabled.
