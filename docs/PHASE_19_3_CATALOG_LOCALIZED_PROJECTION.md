# Phase 19.3 — Catalog localized read projection

## Goal

Update catalog read paths to project localized storefront view models using the Phase 19.2 translation helpers while preserving existing storefront props and fallback behavior.

## Implemented

- Updated `lib/cms/catalog-repository.ts`.
- Public category reads can now accept optional `{ locale }` options.
- Public product reads can now accept optional `{ locale }` options.
- Homepage content reads can now accept optional `{ locale }` options.
- Product, category, parent category, and homepage translation records are included on public DB reads.
- Existing function callers remain compatible because locale options are optional.

## Localized functions

The following functions now support optional locale-aware projection:

- `listCategories({ locale })`
- `listHomepageCategories({ locale })`
- `getCategoryBySlug(slug, { locale })`
- `listProducts({ locale })`
- `getProductBySlug(slug, { locale })`
- `listProductsByCategorySlug(slug, { locale })`
- `getHomepageContent({ locale })`

## Fallback behavior

The projection uses Phase 19.2 helpers:

1. Try a published translation for the requested locale.
2. Fall back through configured locale order.
3. Fall back to legacy base record fields when no published translation exists.

This keeps current storefront rendering stable while allowing translated records to take effect when present.

## Deliberately unchanged

This phase does not:

- add translated routes;
- add a language switcher;
- change admin editing forms;
- seed translation records;
- require callers to pass locale options;
- alter storefront prop shapes.

## Follow-up

Phase 19.4 should add admin editing support for product/category translations, including locale tabs, publish flags, and fallback/completeness indicators.
