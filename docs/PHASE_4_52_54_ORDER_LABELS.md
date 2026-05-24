# Phase 4.52-4.54 order labels

This bundle starts separating public order display labels from the page implementation.

## Added foundation

- `lib/checkout/public-order-labels.ts` for customer-facing order labels.
- Shared maps for order status labels.
- Shared maps for fulfillment status labels.
- Shared result banner message definitions.
- Shared `labelFor()` fallback helper.

## Why

The public order status page now has enough customer-facing strings that the next localization pass should not keep adding inline maps directly inside route files.

## Deferred

- Wiring every public order route to the helper.
- Persian labels.
- Locale-aware label selection.
- Provider-specific result messages.
