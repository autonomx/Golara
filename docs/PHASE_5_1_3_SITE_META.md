# Phase 5.1-5.3 site metadata foundation

This bundle starts Phase 5 polish/growth with reusable site metadata defaults.

## Added foundation

- `lib/site-metadata.ts` centralizes storefront metadata defaults.
- `buildPageMetadata()` creates reusable Next.js metadata objects.
- Root layout now uses the shared metadata helper.
- Open Graph defaults are included.
- Twitter card defaults are included.
- Canonical URL defaults are included.

## Environment

`NEXT_PUBLIC_SITE_URL` should be set in production so canonical and Open Graph URLs use the real domain.

## Deferred

- Per-product metadata.
- Per-category metadata.
- Real Open Graph image asset.
- Dynamic product/category social images.
- Structured data.
