# Phase 15.4 — Production runtime smoke checks

## Goal

Make CI and local validation prove that production runtime configuration cannot silently use seeded fallback data.

## Implemented

- Added `tools/check-runtime.mjs`.
- Added `npm run check:runtime`.
- Added runtime smoke checks to GitHub Actions CI before Prisma generation, typecheck, unit tests, and build.
- Updated `architecture/DEPLOYMENT_ARCHITECTURE.md` with the current Phase 15 runtime-safety status.

## Smoke assertions

`npm run check:runtime` validates:

1. `APP_MODE=production` with no `DATABASE_URL` fails `hasDatabase()`.
2. `APP_MODE=production` with a DB URL rethrows repository read errors instead of falling back to seeded data.
3. `APP_MODE=preview` with no `DATABASE_URL` can still intentionally use seeded fallback.

## Why this exists

Unit tests cover the TypeScript helpers directly. The smoke script gives operators and CI a simple command to validate the deployment contract without needing a live database.

## Validation

Run:

```bash
npm run check:runtime
npm run test:unit
npm run typecheck
npm run build
```
