# Phase 4.19-4.21 return flow

This bundle adds a safe return/result scaffold for checkout orders.

## Added foundation

- `lib/checkout/payment-result-handler.ts` applies provider return status to an order.
- `/orders/return` route accepts order number, public token, status, and optional reference.
- The return route requires both order number and public lookup token.
- Latest payment attempt status is updated.
- Order status moves to `paid` only for a paid/success result.
- Payment return timeline events are recorded.
- Provider callback URL construction now points to `/orders/return` when a public token is available.

## Supported normalized statuses

- `paid`
- `failed`
- `cancelled`

## Safety rules

- Order number alone cannot update an order.
- Public token is required.
- Unknown/unsupported status values normalize to `failed`.
- This is a scaffold, not a provider-specific verification implementation.

## Deferred

- Provider-specific verify API calls.
- Signed callback validation.
- Idempotency keys for provider retries.
- Full paid/failed operational workflows.
