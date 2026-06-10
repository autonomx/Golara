# Localization progress — storefront component source audit

## Scope

- Source audit allowlist: `tests/fixtures/localization-source-audit-allowlist.txt`
- Audit target: `tests/unit/localization-source-audit.test.ts`

## Completed in this slice

- Removed the stale `components/storefront/**` allowlist entry.
- Confirmed the source audit already tolerates a missing `components/storefront` directory by returning no collected files for absent roots.
- Left active allowlist scope limited to admin route shells, API route files, and admin components.

## Remaining follow-ups

- Continue admin route-boundary localization before narrowing `app/admin/**`.
- Continue admin component extraction/localization before narrowing `components/admin/**`.
- Keep `app/api/**` deferred until the server-copy/API response localization phase.
