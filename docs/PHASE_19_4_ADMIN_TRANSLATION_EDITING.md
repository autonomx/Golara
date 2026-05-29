# Phase 19.4 — Admin translation editing support

## Goal

Add the first admin editing surface for product and category translations while preserving the existing base CMS forms and storefront behavior.

## Implemented

- Added owner-only category translation upsert action:
  - `upsertCategoryTranslationAction(categoryId, formData)`
- Added owner-only product translation upsert action:
  - `upsertProductTranslationAction(productId, formData)`
- Added `components/admin/AdminTranslationPanel.tsx`.
- Wired the translation panel into `AdminDashboard`.
- Added admin success statuses for saved category/product translations.

## Translation fields

### Category translations

- `locale`
- `title`
- `eyebrow`
- `description`
- `imageAlt`
- `isPublished`

### Product translations

- `locale`
- `title`
- `description`
- `imageAlt`
- `isPublished`

## Safety behavior

- Translation writes require owner-level admin access through the existing CMS write guard.
- Locale input is normalized through `normalizeLocale()`.
- Upserts use the unique Prisma keys:
  - `categoryId + locale`
  - `productId + locale`
- Catalog paths are revalidated after translation writes.
- Admin audit logs are written for translation upserts.

## Current UI boundary

The translation panel is intentionally compact and separate from the existing base product/category forms. This keeps base-record editing stable while enabling early translation authoring.

The panel shows the first available admin categories/products with database IDs and lets staff create or update translation records for supported locales.

## Deliberately unchanged

This phase does not:

- add homepage translation editing;
- show existing translation values in forms;
- add completeness indicators;
- add locale tabs inside each existing product/category form;
- add translated routes or a storefront language switcher.

## Follow-up

Phase 19.5 should improve the translation editor by loading existing translations, adding completeness indicators, and moving translation controls closer to each product/category record.

Phase 19.6 should introduce route/cookie locale resolution and a storefront language switcher.
