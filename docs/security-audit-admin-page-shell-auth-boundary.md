# Admin page shell auth boundary audit

## Scope

This slice hardens dedicated admin pages that render through `AdminPageShell`.

## Change

`AdminPageShell` now redirects unauthenticated requests to `/admin/login` before rendering admin navigation or child content. The login route remains outside the protected shell so unauthenticated operators can still authenticate.

## Coverage

`tests/unit/admin-page-shell-auth-boundary.test.ts` guards that:

- `AdminPageShell` imports the Next.js server redirect helper;
- unauthenticated shell renders redirect to `/admin/login` before any admin UI is returned;
- `/admin/login` remains the public admin entry route and redirects already-authenticated users back to `/admin`;
- `/admin/login` does not use the protected shell.

## Follow-up

Dashboard-style routes that render through `AdminConsolePage` should receive a separate auth-boundary slice so the larger console component can be patched and reviewed independently.
