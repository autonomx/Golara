# Phase 4.12-4.13 public confirmation bundle

This bundle adds a safe public confirmation step after product-page order draft creation.

## Added foundation

- Product-page order action now redirects to a public confirmation page after draft creation.
- `/orders/confirmation` page displays a non-secret order reference.
- The confirmation page intentionally does not expose customer, address, item, or payment details.

## Privacy rule

Order number display is only an acknowledgement reference. It is not a secure order lookup mechanism and must not expose private order details by itself.

## Scope intentionally deferred

- Secure order lookup token.
- Customer order tracking page.
- Customer authentication/session flow.
- Gateway redirect result page.
- Gateway callback verification display.

## Next phase

Add a non-guessable public lookup token if customers need a self-service order status page.
