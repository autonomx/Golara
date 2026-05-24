# Phase 4.9-4.11 public checkout bundle

This bundle adds the first public order-draft entry point while preserving the Phase 3 inquiry fallback.

## Added foundation

- Public product-page order form.
- Product-page checkout server action.
- Customer profile upsert from checkout form data.
- Saved delivery address creation from checkout form data.
- Server-side order draft creation using current product prices.
- Manual payment attempt creation through the existing provider seam.
- Safe public redirect back to the product page after order draft creation.

## Current behavior

Customers can start an order draft from a product page. The draft appears in the signed-in admin orders list and can be inspected from the admin order detail page.

The public customer is not sent to the admin page. The product page shows a success/failure status through the `checkout` query string.

## Rules

- `DATABASE_URL` is required.
- Customer phone is normalized through the customer repository.
- Totals are recomputed server-side from database product prices.
- The inquiry form remains available as fallback.
- The first payment attempt uses the current configured provider seam, which is manual by default.

## Scope intentionally deferred

- Full cart session.
- Public order confirmation page with secure lookup token.
- Gateway redirect and callback verification.
- Customer account login/session flow.
- Customer-facing order tracking.

## Next phase

Add a safe public order confirmation route with a non-guessable lookup token, then move gateway redirect/verification behind that route.
