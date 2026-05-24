# Phase 4.14-4.15 order lookup token

This bundle adds a customer-safe public order status path.

## Added foundation

- `publicLookupToken` on `CheckoutOrder`.
- Secure random token generation during order draft creation.
- Product checkout redirects to `/orders/[token]` when a token is available.
- `lib/checkout/public-order-repository.ts` with a limited public lookup.
- `/orders/[token]` public status page.

## Privacy rules

The public status page intentionally exposes only:

- order reference
- order status
- checkout mode
- total amount
- item titles and quantities
- safe timeline titles
- latest payment attempt status

The public page does not expose:

- customer phone
- customer email
- delivery address
- customer notes
- staff notes
- internal audit metadata

## Scope intentionally deferred

- Customer login/session flow.
- Revoking or rotating lookup tokens.
- Expiring public lookup tokens.
- Gateway callback result rendering.
- Full customer account order history.

## Next phase

Add domestic gateway adapter implementation and callback verification behind the existing payment provider seam.
