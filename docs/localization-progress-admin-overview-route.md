# Admin overview route localization guard

## Scope

- Guarded `app/admin/page.tsx` as a localization-clean route wrapper.
- Verified the route delegates to `AdminConsolePage`, passes `searchParams`, and keeps `activeNavKey="overview"` instead of rendering route-local copy.
- Added a unit entry file so the guard runs with the existing unit suite.

## Verification

Pending GitHub Actions on PR.
