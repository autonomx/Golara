# Phase 4.6 order status operations

This phase adds the first writable admin operations for checkout orders.

## Added foundation

- `app/admin/order-actions.ts` server action for updating checkout order status.
- Staff-or-owner role enforcement for order status updates.
- Audit-log event for order status changes.
- Inline order status form in the admin orders table.
- Optional staff note capture on status updates.

## Supported order statuses

- `draft`
- `pending_payment`
- `paid`
- `preparing`
- `out_for_delivery`
- `fulfilled`
- `cancelled`

## Rules

- Order status writes require an authenticated admin with at least staff role.
- Invalid statuses are rejected server-side.
- Status changes revalidate `/admin` and redirect back to the orders panel.
- Audit logs record previous status, new status, and whether a staff note was included.

## Scope intentionally deferred

- Order detail page.
- Dedicated order timeline model.
- Payment transition verification.
- Customer-facing order status page.
- Fine-grained transition rules between statuses.

## Next phase

Add order detail and timeline records so order operations are easier to inspect and audit over time.
