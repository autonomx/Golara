# Phase 7.1-7.3 cart foundation

This bundle starts Phase 7 by adding the data model and repository layer for persistent cart/session checkout.

## Added behavior

- Adds `CartSession` and `CartItem` Prisma models.
- Relates cart items to active products.
- Adds a server-side cart repository with:
  - cart token generation
  - configurable cart TTL via `CART_SESSION_TTL_DAYS`
  - create/read active cart helpers
  - add item with quantity merging
  - update item quantity
  - remove item
  - clear cart
  - expire old active carts
- Keeps cart reads filtered to active products/categories.
- Keeps cart quantities bounded to 1-99.

## Current scope

This is a foundation-only bundle. It does not add public add-to-cart buttons, a cart page, checkout conversion, cookies, or UI wiring yet.

## Follow-up bundles

1. Add cart cookie/token helpers and server actions.
2. Add product-page and card add-to-cart actions.
3. Add cart page with quantity updates/removal.
4. Convert cart contents into the existing server-recomputed order draft and PSP flow.
5. Add cart expiry cleanup docs or scheduled cleanup path.

## Notes

The existing order draft repository already accepts multi-item inputs and recomputes totals from active products. Phase 7 should feed cart items into that path rather than duplicating checkout total logic.
