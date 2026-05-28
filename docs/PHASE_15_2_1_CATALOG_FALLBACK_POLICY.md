# Phase 15.2.1 — Catalog repository fallback policy migration

This follow-up completes the repository fallback guard for the catalog/CMS repository.

## Implemented

- `lib/cms/catalog-repository.ts` now imports the shared `readWithSeedFallback()` helper from `lib/cms/repository-fallback-policy.ts`.
- The local `readWithFallback()` wrapper now delegates to the shared policy helper.
- Existing call sites remain unchanged to keep the PR small and low-risk.

## Behavior

Preview/development/test behavior stays the same:

- missing `DATABASE_URL` can use seeded fallback content;
- database read errors can fall back to seed content for preview/dev/test resilience.

Production behavior is now stricter:

- missing `DATABASE_URL` fails fast;
- database read errors are rethrown instead of silently serving seed data.

## Why this matters

Before this change, production-like runtime with a configured but failing database could still fall back to seed data from `catalog-repository.ts`. That is risky because a production outage or migration issue could be hidden behind demo data.

With the shared fallback policy, production data failures are visible failures rather than silent content substitution.

## Follow-up

- Add admin readiness UI for `APP_MODE`, database presence, and fallback eligibility.
- Add service-specific tests for critical repository reads if needed.
- Consider passing more specific context labels into each repository call for clearer error/log messages.
