# Storefront addresses route localization guard

## Scope

Added a guard for `app/account/addresses/page.tsx`.

## Coverage

The guard verifies that the account addresses route keeps storefront locale resolution for the unavailable state, customer copy direction, localized address-book status messages, and localized address form/list copy.

It also verifies English and Persian copy coverage for address headings, unavailable state, form labels, empty state, default-address actions, delete/update actions, city fallback, and status messages.

## Runtime patch

The no-database branch now resolves the storefront locale, applies direction, and passes that locale into `SiteHeader`.

The signed-in branch now applies customer copy direction and passes the session locale into `SiteHeader`.

## Files

- `app/account/addresses/page.tsx`
- `tests/unit/storefront-addresses-route-copy.test.ts`
- `tests/unit/storefront-addresses-entry.test.ts`

## Next candidates

- Account order history route guard
- Storefront allowlist narrowing after account route guards land
