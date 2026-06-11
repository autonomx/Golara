# Admin payment operations route localization guard

## Scope

- Route: `app/admin/payments/operations/page.tsx`
- Guard: `tests/unit/admin-payment-operations-page-copy.test.ts`

## Progress

This slice adds a focused guard for the existing payment operations landing route. The route was already dictionary-backed, so no runtime copy rewrite was needed.

The guard verifies that the page:

- resolves the current locale with `resolveStorefrontLocale()`;
- creates the admin translator with `createAdminTranslator(locale)`;
- sets `dir={getStorefrontCopyDirection(locale)}` on the route shell;
- keeps heading, landing description, auth status, disabled-execution warning, navigation links, and card descriptions behind `t(...)` calls;
- keeps the operation cards data-driven through `operationLinks.map` while translating `link.label` and `link.description`;
- verifies every route-level key resolves to Persian admin copy;
- rejects raw JSX fragments for the route shell labels.

The remaining admin source-audit allowlist should continue to be narrowed with similarly small route-shell or component guards.
