# Phase 4.4 payment attempts

This phase adds the first payment lifecycle foundation for checkout orders.

## Added foundation

- `CheckoutPaymentAttempt` Prisma model.
- Relation from `CheckoutOrder` to payment attempts.
- `lib/checkout/payment-provider.ts` with:
  - provider selection from `CHECKOUT_DOMESTIC_GATEWAY_PROVIDER`
  - manual provider adapter
  - payment attempt creation
  - draft order transition to `pending_payment`

## Current provider behavior

The first provider is `manual`:

- Creates a payment attempt with `manual_pending` status.
- Uses the order number as provider reference.
- Does not redirect to an external gateway.
- Keeps the adapter shape ready for domestic gateway providers.

## Rules

- Payment attempts require a database-backed order draft.
- Order total must be greater than zero.
- Only `draft` and `pending_payment` orders can create payment attempts.
- Gateway/provider adapters must not mark orders paid until server-side verification succeeds.

## Scope intentionally deferred

- Live Zarinpal/Zibal/IDPay adapters.
- Gateway redirect routes.
- Gateway callback verification routes.
- Admin payment timeline UI.
- Order paid/failed lifecycle transitions.

## Next phase

Phase 4.5 should add admin order operations: order list, order detail, status timeline, staff notes, and audit-log events.
