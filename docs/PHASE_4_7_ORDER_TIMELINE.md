# Phase 4.7 order timeline

This phase adds the order timeline data foundation.

## Added foundation

- `CheckoutOrderTimelineEvent` Prisma model.
- Timeline relation from `CheckoutOrder`.
- Order status updates now create timeline rows.
- Timeline entries include event type, title, note, actor label, actor role, and bounded metadata.
- `lib/checkout/order-timeline-repository.ts` read helper.

## Current behavior

The first timeline events are created when staff/owner users update an order status from the admin order panel.

## Scope intentionally deferred

- Full order detail page.
- Timeline rendering in the admin UI.
- Customer-facing order tracking page.
- Payment provider callback events.
- Delivery/fulfillment provider events.

## Next phase

Add an admin order detail view that combines order summary, line items, payment attempts, and timeline events.
