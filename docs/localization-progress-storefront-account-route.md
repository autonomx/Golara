# Storefront account overview route localization guard

## Scope

Added a guard for `app/account/page.tsx`.

## Coverage

The guard verifies that the account overview route keeps storefront locale resolution, customer copy direction, localized account status messages, and localized account dashboard copy.

It also verifies English and Persian copy coverage for account headings, unavailable state, signed-in profile labels, saved address labels, signed-out prompts, and account status messages.

## Files

- `tests/unit/storefront-account-route-copy.test.ts`
- `tests/unit/storefront-account-overview-entry.test.ts`

## Next candidates

- Account addresses route guard
- Account order history route guard
- Storefront allowlist narrowing after account route guards land
