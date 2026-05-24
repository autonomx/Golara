# Phase 4.3 order drafts

This phase adds the server-side data foundation for cart/order drafts before payment gateway handoff.

## Added foundation

- `CheckoutOrder` Prisma model.
- `CheckoutOrderItem` Prisma model.
- Product relation from products to order items.
- Customer/address relation from Phase 4.2 into checkout orders.
- `lib/checkout/order-draft-repository.ts` with:
  - item normalization
  - quantity clamping
  - active product lookup
  - server-side subtotal/total calculation
  - draft order creation
  - draft order lookup

## Rules

- Client-submitted totals are never trusted.
- Draft totals are recomputed from current database product prices.
- Inactive products or inactive-category products are rejected.
- Quantity is clamped to a safe range.

## Scope intentionally deferred

- Cart UI/session persistence.
- Checkout form actions.
- Delivery fee rules.
- Discounts.
- Gateway handoff.
- Gateway verification callbacks.
- Admin order list/timeline.

## Next phase

Phase 4.4 should add payment attempt records and a provider seam for gateway handoff/verification.
