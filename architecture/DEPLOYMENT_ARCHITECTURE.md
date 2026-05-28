# Golara Deployment Architecture

## Purpose

This document defines the first production-safety deployment boundary for Golara: seeded fallback is allowed for preview/development/test, but production must use a real database.

## Runtime modes

Golara supports an explicit `APP_MODE` environment variable.

| APP_MODE | Intended use | Seed fallback allowed? | DATABASE_URL required? |
| --- | --- | --- | --- |
| `preview` | CI, design preview, demo builds without DB | Yes | No |
| `development` | Local development | Yes | No |
| `test` | Automated tests | Yes | No |
| `production` | Real customer-facing production | No | Yes |

If `APP_MODE` is not configured:

- `VERCEL_ENV=production` is treated as production.
- `NODE_ENV=test` is treated as test.
- `NODE_ENV=development` is treated as development.
- otherwise the app defaults to preview so CI and static preview builds continue to work.

## Production database rule

Production must not silently serve seed data.

The runtime helper in `lib/prisma.ts` provides:

- `getAppRuntimeMode()`
- `hasDatabase()`
- `canUseSeedFallback()`
- `assertDatabaseOrPreviewFallback(context)`

The intended rule is:

```text
if production-like runtime and DATABASE_URL is missing:
  fail fast with a clear configuration error
else:
  allow database reads or seeded preview fallback
```

## Current implementation status

Implemented in Phase 15.1:

- explicit runtime mode parsing;
- production database requirement helper;
- clear error message for missing production database;
- roadmap for repository fallback enforcement.

Still to implement in Phase 15.2:

- update all seeded repository fallback helpers so database read failures do not fall back to seed data in production;
- add tests around runtime mode behavior;
- expose runtime status in admin readiness UI.

## Environment contract

### Preview / CI

```bash
APP_MODE=preview
# DATABASE_URL optional
```

### Local development with fallback data

```bash
APP_MODE=development
# DATABASE_URL optional
```

### Local development with database

```bash
APP_MODE=development
DATABASE_URL=postgresql://...
```

Then run:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### Production

```bash
APP_MODE=production
DATABASE_URL=postgresql://...
```

Production deployment should run migrations or schema push through the selected deployment process before serving traffic.

## Migration and seed policy

Preview/demo:

- may use seeded fallback without DB;
- may run `db:seed` against disposable DBs.

Production:

- must not depend on seeded fallback;
- should run migrations/schema updates against staging before production;
- should seed only intentional baseline CMS/category/product data;
- must avoid destructive seed overwrites without review.

## Follow-up checklist

- [ ] Enforce repository fallback guard in production.
- [ ] Add runtime mode tests.
- [ ] Add admin readiness row for `APP_MODE`.
- [ ] Add staging migration checklist.
- [ ] Document production deployment provider-specific setup.
