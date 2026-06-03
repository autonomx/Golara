# Golara Testing Strategy

This document defines the production-readiness test layers for Golara after the Admin Saleor Parity Roadmap work.

## Test Layers

### 1. TypeScript and build safety

Command:

```bash
npm run typecheck
npm run build
```

Purpose:

- validate TypeScript contracts;
- catch stale model/type drift;
- confirm Next.js can compile and generate route payloads.

### 2. Unit and source guards

Command:

```bash
npm run test:unit
```

Purpose:

- validate deterministic helpers;
- guard server action boundaries;
- guard admin role/module access logic;
- guard checkout/payment/order/inquiry workflows;
- guard settings, integrations, analytics, inventory, promotions, and readiness foundations.

The unit runner is intentionally explicit so every new guard must be imported and counted.

### 3. Functional tests

Command:

```bash
npm run test:functional
```

Purpose:

- validate major production workflows are wired together;
- ensure the admin overview includes all Phase 10 operational panels;
- ensure degraded local database states fall back safely for public shell reads;
- ensure roadmap completion and migration coverage stay visible.

### 4. API contract tests

Command:

```bash
npm run test:api
```

Purpose:

- guard route smoke expectations;
- inventory API route handlers;
- ensure write route/server action files expose visible auth/session/csrf/rate protections;
- ensure checkout, inquiry, payment, and notification public contracts remain covered by unit guards.

### 5. Non-browser confidence tests

Command:

```bash
npm run test:nonbrowser
```

Purpose:

- migration/schema source coverage;
- optional live schema checks against an isolated test database;
- optional repository integration checks against an isolated test database;
- server action contract checks;
- route handler contract checks;
- property/fuzz-style normalizer checks;
- seeded workflow checks against an isolated test database;
- analytics payload contract checks;
- static server/data-access boundary checks.

Database-writing checks are opt-in. They run only when `TEST_DATABASE_URL` is set. The test database guard refuses to run when `TEST_DATABASE_URL` equals `DATABASE_URL`, and it also requires the URL to visibly include `test`, `shadow`, or `ci`. Test data uses `golara_test_` prefixes and cleanup runs in `finally`.

Example isolated run:

```bash
$env:TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/golara_test"
npm run test:nonbrowser
```

### 6. E2E smoke contract tests

Command:

```bash
npm run test:e2e
```

Purpose:

- validate the local E2E smoke harness configuration;
- ensure critical public routes are covered by `tools/smoke-routes.mjs`;
- ensure checkout, inquiry, admin auth, module access, notification, and readiness critical paths remain covered by lower-level guards.

### 7. Live route smoke tests

Command:

```bash
npm run build
SMOKE_START_COMMAND="npm run start" npm run test:e2e:routes
```

For development server smoke tests:

```bash
SMOKE_START_COMMAND="npm run dev" npm run test:e2e:routes
```

Purpose:

- start the app;
- wait until it responds;
- request public/customer routes;
- fail on route 500s, missing expected content, or unexpected redirects.

### 8. Full local suite

Command:

```bash
npm run test:all
```

Purpose:

- run typecheck, unit, functional, API, non-browser, and E2E smoke-contract tests in order;
- stop on the first failure;
- print a concise summary.

## Recommended Production-Readiness Order

For a local development database:

```bash
git pull
npx prisma migrate dev
npx prisma generate
npm run test:all
npm run build
SMOKE_START_COMMAND="npm run start" npm run test:e2e:routes
```

For staging/production migrations, replace `migrate dev` with:

```bash
npx prisma migrate deploy
```

## Known Caveats

- Some older roadmap foundations are raw-SQL-backed and not all are represented by Prisma Client models.
- A local database that has not applied all migrations may still trigger fallback paths or missing-table errors until migration parity is fixed.
- `test:e2e` is a deterministic contract test. Use `test:e2e:routes` for actual HTTP route smoke coverage.
- Database-writing non-browser tests require `TEST_DATABASE_URL` and refuse to run against the app/demo `DATABASE_URL`.
- `test:all` does not run `npm run build` because build can be slower and requires the local environment to be configured for static generation. Run build explicitly after the test suite.
