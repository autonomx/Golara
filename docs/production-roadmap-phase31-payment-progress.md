# Phase 31 Payment Gateway Progress

Last updated: 2026-06-04

This note supplements `docs/production-roadmap.md` while Phase 31 is in progress.

## Current status

Phase 31 is in progress. Golara now has live payment gateway adapter foundations, checkout-attempt routing, return parsing, and payment-result confirmation UX foundations for both primary payment paths:

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
- Folded return-handler and confirmation-copy coverage into the existing order return route core unit runner path.
- Added unit coverage using injected HTTP clients and return-handler fakes so tests do not call live payment networks.

## Still pending before Phase 31 is complete

- Confirm customer checkout submit actions redirect to provider-hosted payment pages in all selected provider modes.
- Complete provider success/failure/cancel return state coverage for internal order payment state transitions.
- Add route-level tests for live checkout initiation and browser return paths.
- Add production operator runbook details for live payment setup and smoke testing.

## Notes

The current work prepares provider requests, validates request shaping, credentials, currencies, metadata, and idempotency headers, routes checkout attempts to the live adapter factory, parses provider return parameters, covers return redirects through a pure handler helper, and improves confirmation-page result UX. It does not yet make payment webhooks authoritative, reconcile settlement, process refunds, or complete all route-level QA for browser return paths.
