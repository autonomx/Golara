# Phase 7.7-7.9 cart page and quantity updates

This bundle adds the first public cart page on top of the Phase 7 cart model and server actions.

## Added behavior

- Adds `/cart` as a dynamic public page.
- Reads the HTTP-only cart token cookie server-side.
- Displays cart item rows with product image, title, code, unit price, quantity, and line total.
- Adds quantity update forms.
- Adds remove item forms.
- Adds clear cart action.
- Adds empty cart state and database-unavailable state.
- Adds cart status banners for add/update/remove/clear/missing/failed states.
- Adds subtotal summary and item count.
- Adds a placeholder `Continue to checkout` link to `/cart/checkout` for the next bundle.

## Current scope

This page is operational for review and cart mutation, but cart-to-checkout conversion is deferred to Phase 7.10-7.12.

## Follow-up bundles

1. Add public add-to-cart buttons/forms to product detail and product cards.
2. Add `/cart/checkout` and convert cart contents into the existing order draft and PSP flow.
3. Clear or mark the cart after successful order draft creation.
