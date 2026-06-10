# Admin media page localization guard

## Status

Added a focused guard for the admin media route page.

## Coverage

- Verifies `app/admin/media/page.tsx` resolves the storefront locale and direction.
- Verifies media route and category selector copy stays wrapped in the admin translator.
- Verifies guarded media page labels have Persian `admin-copy` entries.
- Adds a direct unit entrypoint for the guard.

## Verification

Pending GitHub Actions on the PR branch.
