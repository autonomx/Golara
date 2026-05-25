# Phase 7.4-7.6 cart cookie helpers and server actions

This bundle adds the server action layer for cart/session checkout.

## Added behavior

- Adds HTTP-only cart token cookie helpers using the `golara_cart` cookie.
- Aligns cart cookie max age with `CART_SESSION_TTL_DAYS`.
- Adds server actions for:
  - add to cart
  - update cart item quantity
  - remove cart item
  - clear cart
- Reads an existing cart token from the cookie and writes the token when a cart is created.
- Adds safe relative return-path handling.
- Adds cart action status query parameters such as `cart=added`, `cart=updated`, `cart=removed`, `cart=cleared`, and `cart=failed`.
- Revalidates cart/product/category surfaces after cart mutations.

## Current scope

This is still not a UI bundle. Product buttons, cart page, quantity forms, and cart-to-checkout conversion are intentionally deferred to the next Phase 7 bundles.

## Follow-up bundles

1. Wire add-to-cart buttons into product detail and product cards.
2. Add `/cart` with item list, quantity updates, remove controls, clear action, and subtotal.
3. Convert cart contents into the existing order draft and PSP path.
