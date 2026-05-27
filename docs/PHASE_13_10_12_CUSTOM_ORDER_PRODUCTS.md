# Phase 13.10-13.12 — Custom-order product persistence

This bundle makes custom-order product behavior a persisted catalog setting.

## Implemented foundation

- Adds `requiresQuote Boolean @default(false)` to the Prisma `Product` model.
- Seeds the persisted flag from the Woshe-style fallback catalog.
- Maps the persisted flag into the storefront product shape.
- Adds an admin product-form toggle named `Manual purchase`.
- Writes the flag in product create and update actions.
- Blocks cart add for products where the persisted flag is enabled.
- Keeps zero-price products blocked as a compatibility fallback.

## Behavior

Products with the custom-order flag are displayed as inquiry-first products instead of regular cart checkout products. This lets the store keep premium or quote-dependent arrangements visible without treating them as normal checkout items.

## Manual QA checklist

- Create or edit a product in admin and enable `Manual purchase`.
- Confirm the product card does not show add-to-cart controls.
- Confirm the product detail page keeps the inquiry/WhatsApp path.
- Confirm a direct cart form post for that product is rejected server-side.
- Confirm normal priced products still add to cart and checkout normally.
- Run `npm run db:generate` after the schema change.
- Run `npm run db:push` in local/staging before relying on the new column.
