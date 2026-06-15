# Admin route data-scope performance plan

## Purpose

Admin pages currently share `AdminConsolePage`, which makes it easy for dedicated routes to load datasets they do not render. This document tracks the route-scoped loading plan that lets each admin route fetch only the data it needs while preserving the shared shell and existing panels.

## Implemented in this slice

- Added `lib/admin/admin-route-data-scope.ts` as a pure route-scope planner.
- Added `tests/unit/admin-route-data-scope.test.ts` to guard the route/data matrix.
- Added `npm run check:admin-route-data-scope` for focused verification.

## Current route scopes

- `products`, `categories`, and `media` are catalog scopes and should not load settings, orders, inquiries, customers, audit logs, or staff records.
- `orders` should load order-page data plus minimal catalog summary data needed by the shared header/shell, but should not load customers, settings, or inquiries.
- `inquiries` should load inquiry page/list/count data plus minimal catalog summary data, but should not load orders, settings, or customers.
- `customers` should load customer and auth-event summaries, but should not load catalog, sales, or settings rows.
- `settings` should load store settings, storefront navigation, and fulfillment methods, but should not load catalog, sales, customer, audit, or staff rows.
- `audit` and `staff` should load only their dedicated data.

## Next runtime refactor

The next runtime slice should use the planner inside `AdminConsolePage` or a small data-loader adapter so each Promise in the shared loader is replaced with either the real repository call or a safe empty/default value based on `adminRouteNeedsData(scope, key)`.

Recommended order:

1. Add a tiny `resolveAdminRouteScope(...)` helper that maps `forcedTab`, `activeNavKey`, and section props to an `AdminRouteScope`.
2. Replace settings-only reads with scoped fallbacks first:
   - `storeSettingsService.get()` only for `settings`.
   - `storefrontNavigationMenuService.get()` only for `settings`.
   - `listAdminFulfillmentMethodSettings()` only for `settings`.
3. Replace customer-only reads:
   - `listAdminCustomers()` only for `customers`.
   - `getCustomerAuthEventSummary()` only for `customers` or overview/dashboard surfaces that render it.
4. Replace sales-only reads:
   - order page/revenue reads only for orders/overview.
   - inquiry page/list/count reads only for inquiries/overview.
5. Replace audit/staff-only reads:
   - audit logs only for audit/overview.
   - staff readiness only for staff/overview and owner role.

## Guardrails

The planner is intentionally pure. It must not import Prisma, process env, repository functions, or provider clients. The source guard blocks those imports so it can stay safe to use in route tests and future loader planning.
