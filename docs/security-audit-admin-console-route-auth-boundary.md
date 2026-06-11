# Admin console route auth boundary

This security audit slice protects the dashboard-style admin routes that render through `AdminConsolePage`.

## Boundary

Each console-backed route now calls `requireAdminRouteSession()` before rendering `AdminConsolePage` or fetching route-specific admin data. Unauthenticated requests are redirected to `/admin/login`.

This complements the earlier `AdminPageShell` boundary for dedicated admin pages.

## Guard

`tests/unit/admin-page-shell-auth-boundary.test.ts` now checks that console-backed admin route pages import the shared route guard and call it before rendering `AdminConsolePage`, while the login route remains publicly reachable.
