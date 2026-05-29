# Phase 19.5 — Translation editor completeness and existing-value loading

## Goal

Improve the first admin translation editor so staff can see existing translations, edit them in place, and understand which locale slots still need copy.

## Implemented

- Extended catalog view types with optional `CatalogTranslation` metadata.
- Updated admin catalog reads to include translation metadata for product/category records.
- Kept public storefront reads free of translation metadata unless explicitly requested.
- Updated `AdminTranslationPanel` to render one form per supported locale for each visible product/category.
- Prefilled translation form fields from existing translation records.
- Replaced locale dropdowns with hidden locale fields per form to avoid accidental cross-locale overwrites.
- Added per-locale status badges:
  - `Complete`
  - `Draft`
  - `Needs copy`
  - `Missing`
- Added category/product completeness summary counts.

## Completeness policy

For the current phase, a locale slot is considered complete when the translation has:

- `title`
- `description`

Published state is shown separately through the badge logic.

## Safety behavior

- Existing base product/category editing remains unchanged.
- Existing storefront props remain stable.
- Admin catalog reads opt into translation metadata with `includeTranslations: true`.
- Public catalog reads continue to use localized projection and legacy fallback from earlier phases.

## Follow-up

Phase 19.6 should add homepage translation editing and a cleaner admin locale editing layout with search/filter support once the translation surface grows beyond the compact panel.

Phase 19.7 should add route/cookie locale resolution and a storefront language switcher.
