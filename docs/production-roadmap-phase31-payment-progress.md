# Phase 31 Payment Gateway Progress

Last updated: 2026-06-04

This note supplements `docs/production-roadmap.md` while Phase 31 is in progress.

## Current status

Phase 31 is in progress. Golara now has live payment gateway adapter foundations, checkout-attempt routing, return parsing, payment-result confirmation UX, pure payment-result transition planning, checkout redirect-path QA, browser-return QA, and a production payment runbook for both primary payment paths:

- **ZarinPal** for Iranian/Toman domestic checkout.
- **Stripe Checkout Sessions** for overseas/card checkout.

Inquiry-first/manual checkout remains available as a fallback path.

## Completed in Phase 31 so far

- Added Stripe Checkout Session adapter foundation.
- Added ZarinPal payment-request adapter foundation.
- Added live adapter factory coverage for Stripe and ZarinPal.
- Added readiness settings for `zarinpal` as a supported gateway provider.
- Added readiness blockers for missing `ZARINPAL_MERCHANT_ID` and non-Toman ZarinPal checkout.
- Added `.env.example` settings for ZarinPal and Stripe payment setup.
- Added idempotency-key support for Stripe session creation and ZarinPal payment-request creation.
- Routed ZarinPal through adapter payment mode instead of the older direct legacy provider path.
- Routed checkout payment attempts through live Stripe/ZarinPal adapters when those providers are selected.
- Persisted adapter provider references through the existing checkout payment attempt `providerReference` field.
- Extended return parsing for hosted checkout success/cancel values and provider checkout session reference aliases.
- Extracted `/orders/return` redirect handling into a unit-testable core helper.
- Added result-aware copy for `/orders/confirmation` so paid, failed, cancelled, and missing-token returns show clearer payment status UX.
- Added a pure checkout-result transition planner for order status, attempt status, and duplicate timeline-event decisions.
- Added checkout redirect-path tests covering ZarinPal and Stripe hosted payment URLs plus non-redirect fallback behavior.
- Added browser-return route tests covering Stripe success/cancel and ZarinPal failed returns.
- Added `docs/production-payment-runbook.md` for live payment setup and smoke-test operations.
- Folded return-handler and confirmation-copy coverage into the existing order return route core unit runner path.
- Added unit coverage using injected HTTP clients, return-handler fakes, pure transition plans, redirect-path fixtures, and browser-return fixtures so tests do not call live payment networks.

## Still pending before Phase 31 is complete

- Run or schedule production-environment payment smoke tests with real provider dashboard credentials.
- Keep Phase 32 scoped to authoritative webhooks and settlement reconciliation before trusting browser returns as the production payment authority.

## Notes

The current work prepares provider requests, validates request shaping, credentials, currencies, metadata, and idempotency headers, routes checkout attempts to the live adapter factory, parses provider return parameters, covers return redirects through a pure handler helper, improves confirmation-page result UX, centralizes internal payment-result transition decisions behind a unit-tested pure helper, confirms hosted checkout redirect paths for ZarinPal and Stripe-style provider URLs, expands browser-return QA, and documents production payment setup/smoke testing. It does not yet make payment webhooks authoritative, reconcile settlement, or process refunds.
