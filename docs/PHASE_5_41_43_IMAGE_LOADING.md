# Phase 5.41-5.43 image loading

This bundle improves product image loading hints without changing storefront layout.

## Added behavior

- Product detail hero image is marked `priority`.
- Product detail image `sizes` now includes a mobile fallback.
- Product cards accept optional `priority` prop for future above-the-fold usage.
- Product card image `sizes` now includes desktop, tablet, and mobile breakpoints.

## Current scope

No layout, styling, or product data behavior changes are included.

## Deferred

- Marking homepage above-the-fold cards as priority.
- Image upload compression validation.
- Bundle/image analysis automation.
