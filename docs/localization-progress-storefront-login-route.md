# Storefront login route localization guard

## Scope

Added a guard for `app/account/login/page.tsx`.

## Coverage

The guard verifies that the login route keeps storefront locale resolution, customer copy direction, localized status copy, and localized customer copy wiring.

It also verifies English and Persian copy coverage for login headings, unavailable state, request-code form, verification form, and account/checkout navigation labels.

## Files

- `tests/unit/storefront-login-route-copy.test.ts`
- `tests/unit/storefront-login-entry.test.ts`

## Next candidates

- Account profile route guard
- Account addresses route guard
- Account order history route guard
- Storefront allowlist narrowing after account route guards land
