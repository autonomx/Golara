# Phase 4.40-4.42 fulfillment filters

This bundle improves admin visibility for fulfillment queues.

## Added foundation

- Admin order repository filter by fulfillment status.
- `orderFulfillmentStatus` query param on `/admin`.
- Fulfillment status preserved in order pagination, CSV, and print links.
- Admin order filter form includes fulfillment status.
- Admin order rows show fulfillment status near order/payment status.

## Supported fulfillment filters

- `not_scheduled`
- `scheduled`
- `preparing`
- `ready_for_delivery`
- `out_for_delivery`
- `delivered`
- `issue`

## Deferred

- Dedicated fulfillment queue dashboard.
- Bulk fulfillment updates.
- Delivery-driver views.
- Customer-facing delivery notifications.
