# Phase 5.59-5.61 admin skip-link targets

This bundle extends the Phase 5.56-5.58 skip-to-content foundation to admin-facing page roots.

## Added behavior

- `/admin` now exposes `id="main-content"` and `tabIndex={-1}` on its page root.
- `/admin/login` now exposes `id="main-content"` and `tabIndex={-1}` on its page root.
- `/admin/orders/[orderId]` now exposes `id="main-content"` and `tabIndex={-1}` on its page root.
- `/admin/orders/[orderId]/packing-slip` now exposes `id="main-content"` and `tabIndex={-1}` on its page root.

## Current scope

The admin order list, inquiry board, audit log, media library, and CMS editor currently render inside the main `/admin` dashboard. This pass keeps that structure unchanged and only adds skip-link landing targets to the route-level page roots.

## Deferred

- Shared admin layout cleanup.
- Admin sub-navigation landmarks.
- Automated keyboard navigation tests.
