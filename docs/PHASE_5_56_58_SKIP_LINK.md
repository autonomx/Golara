# Phase 5.56-5.58 skip link

This bundle adds a skip-to-content foundation for public pages.

## Added behavior

- New `SkipLink` component.
- Root layout renders the skip link before page content.
- Homepage has `id="main-content"` and `tabIndex={-1}` on `<main>`.
- Category pages have `id="main-content"` and `tabIndex={-1}` on `<main>`.
- Product pages have `id="main-content"` and `tabIndex={-1}` on `<main>`.
- Public order status pages have `id="main-content"` and `tabIndex={-1}` on `<main>`.

## Current scope

This targets public storefront and customer order pages. Admin pages can be wired in a follow-up pass.

## Deferred

- Admin skip-link targets.
- Locale-specific skip-link copy.
- Automated keyboard navigation tests.
