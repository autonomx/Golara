# Phase 18.3 — Checkout capacity hold wiring

## Goal

Add the checkout-facing capacity hold seam so future checkout/date-window selection can create a held fulfillment reservation before order confirmation.

## Implemented

- Added `lib/checkout/checkout-capacity-hold-service.ts`.
- Added `findFulfillmentCapacityBucket()`.
- Added `holdCheckoutFulfillmentCapacity()`.
- Added unit coverage for capacity hold normalization rules.

## Service behavior

`holdCheckoutFulfillmentCapacity()`:

1. normalizes `windowKey` and `fulfillmentType`;
2. finds the matching `FulfillmentCapacityBucket` by `capacityDate + windowKey + fulfillmentType`;
3. rejects when no bucket exists;
4. creates a held reservation through `reserveFulfillmentCapacity()`;
5. applies a bounded hold expiration;
6. optionally links the reservation to an order when `orderId` is supplied;
7. tags metadata with `source: checkout_capacity_hold`.

## Hold defaults

- Default fulfillment type: `delivery`
- Default window key fallback: `default`
- Default hold duration: 20 minutes
- Hold duration clamp: 1 to 1440 minutes
- Quantity fallback: 1

## Current integration boundary

No live checkout action was found in the current repository tree for order creation/date-window selection, so this phase adds the reusable service seam rather than inventing a new UI route.

Future checkout code should call `holdCheckoutFulfillmentCapacity()` when the customer selects or changes a delivery date/window.

## Follow-up

Phase 18.4 should wire the hold service into the actual checkout/order creation action once that seam exists, and add database-backed capacity exhaustion tests around:

- available capacity;
- exhausted bucket;
- release after cancellation;
- expiration of held reservations;
- changing delivery windows releases the old hold and creates a new one.
