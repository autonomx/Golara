# Phase 4.8 order detail

This phase adds a staff-facing order detail page.

## Added foundation

- `getAdminCheckoutOrder()` detail read.
- `/admin/orders/[orderId]` admin order detail route.
- Links from the admin order list to detail pages.

## Detail page sections

- Order summary.
- Line items and totals.
- Customer information.
- Delivery/address information.
- Payment attempts.
- Timeline events.

## Rules

- Order detail requires an authenticated admin with at least staff role.
- Missing order IDs return `notFound()`.
- The page is read-only; order status writes still happen from the admin order table.

## Scope intentionally deferred

- Editable order details.
- Order status controls on the detail page.
- Customer-facing order tracking page.
- Payment callback lifecycle rendering.
- Dedicated fulfillment/delivery provider integrations.

## Next phase

Add customer-facing cart and checkout forms that create order drafts from public product pages.
