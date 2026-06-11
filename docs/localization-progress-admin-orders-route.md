# Admin orders route localization guard

## Scope

This slice adds a focused route-boundary guard for `app/admin/orders/page.tsx`.

## Guarded behavior

- The route delegates visible copy to the localized `AdminConsolePage` shell.
- Search params remain passed through to the localized admin console route wrapper.
- The route keeps the sales workspace selected with `forcedTab="sales"`.
- The route keeps the localized orders sales section selected with `salesSection="orders"`.
- The route keeps orders navigation active through `activeNavKey="orders"`.
- The route wrapper continues to avoid route-local raw orders/dashboard JSX copy.

## Verification

Pending GitHub Actions for this PR:

- `tests/unit/admin-orders-route-copy.test.ts`
- full repository CI gate
