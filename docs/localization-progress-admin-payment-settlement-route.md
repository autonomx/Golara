# Admin payment settlement route localization guard

## Scope

- Route: `app/admin/payments/settlement/page.tsx`
- Guard: `tests/unit/admin-payment-settlement-page-copy.test.ts`

## Progress

This slice adds a focused guard for the existing payment settlement route. The route was already dictionary-backed, so no runtime copy rewrite was needed.

The guard verifies that the page:

- resolves the current locale with `resolveStorefrontLocale()`;
- creates the admin translator with `createAdminTranslator(locale)`;
- passes `locale={locale}` into `AdminPageShell`;
- keeps heading, description, navigation links, auth status, and read-only operation warning behind `t(...)` calls;
- verifies every route-level key resolves to Persian admin copy;
- rejects raw JSX fragments for the route shell labels;
- delegates settlement summary/table rendering to `AdminPaymentSettlementSummaryPanel`.

The remaining admin source-audit allowlist should continue to be narrowed with similarly small route-shell or component guards.
