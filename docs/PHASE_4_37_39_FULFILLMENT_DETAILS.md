# Phase 4.37-4.39 fulfillment details

This bundle adds the first fulfillment metadata for checkout orders.

## Added foundation

- Fulfillment fields on `CheckoutOrder`:
  - `fulfillmentStatus`
  - `fulfillmentNote`
  - `courierName`
  - `courierPhone`
- Staff action to update fulfillment details.
- Audit-log event for fulfillment updates.
- Timeline event for fulfillment updates.
- Fulfillment panel and form on the admin order detail page.
- Fulfillment/courier details on the packing slip.

## Supported fulfillment statuses

- `not_scheduled`
- `scheduled`
- `preparing`
- `ready_for_delivery`
- `out_for_delivery`
- `delivered`
- `issue`

## Deferred

- Delivery-provider integrations.
- Customer-facing delivery ETA messaging.
- Fulfillment dashboard queues.
- Delivery-driver optimized views.
