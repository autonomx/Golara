# Phase 5.7-5.9 structured data

This bundle adds conservative Product JSON-LD for product detail pages.

## Added foundation

- `lib/structured-data.ts` helper.
- `buildProductJsonLd()` for product schema data.
- `JsonLdScript` safe JSON-LD script component.
- Product detail pages render Product JSON-LD.

## Product JSON-LD fields

- name
- description
- image
- sku
- brand
- offer URL
- price currency
- price
- availability

## Deferred

- Breadcrumb structured data.
- Organization structured data.
- LocalBusiness structured data.
- Review/rating data.
- CMS-editable structured metadata fields.
