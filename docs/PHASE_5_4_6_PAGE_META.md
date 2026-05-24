# Phase 5.4-5.6 page metadata

This bundle adds dynamic metadata to product and category pages.

## Added foundation

- Product pages implement `generateMetadata()`.
- Category pages implement `generateMetadata()`.
- Product metadata uses product title, description, route path, and image.
- Category metadata uses category title, description, and route path.
- Missing product/category metadata returns safe not-found metadata.

## Why

The storefront now has reusable site metadata defaults and page-level metadata for product/category sharing.

## Deferred

- Structured data.
- Dedicated Open Graph image generation.
- CMS-editable metadata fields.
- Persian/locale-specific metadata.
