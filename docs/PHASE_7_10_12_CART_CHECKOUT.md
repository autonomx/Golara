# Phase 7.10-7.12 cart-to-checkout conversion

This bundle connects the Phase 7 cart flow to the existing order draft and PSP path.

## Added behavior

- Adds `/cart/checkout` as a dynamic checkout page.
- Reads the HTTP-only cart token cookie server-side.
- Shows a delivery/contact form for cart checkout.
- Shows an order summary from current cart items.
- Converts active cart items into the existing `createOrderDraft` repository.
- Keeps server-recomputed order totals as the source of truth.
- Creates a payment attempt through the existing PSP provider path.
- Redirects to provider handoff when the payment attempt requires a gateway redirect.
- Redirects to the public order page when manual/fallback payment remains local.
- Clears the cart and cart cookie after a checkout order is successfully created.

## Current scope

This completes the first end-to-end cart-to-order path. Product and card add-to-cart UI wiring remains a follow-up because the cart actions already exist but have not yet been attached to storefront controls.

## Follow-up bundles

1. Wire add-to-cart forms into product detail pages and product cards.
2. Add cart link/count affordances in the header.
3. Add cart checkout polish for localization and field-level validation.
4. Add automated smoke coverage once test dependencies are introduced.
