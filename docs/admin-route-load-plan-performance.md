# Admin route load-plan performance slice

## Scope

This note tracks the follow-up to `docs/admin-route-data-scope-performance.md`.

The first route-scope slice defined which datasets each admin route needs. This slice adds a pure load-plan helper that expands that route scope into explicit load/skip entries and documented fallbacks for skipped datasets.

## Added in this slice

- `lib/admin/admin-route-load-plan.ts`
  - Builds one load/skip entry for every admin data key.
  - Uses `adminRouteNeedsData(...)` from the route-scope matrix.
  - Documents the fallback that should be supplied when a dataset is skipped.
  - Exposes summaries for loaded/skipped counts and skip categories.
- `tests/unit/admin-route-load-plan.test.ts`
  - Verifies every route has a complete load plan.
  - Verifies loaded keys match the route-scope matrix.
  - Verifies products/orders/settings avoid unrelated data groups.
  - Guards the helper as pure planning only: no Prisma, provider, fetch, service, or environment reads.
- `npm run check:admin-route-load-plan`
  - Runs the focused guard for this slice.

## Why this is separate from the runtime rewrite

`app/admin/AdminConsolePage.tsx` is a large shared shell used by multiple admin routes. Replacing its broad eager `Promise.all` with route-scoped loading should be done one route at a time with CI evidence.

This slice creates the safe contract for that runtime rewrite without changing existing render contracts yet.

## Next implementation slice

Use `buildAdminRouteLoadPlan(...)` inside a new `AdminConsolePage` data loader that:

1. Resolves the current route scope from `activeNavKey`, `activeTab`, and section props.
2. Starts only the read promises required by the route scope.
3. Supplies documented empty/default fallbacks for skipped datasets.
4. Preserves existing rendering props so panels remain stable.
5. Adds source guards proving `/admin/products`, `/admin/orders`, `/admin/customers`, and `/admin/settings` skip unrelated reads.
