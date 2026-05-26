# Phase 8.7-8.9 customer order history

This bundle adds the first authenticated customer order-history page.

## Added behavior

- Adds `/account/orders` as a dynamic account page.
- Requires an active customer session cookie.
- Redirects unauthenticated customers back to `/account?status=session-required`.
- Lists orders connected to the signed-in customer profile.
- Shows order number, created time, order status, fulfillment status, payment summary, item count, total, and top line items.
- Links to the existing privacy-safe public order status page when a public lookup token exists.
- Adds empty and database-unavailable states.

## Current scope

This page uses the existing customer session foundation. It does not add real login yet, saved-address editing, account-aware checkout prefill, or a private order-detail page.

## Follow-up bundles

1. Add saved address/contact management.
2. Add account-aware checkout prefill.
3. Choose or implement the phone-first login flow that creates real customer sessions.
4. Add privacy/security review docs for authenticated order access.
