# Phase 32 Payment Webhook Signatures Note

Last updated: 2026-06-04

This note supplements `docs/production-roadmap-phase32-payment-webhooks.md` for the inbound payment webhook signature slice.

## Completed in this slice

- Added `lib/checkout/payment-webhook-signature.ts`.
- Added Stripe-style HMAC SHA-256 verification using the `stripe-signature` header and signed `timestamp.rawBody` payload format.
- Added ZarinPal/Golara-style HMAC SHA-256 verification using `x-zarinpal-signature` or `x-golara-signature` over the raw request body.
- Added environment-backed secrets:
  - `STRIPE_WEBHOOK_SECRET`
  - `ZARINPAL_WEBHOOK_SECRET`
- Updated Stripe and ZarinPal payment webhook routes to read the raw request body before JSON parsing.
- Routes now verify signatures before recording webhook events when secrets are configured.
- Added supplemental source and pure helper guard coverage in `tests/unit/payment-webhook-signature.test.ts`.

## Intentionally deferred

- Wiring the supplemental test into `tests/unit/run-tests.ts` because runner edits have been unreliable in this connector environment.
- Provider dashboard validation of actual live signature formats.
- Authoritative order/payment-attempt mutation from webhook-paid events.
- Settlement reconciliation records/views.

## Notes

Signature verification is now available and enforced when the relevant webhook secret is configured. If a secret is not configured, the helper reports `not_configured`; production deployments should configure webhook secrets before accepting live provider traffic.
