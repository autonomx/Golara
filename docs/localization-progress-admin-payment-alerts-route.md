# Admin payment alerts route localization guard

## Scope

- Route: `app/admin/payments/alerts/page.tsx`
- Guard: `tests/unit/payment-webhook-alert-navigation.test.ts`

## Progress

This slice hardens the existing payment webhook alert navigation guard so the admin payment alerts route stays wired to localized admin copy:

- resolves the storefront/admin locale once with `resolveStorefrontLocale()`;
- creates the admin translator with `createAdminTranslator(locale)`;
- passes `locale={locale}` into `AdminPageShell`;
- keeps the route heading, eyebrow, description, links, and authentication status copy behind `t(...)` calls;
- verifies every route-level copy key used by the page exists in `lib/localization/admin-copy.ts`.

No runtime copy rewrite was needed in this slice because the route was already dictionary-backed. The remaining admin source-audit allowlist should continue to be narrowed one route shell or small component at a time.
