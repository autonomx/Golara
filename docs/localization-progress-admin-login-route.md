# Admin login route localization guard

## Scope

This slice adds a focused route-boundary guard for `app/admin/login/page.tsx`.

## Guarded behavior

- The route resolves the storefront locale before rendering login copy.
- Login copy is translated through `createAdminTranslator(locale)`.
- The route shell sets `dir={getStorefrontCopyDirection(locale)}`.
- Authenticated users continue to redirect before login copy renders.
- Auth configuration warnings remain gated by `isAdminAuthConfigured()`.
- Login title, heading, helper text, auth warning fragments, password label, and submit text stay dictionary-backed and have Persian coverage.

## Verification

Pending GitHub Actions for this PR:

- `tests/unit/admin-login-route-copy.test.ts`
- full repository CI gate
