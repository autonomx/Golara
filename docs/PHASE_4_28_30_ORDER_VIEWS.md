# Phase 4.28-4.30 order views

This bundle improves admin order list operations.

## Added foundation

- Paginated admin order repository read.
- Capped filtered order read for CSV and print views.
- `/admin` order page query support.
- Admin order panel previous/next controls.
- Protected CSV route for filtered order lists.
- Protected print view for filtered order lists.

## Current query params

- `orderStatus`
- `orderPaymentStatus`
- `orderSearch`
- `orderPage`

## Export limits

CSV and print reads are capped at 500 rows for now.

## Deferred

- Saved views.
- Bulk updates.
- Dedicated fulfillment dashboards.
- Rich printable packing slips per order.
