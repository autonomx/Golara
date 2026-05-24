# Phase 4.5 admin orders

This phase adds the first admin order operations surface.

## Added foundation

- `CheckoutOrderSummary` shared type.
- `formatMinorUnitAmount` helper for integer minor-unit order totals.
- `lib/checkout/admin-order-repository.ts` with a recent order summary read.
- `AdminOrderPanel` read-only order table.
- `/admin` wiring for signed-in staff/owners.
- Quick-nav link for orders.

## Current behavior

The admin order panel is read-only and shows:

- created time
- order number
- customer label/phone when available
- order status
- checkout mode
- item count
- latest payment status
- total amount

## Scope intentionally deferred

- Order detail page.
- Order status updates.
- Fulfillment timeline.
- Staff notes.
- Payment timeline UI.
- Audit-log events for order operations.

## Next phase

Add admin order detail and status operations, then connect manual/gateway payment lifecycle transitions.
