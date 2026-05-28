# Phase 17.4 — Payment status wiring and idempotency foundation

## Goal

Add the first payment idempotency foundation before real provider callbacks are enabled.

## Implemented

- Added `CheckoutPaymentEvent` to the Prisma schema.
- Added a unique idempotency constraint on `provider + idempotencyKey`.
- Added `lib/checkout/checkout-payment-event-service.ts`.
- Added `recordCheckoutPaymentEvent()`.

## Service behavior

`recordCheckoutPaymentEvent()`:

1. requires a database-backed runtime;
2. validates provider, event type, and idempotency key;
3. returns an existing event as `duplicate: true` if the provider/idempotency key was already processed;
4. creates a new payment event for new keys;
5. optionally transitions the payment attempt status through `transitionCheckoutPaymentStatus()`;
6. marks the event `processedAt` after processing.

Payment status writes therefore use the Phase 17.1 transition policy through the Phase 17.2 status mutation service.

## Event model

`CheckoutPaymentEvent` stores:

- `paymentAttemptId`
- `provider`
- `eventType`
- `idempotencyKey`
- optional target `status`
- bounded `metadata`
- `processedAt`
- `createdAt`

## Idempotency policy

Provider callbacks and admin payment workflows should derive a stable idempotency key from provider event identifiers. If a provider does not supply a webhook event ID, use a deterministic key from provider reference + event type + normalized status.

Duplicate provider/idempotency keys should not create another timeline event or status mutation.

## Follow-up

Future payment-provider integration should:

- call `recordCheckoutPaymentEvent()` from callback/webhook handlers;
- map provider statuses to canonical payment statuses;
- add provider-specific signature verification before recording events;
- add integration tests around duplicate callback handling;
- add admin payment tools only through the same service.
