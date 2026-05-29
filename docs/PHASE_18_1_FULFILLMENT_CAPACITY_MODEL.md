# Phase 18.1 — Fulfillment capacity model foundation

## Goal

Add the first fulfillment capacity and reservation primitives so checkout can later avoid overselling same-day delivery windows.

## Implemented

- Added `FulfillmentCapacityBucket` to Prisma schema.
- Added `FulfillmentCapacityReservation` to Prisma schema.
- Added an optional one-to-one link from `CheckoutOrder` to a capacity reservation.
- Added `lib/checkout/fulfillment-capacity-service.ts`.
- Added `reserveFulfillmentCapacity()`.
- Added `releaseFulfillmentCapacityReservation()`.
- Added `confirmFulfillmentCapacityReservation()`.

## Capacity bucket model

A bucket represents capacity for a date, window, and fulfillment type:

- `capacityDate`
- `windowKey`
- `fulfillmentType`
- `capacity`
- `reserved`

The unique bucket key is:

```text
capacityDate + windowKey + fulfillmentType
```

## Reservation model

A reservation belongs to a bucket and may be linked to a checkout order.

Reservation statuses:

- `held`
- `confirmed`
- `released`
- `expired`

Only `held` and `confirmed` reservations count against active reserved capacity.

## Service behavior

`reserveFulfillmentCapacity()`:

1. loads the bucket and active reservations;
2. calculates remaining capacity;
3. rejects requests that exceed remaining capacity;
4. creates a held reservation;
5. updates the bucket reserved count;
6. optionally links the reservation to a checkout order.

`releaseFulfillmentCapacityReservation()`:

1. marks an active reservation as `released` or `expired`;
2. recalculates the bucket reserved count from active reservations.

`confirmFulfillmentCapacityReservation()`:

1. marks a reservation as `confirmed`.

## Follow-up

Phase 18.2 should wire the reservation lifecycle into checkout/order/payment flows:

- hold capacity during checkout;
- confirm capacity on payment/staff confirmation;
- release capacity on cancellation, payment failure, or expiration;
- add tests for capacity exhaustion and lifecycle transitions.
