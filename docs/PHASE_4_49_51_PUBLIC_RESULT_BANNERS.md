# Phase 4.49-4.51 public result banners

This bundle improves the customer-facing return/result experience on the public order status page.

## Added foundation

- `/orders/[token]` now reads the `result` query param.
- Customer-friendly banners for:
  - `paid`
  - `failed`
  - `cancelled`
- Result banners explain the next step without exposing private order data.

## Rules

- Result banners are display-only.
- Payment/attempt/order lifecycle updates still happen through the return handler.
- Unknown result values are ignored.
- Public privacy boundary remains unchanged.

## Deferred

- Locale-specific Persian result labels.
- Provider-specific result codes.
- Customer notification preferences.
