# Localization progress — homepage brand copy

## Scope

- Route: `app/page.tsx`
- Copy bundle: `lib/localization/storefront-copy.ts`
- Guard: `tests/unit/storefront-homepage-route-copy.test.ts`
- Source audit allowlist: `tests/fixtures/localization-source-audit-allowlist.txt`

## Completed in this slice

- Added a `brand.name` storefront copy key for the homepage route's metadata and footer brand display.
- Replaced direct homepage `Golara` JSX/metadata literals with `copy('brand.name')`.
- Removed `app/page.tsx` from the localization source-audit allowlist.
- Added a homepage route guard that asserts the brand key, homepage copy keys, helper usage, and allowlist removal.

## Remaining follow-ups

- Audit and narrow `components/storefront/**` to component-level entries or localized component guards.
- Continue admin route/component extraction before removing the admin route and component allowlist groups.
- Keep `app/api/**` deferred until the server-copy/API response localization phase.
