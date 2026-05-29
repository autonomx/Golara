# Phase 19.1 — Localization architecture

## Goal

Decide Golara's multilingual content architecture before adding more catalog, CMS, checkout, and customer-account copy.

## Implemented

- Added `architecture/LOCALIZATION_ARCHITECTURE.md`.
- Defined initial locale set:
  - `fa-IR` as primary customer-facing locale;
  - `en-CA` as secondary/fallback locale.
- Chose translation tables for long-lived CMS/catalog copy.
- Defined locale resolution order.
- Defined future URL policy.
- Defined fallback behavior during migration.
- Defined admin editing expectations.
- Defined helper seams for later implementation.
- Outlined migration phases from schema foundation through routing/UX.

## Architecture decision

Use translation records for catalog/CMS content instead of adding column-per-locale fields to every model.

This keeps product/category/homepage copy extensible, preserves explicit fallback behavior, and avoids widening every content model as more locales are added.

## Current scope

This phase is documentation-only. It does not change Prisma schema, routes, admin forms, or storefront rendering.

## Follow-up

Phase 19.2 should add the schema foundation and helper utilities:

- product translation records;
- category translation records;
- locale constants and normalization helpers;
- translation fallback utility;
- tests for requested locale, Persian fallback, and legacy base-record fallback.
