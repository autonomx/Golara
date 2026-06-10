# Admin payment history route localization guard

Added a focused localization guard for `app/admin/payments/operations/history/page.tsx`.

The guard verifies:

- The route resolves the storefront locale.
- The route creates the admin translator from that locale.
- The shell uses locale direction.
- Visible route-shell labels remain wrapped in `t(...)`.
- Persian admin-copy entries exist for the guarded labels.

This keeps Phase 1 admin route-boundary localization moving with a short route file and avoids broad rewrites of large admin surfaces.
