# Phase 19.2 — Localization schema foundation

## Goal

Add the first localization schema and helper foundations without changing storefront rendering or admin editing flows yet.

## Implemented

- Added `ProductTranslation` Prisma model.
- Added `CategoryTranslation` Prisma model.
- Added `HomepageSectionTranslation` Prisma model.
- Added translation relations to `Product`, `Category`, and `HomepageSection`.
- Added `lib/i18n/locales.ts`.
- Added `lib/i18n/translated-content.ts`.
- Added unit tests for locale normalization, locale direction, fallback order, translation selection, published filtering, and legacy base-record fallback.

## Locale constants

Initial supported locales:

- `fa-IR` — primary/default customer-facing locale.
- `en-CA` — secondary/fallback locale.

## Translation fallback behavior

The helper flow is:

1. Normalize requested locale.
2. Try a published translation for requested locale.
3. Fall back to published translations in the configured locale order.
4. Fall back to legacy base record fields when no published translation exists.

## Schema boundary

This phase adds translation tables only. It does not:

- migrate existing data into translation records;
- change storefront catalog queries;
- change admin forms;
- add translated routes;
- add language switcher UI.

## Follow-up

Phase 19.3 should update catalog repository read paths to project localized view models using these helpers while preserving current storefront props and fallback behavior.
