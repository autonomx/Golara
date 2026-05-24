# Phase 4.55-4.56 label wiring

This follow-up wires the public order status page to the shared public order label helper.

## Added wiring

- `/orders/[token]` imports labels from `lib/checkout/public-order-labels.ts`.
- Removed duplicated inline order status labels.
- Removed duplicated inline fulfillment status labels.
- Removed duplicated inline result banner messages.
- Removed duplicated inline `labelFor()` helper.

## Why

The public order page now uses a single shared source for customer-facing order labels, which prepares the app for a later locale-aware Persian label pass.

## Deferred

- Persian label maps.
- Locale selection.
- Provider-specific result messages.
