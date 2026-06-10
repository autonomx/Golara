# Storefront profile route localization guard

## Scope

Added a guard for `app/account/profile/page.tsx`.

## Coverage

The guard verifies that the account profile edit route keeps storefront locale resolution for the unavailable state, customer copy direction, localized profile status messages, and localized profile form copy.

It also verifies English and Persian copy coverage for profile headings, unavailable state, status messages, form labels, verified-phone copy, and the account overview navigation label.

## Runtime patch

The no-database profile route branch now resolves the storefront locale, applies direction, and passes that locale into `SiteHeader`.

The signed-in profile route branch now passes the session locale into `SiteHeader`.

## Files

- `app/account/profile/page.tsx`
- `tests/unit/storefront-profile-route-copy.test.ts`
- `tests/unit/storefront-profile-entry.test.ts`

## Next candidates

- Account overview route guard
- Account addresses route guard
- Account order history route guard
- Storefront allowlist narrowing after account route guards land
