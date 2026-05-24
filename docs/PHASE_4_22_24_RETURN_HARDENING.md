# Phase 4.22-4.24 return hardening

This bundle hardens the checkout return handler for repeated provider returns and retry behavior.

## Added foundation

- Repeated return calls no longer create duplicate recent timeline events.
- Final paid attempt state is protected from downgrade by later failed/cancelled returns.
- Final failed/cancelled attempt states are not rewritten unless the new result is paid.
- Order status remains paid once paid.
- Return metadata records idempotent no-op style repeats.

## Rules

- Public token remains required for return handling.
- Paid result can promote an order to paid.
- Failed/cancelled result cannot demote a paid order.
- Duplicate recent payment-result events are suppressed within a short window.

## Deferred

- Provider-specific signed verification.
- Dedicated idempotency keys from real providers.
- Admin timeline filtering and diff display.
