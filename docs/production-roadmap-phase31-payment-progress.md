# Phase 31 Payment Gateway Progress

Last updated: 2026-06-04

This note supplements `docs/production-roadmap.md` while Phase 31 is in progress.

## Current status

Phase 31 is in progress. Golara now has live payment gateway adapter foundations and checkout-attempt routing for both primary payment paths:

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
- Added unit coverage using injected HTTP clients so tests do not call live payment networks.

## Still pending before Phase 31 is complete

- Confirm customer checkout submit actions redirect to provider-hosted payment pages in all selected provider modes.
- Add checkout return, success, and cancel pages.
- Convert provider success/failure/cancel return state into internal order payment state transitions.
- Add route-level tests for live checkout initiation and browser return paths.
- Add production operator runbook details for live payment setup and smoke testing.

## Notes

The current work prepares provider requests, validates request shaping, credentials, currencies, metadata, and idempotency headers, and routes checkout attempts to the live adapter factory. It does not yet make payment webhooks authoritative, reconcile settlement, process refunds, or complete checkout/order payment transitions from browser return pages.
