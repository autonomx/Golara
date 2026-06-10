# Localization progress — API source audit allowlist cleanup

## Scope

Removed the stale `app/api/**` entry from `tests/fixtures/localization-source-audit-allowlist.txt`.

## Rationale

The localization source audit only targets rendered `.tsx` page/loading/error shells under `app/` plus selected component roots. API route handlers are server endpoints and are not discovered by the current rendered-copy scanner, so keeping an API allowlist entry made the remaining source-audit surface look broader than it is.

## Result

After this cleanup, the rendered-copy source audit allowlist is limited to the remaining admin route and admin component localization work:

- `app/admin/**`
- `components/admin/**`

## Follow-up

Continue replacing the remaining admin entries with narrower route/component entries as admin localization slices land.
