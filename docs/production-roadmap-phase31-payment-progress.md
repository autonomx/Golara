# Phase 31 Payment Gateway Progress

Last updated: 2026-06-04

This note supplements `docs/production-roadmap.md` while Phase 31 is in progress.

## Current status

Phase 31 is in progress. Golara now has live payment gateway adapter foundations for both primary payment paths:

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
- Added unit coverage using injected HTTP clients so tests do not call live payment networks.

## Still pending before Phase 31 is complete

- Wire the live adapters into the customer checkout submit flow.
- Persist Stripe session IDs and ZarinPal authorities on checkout payment attempts from the live checkout flow.
- Redirect customers to provider-hosted payment pages from the real checkout flow.
- Add checkout return, success, and cancel pages.
- Convert provider success/failure/cancel return state into internal order payment state transitions.
- Add route-level tests for live checkout initiation and browser return paths.
- Add production operator runbook details for live payment setup and smoke testing.

## Notes

The current adapter work is foundation-level only. It prepares provider requests and validates request shaping, credentials, currencies, metadata, and idempotency headers. It does not yet make payment webhooks authoritative, reconcile settlement, process refunds, or complete checkout/order payment transitions.
