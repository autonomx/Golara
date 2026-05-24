# Phase 4.31-4.33 packing slip

This bundle adds a staff-protected per-order packing slip view.

## Added foundation

- `/admin/orders/[orderId]/packing-slip` route.
- Packing slip uses the existing admin order detail repository.
- Packing slip includes recipient, delivery, items, totals, and notes.
- Admin order detail page links to the packing slip.

## Rules

- Requires an authenticated admin with at least staff role.
- Missing orders return `notFound()`.
- The view is intentionally simple and printer-friendly.

## Deferred

- PDF generation.
- Barcode/QR support.
- Dedicated florist/workroom production notes.
- Delivery-driver optimized view.
