# Phase 13.7-13.9 — Quote-only product behavior

This bundle replaces the temporary `price: 0` storefront behavior with an explicit domain-level quote-only product concept.

## Goals

- Represent call-for-purchase products intentionally in seed/catalog data.
- Avoid showing `$0`/`0 IRR` as a product price.
- Prevent quote-only products from being added to the cart.
- Keep this bundle small and avoid a broad database migration until the admin/CMS field model is ready.

## Implemented foundation

- Added optional `requiresQuote` to the `Product` domain type.
- Added `productRequiresQuote(product)` helper.
- Updated `formatPrice(product)` so quote-only products display `Call for purchase`.
- Updated product cards so quote-only products show the inquiry/detail path instead of an add-to-cart button.
- Updated product detail pages so quote-only products hide quantity/cart controls and keep the WhatsApp inquiry CTA.
- Added a server-side cart guard that rejects products with `priceCents <= 0`, so forged form posts cannot add quote-only products to carts.
- Marked Woshe-style quote-only seed products with `requiresQuote: true`.

## Compatibility note

The current Prisma `Product` model does not yet include a persisted `requiresQuote` column. For database-backed products, the server-side guard still treats `priceCents <= 0` as quote-only. For seeded/fallback products, `requiresQuote` documents the intent explicitly.

A future migration can add a real persisted product field and admin form toggle.

## Manual QA checklist

- Quote-only products display `Call for purchase` instead of a numeric zero price.
- Quote-only product cards do not render an add-to-cart form.
- Quote-only product detail pages keep the WhatsApp inquiry CTA.
- Priced products still render add-to-cart controls.
- Forged quote-only add-to-cart posts fail server-side when `priceCents <= 0`.
- Existing cart and checkout behavior for priced products remains unchanged.

## Recommended follow-up

- Add a persisted `requiresQuote` column to Prisma.
- Add an admin product form toggle for quote-only products.
- Use quote-only status in checkout/order admin reporting.
- Localize the `Call for purchase` label through the storefront copy registry.
