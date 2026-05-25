# Performance readiness checklist

Use this checklist before production launch and after major storefront UI changes.

## Build checks

- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run build` passes.
- No source file exceeds the repository file-line guard threshold.

## Image checks

- Product images render on homepage/product/category pages.
- Product image URLs are HTTPS or local registered uploads.
- Hero image renders without layout shift.
- Product cards retain consistent aspect ratio.
- Open Graph image path resolves in production.
- Large uploaded media should be compressed before use.

## Page checks

- Homepage loads without visible layout jumps.
- Category pages render product grids quickly.
- Product pages render detail, checkout, and inquiry sections.
- Public order status page renders without exposing private data.
- Admin dashboard remains usable with realistic product/order/inquiry counts.

## Metadata route checks

- `/sitemap.xml` responds successfully.
- `/robots.txt` responds successfully.
- Sitemap uses production domain from `NEXT_PUBLIC_SITE_URL`.
- Sitemap includes current active product/category URLs.

## Manual Lighthouse targets

Use Lighthouse as a guide, not a hard blocker during development.

Recommended launch targets:

- Performance: 80+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

## Deferred automated coverage

- Add Playwright smoke tests.
- Add automated Lighthouse CI if needed.
- Add image-size validation for uploads.
- Add bundle analysis step for major dependency changes.
