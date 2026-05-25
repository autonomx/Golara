# Phase 6.10-6.12 checkout and customer gateway UX polish

This bundle improves customer-facing payment-state copy on the public order status page without changing payment logic.

## Added behavior

- Adds localized public payment status labels for:
  - manual pending
  - payment request created
  - redirect required
  - verified paid
  - failed
  - cancelled
- Improves paid/failed/cancelled result banner copy so customers understand that paid status requires gateway verification.
- Adds a payment guidance panel on `/orders/[token]` based on the latest payment attempt status.
- Adds English and Persian guidance for:
  - staff/manual follow-up
  - gateway redirect still pending
  - verified payment
  - failed/unverified payment
  - cancelled payment
- Keeps privacy-safe public order behavior unchanged.

## Current scope

This is limited to copy and presentation on the public order status page. It does not change gateway request handling, callback verification, order state transitions, admin behavior, or database schema.

## Deferred

- Retry-payment button or new gateway attempt action.
- Public contact/shop support CTA wiring.
- Full Persian storefront localization beyond order/payment status copy.
- Automated browser tests for public order payment-state views.
