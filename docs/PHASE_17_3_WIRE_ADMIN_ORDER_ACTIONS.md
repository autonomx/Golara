# Phase 17.3 — Wire admin order actions through checkout status services

## Goal

Route existing admin order status mutations through the Phase 17.2 checkout status mutation services instead of direct Prisma status writes.

## Implemented

- Updated `components/admin/AdminOrderPanel.tsx` to use canonical Phase 17.1 status constants.
- Updated `app/admin/orders/[orderId]/page.tsx` to use canonical fulfillment status constants.
- Updated `app/admin/order-actions.ts` so:
  - `updateOrderStatusAction()` validates target status with `assertCheckoutOrderStatus()`.
  - `updateOrderStatusAction()` calls `transitionCheckoutOrderStatus()`.
  - `updateOrderFulfillmentAction()` validates target status with `assertCheckoutFulfillmentStatus()`.
  - `updateOrderFulfillmentAction()` calls `transitionCheckoutFulfillmentStatus()`.
- Preserved admin audit logging and page revalidation behavior.
- Preserved staff notes, fulfillment note, courier name, and courier phone updates.

## Behavior change

Admin order and fulfillment status changes now use the state-machine legal transition policy. Illegal transitions fail before status fields are written.

Accepted status changes write timeline events through the shared status service:

- `order_status_changed`
- `fulfillment_status_changed`

No-op same-status updates are allowed by the status service and do not create duplicate transition timeline events.

## Follow-up

Phase 17.4 should wire payment-provider and payment-admin status writes through `transitionCheckoutPaymentStatus()` and add idempotency protections for provider callbacks.

A data migration may be required before production launch if old non-canonical status values exist in a deployed database.
