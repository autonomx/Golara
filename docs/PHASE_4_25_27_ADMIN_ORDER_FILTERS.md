# Phase 4.25-4.27 admin order filters

This bundle improves the admin order operations surface.

## Added foundation

- Admin order repository filters by order status.
- Admin order repository filters by latest/any payment status.
- Admin order repository search by order number, customer phone, customer name, and product title.
- `/admin` now threads order filter query params into order reads.
- Admin order panel adds filter controls.
- Admin order list shows the latest timeline title inline.

## Current filters

- `orderStatus`
- `orderPaymentStatus`
- `orderSearch`

## Scope intentionally deferred

- Pagination for orders.
- Saved operational views.
- Dedicated paid/preparing/delivery dashboards.
- Export/print for orders.
