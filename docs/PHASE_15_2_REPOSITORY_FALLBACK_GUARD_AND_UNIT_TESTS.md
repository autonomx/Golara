# Phase 15.2 — Repository fallback guard and unit tests

This bundle continues the production runtime safety work from Phase 15.1.

## Implemented

- Adds a `test:unit` npm script using `tsx`.
- Updates GitHub Actions CI to run unit tests after typecheck and before build.
- Adds runtime mode unit tests for:
  - explicit `APP_MODE=production`
  - explicit `APP_MODE=preview`
  - implicit production via `VERCEL_ENV=production`
  - development mode with `DATABASE_URL`
- Adds `lib/cms/repository-fallback-policy.ts` with `readWithSeedFallback()`.
- Adds repository fallback policy tests for:
  - missing DB in preview falls back to seed data
  - missing DB in production rejects
  - DB read error in preview falls back to seed data
  - DB read error in production rejects
- Strengthens `hasDatabase()` so production-like runtime without `DATABASE_URL` fails fast.

## Current guard behavior

Existing repository fallback call sites already check `hasDatabase()` before returning seed data. Because `hasDatabase()` now calls `assertDatabaseOrPreviewFallback()`, production runtime without `DATABASE_URL` can no longer silently fall back to seed data.

The new `readWithSeedFallback()` helper also prevents fallback after DB read errors in production. Existing large repository files should migrate to this helper in smaller follow-up refactors.

## Follow-up

Phase 15.2.1 should migrate `lib/cms/catalog-repository.ts` from its local `readWithFallback()` helper to `readWithSeedFallback()` so production DB read errors cannot fall back to seed data either.

That change is intentionally separated because `catalog-repository.ts` is a large file and should be touched carefully.
