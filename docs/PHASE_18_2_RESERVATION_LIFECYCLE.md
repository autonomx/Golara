# Phase 18.2 — Fulfillment capacity reservation lifecycle

## Goal

Wire the Phase 18.1 fulfillment capacity reservation primitives into checkout status transitions so capacity is confirmed or released when order/payment state changes.

## Implemented

- Added order-linked reservation helpers in `lib/checkout/fulfillment-capacity-service.ts`:
  - `getOrderCapacityReservationId()`
  - `confirmOrderFulfillmentCapacityReservation()`
  - `releaseOrderFulfillmentCapacityReservation()`
  - `expireHeldFulfillmentCapacityReservations()`
- Updated `lib/checkout/checkout-status-service.ts` to apply reservation lifecycle side effects after accepted status transitions.

## Lifecycle rules

### Confirm capacity

Capacity is confirmed when:

- order status transitions to `confirmed`;
- payment status transitions to `paid`.

### Release capacity

Capacity is released when:

- order status transitions to `cancelled`;
- payment status transitions to `failed`;
- payment status transitions to `cancelled`;
- payment status transitions to `refunded`.

### Expire capacity

`expireHeldFulfillmentCapacityReservations()` marks expired held reservations as `expired` and recalculates affected bucket `reserved` counts.

## Safety behavior

The lifecycle helpers are idempotent around terminal reservation states:

- releasing a non-active reservation returns the current reservation without changing bucket counts;
- order helpers return `null` when the order has no capacity reservation;
- confirmation is only attempted when an order has a reservation.

## Follow-up

Future bundles should:

- hold capacity during actual checkout date/window selection;
- add admin capacity bucket management;
- add capacity exhaustion tests against a test database or repository seam;
- add scheduled cleanup for expired holds;
- write timeline events when capacity is reserved, confirmed, released, or expired.
