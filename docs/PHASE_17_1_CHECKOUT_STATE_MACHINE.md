# Phase 17.1 — Checkout state machine foundation

## Goal

Make checkout order, payment, and fulfillment transitions explicit and testable before provider-specific payment integration.

## Implemented

- Added `lib/checkout/checkout-state-machine.ts`.
- Added canonical status constants for:
  - checkout order status;
  - checkout payment status;
  - checkout fulfillment status.
- Added type guards and assertion helpers for each status family.
- Added legal transition guards for each status family.
- Added allowed-transition helper functions.
- Added unit tests for valid transitions, invalid transitions, terminal states, unknown status assertions, and helper behavior.

## Current status sets

### Order

- `draft`
- `pending`
- `confirmed`
- `cancelled`
- `completed`

### Payment

- `created`
- `pending`
- `paid`
- `failed`
- `cancelled`
- `refunded`

### Fulfillment

- `not_scheduled`
- `scheduled`
- `preparing`
- `out_for_delivery`
- `delivered`
- `cancelled`

## Transition policy

No server action or route is wired to the transition guards yet. This phase introduces pure helpers and unit coverage first.

Follow-up phases should route order/payment/fulfillment updates through these guards before writing status changes, and should ensure every transition writes a timeline event.

## Follow-up

Phase 17.2 should extract checkout status mutation services:

1. centralize order status updates;
2. centralize payment status updates;
3. centralize fulfillment status updates;
4. reject illegal transitions before DB writes;
5. write a `CheckoutOrderTimelineEvent` for every accepted transition.
