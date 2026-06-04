# Phase 32 Payment Webhooks and Settlement Progress

Last updated: 2026-06-04

This note supplements `docs/production-roadmap.md` while Phase 32 is in progress.

## Current status

Phase 32 has started. The first slice adds provider-neutral payment webhook normalization foundations for:

- **Stripe Checkout Sessions** webhooks.
- **ZarinPal** verification/callback-style payment events.

## Completed in Phase 32 so far

- Added `lib/checkout/payment-webhook-core.ts` for provider-neutral payment webhook normalization.
- Normalized Stripe `checkout.session.completed`, `checkout.session.expired`, and payment failure-style events into paid, cancelled, failed, or pending statuses.
- Normalized ZarinPal `OK`, `NOK`, cancelled, numeric paid codes, and unknown statuses into paid, failed, cancelled, or pending statuses.
- Added stable webhook payload digests and idempotency keys using provider, event name, provider reference, and payload digest.
- Added settlement summary counts for paid, failed, cancelled, pending, and attention-needed webhook events.
- Folded payment webhook normalization coverage into the existing wired webhook event log unit test path.

## Still pending before Phase 32 is complete

- Add route handlers for Stripe and ZarinPal payment webhooks.
- Persist inbound payment webhook events and idempotency decisions.
- Apply authoritative webhook-paid state transitions to checkout orders and payment attempts.
- Add settlement reconciliation records/views for provider reference, amount, currency, order, and webhook status.
- Add retry/alerting behavior for failed or pending payment webhook events.

## Notes

The current Phase 32 work is deliberately pure and network-free. It prepares normalized webhook events and settlement summaries but does not yet make webhooks authoritative, persist inbound provider events, or reconcile settlement against provider dashboards.
