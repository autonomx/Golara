# Phase 5.44-5.46 home card priority

This bundle uses the ProductCard image priority option on the homepage.

## Added behavior

- First three homepage best-seller product cards pass `priority` to `ProductCard`.
- Product card layout and styling remain unchanged.
- Category cards are unchanged.

## Why

The first best-seller cards are likely to be visible early on desktop/tablet layouts, so their images are better candidates for eager loading than lower cards.

## Deferred

- Measuring actual LCP after deployment.
- Replacing the decorative hero panel with a real optimized image if desired.
- Automated Lighthouse CI.
