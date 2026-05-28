# Phase 17.2 — Checkout status mutation services

## Goal

Route checkout order, payment, and fulfillment status writes through the Phase 17.1 state-machine guards and create timeline events for accepted transitions.

## Implemented

- Added `lib/checkout/checkout-status-service.ts`.
- Added `transitionCheckoutOrderStatus()`.
- Added `transitionCheckoutPaymentStatus()`.
- Added `transitionCheckoutFulfillmentStatus()`.
- Each service validates the current status and requested target status with the Phase 17.1 transition guards.
- Each accepted status change runs inside a Prisma transaction.
- Each accepted status change writes a `CheckoutOrderTimelineEvent`.
- No-op transitions from a status to itself are allowed and do not write duplicate timeline events.

## Timeline event types

- `order_status_changed`
- `payment_status_changed`
- `fulfillment_status_changed`

Each event stores bounded metadata:

- `from`
- `to`
- `paymentAttemptId` for payment transitions

## Safety behavior

The services fail fast when:

- `DATABASE_URL` is unavailable;
- the target order or payment attempt cannot be found;
- the current persisted status is unknown;
- the requested transition is illegal.

## Follow-up

Phase 17.3 should wire existing admin/server actions and future provider callbacks through these services instead of writing status fields directly.

Phase 17.4 should add payment idempotency foundations before real payment provider callbacks are enabled.
