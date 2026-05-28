# Golara Checkout Architecture

## Purpose

This document defines the intended checkout architecture for Golara before payment-provider wiring becomes production-critical.

The goal is to make order/payment/fulfillment behavior explicit, idempotent, and auditable. This avoids a common ecommerce failure mode where order status becomes an overloaded string that means different things in different code paths.

## Scope

Covers:

- cart to order handoff;
- checkout order state machine;
- payment attempt state machine;
- payment webhook idempotency;
- fulfillment state;
- order timeline events;
- inventory/capacity reservation direction;
- known implementation gaps.

Does not yet define a concrete payment vendor adapter.

## Current model

Relevant models:

- `CartSession`
- `CartItem`
- `CheckoutOrder`
- `CheckoutOrderItem`
- `CheckoutPaymentAttempt`
- `CheckoutOrderTimelineEvent`
- `Product`
- `CustomerProfile`
- `CustomerAddress`

The current schema already separates cart, order, payment attempt, and timeline records. That boundary is correct and should be preserved.

## Core principles

1. **Cart is mutable; order is historical.** Once an order is created, order items store product title/code/price snapshots.
2. **Payment attempts are append-only-ish records.** Each provider session, redirect, webhook, or manual payment confirmation updates an attempt and emits timeline events.
3. **Order status should be derived by controlled transitions, not arbitrary writes.** Server actions and future webhooks should call service functions.
4. **Webhook handlers must be idempotent.** Provider reference plus event ID should prevent duplicate mutation.
5. **Fulfillment is not the same as payment.** Paid orders can still be unscheduled; fulfilled orders can have separate courier/delivery status.
6. **Inventory/capacity must exist before real capture.** Same-day floral ecommerce needs product or capacity reservation to avoid overselling.

## Recommended service boundary

Move checkout logic toward a service layer:

```text
lib/checkout/services/
  cart-service.ts
  order-service.ts
  payment-attempt-service.ts
  fulfillment-service.ts
  inventory-reservation-service.ts
```

Server actions should become thin adapters:

```text
server action / route handler
  -> validate request/session
  -> call domain service
  -> revalidate/redirect/respond
```

Domain services should own invariants, status transitions, timeline events, and audit metadata.

## Cart lifecycle

### Cart states

Current `CartSession.status` values should be formalized as:

| Status | Meaning |
| --- | --- |
| `active` | Customer can add/remove/update items. |
| `checkout_started` | Customer has started checkout; cart can still be edited unless locked by order creation. |
| `converted` | Cart was converted into an order. |
| `abandoned` | Cart expired or was abandoned. |
| `expired` | Cart exceeded expiration and should no longer accept writes. |

### Cart to order handoff

Recommended atomic transaction:

1. Read active cart with items and products.
2. Validate product visibility and pricing.
3. Validate delivery date/window and address.
4. Create `CheckoutOrder`.
5. Create `CheckoutOrderItem` snapshots.
6. Create initial `CheckoutOrderTimelineEvent`.
7. Mark cart `converted`.
8. Optionally create a fresh empty cart for continued shopping.

### Retry behavior

If payment fails after order creation, the original order should remain. The customer can create a new payment attempt for the same order instead of converting the same cart again.

Avoid creating duplicate orders from browser refreshes by using one of:

- idempotency key from checkout form submission;
- cart `converted` state check;
- existing draft order lookup for cart/customer/session.

## CheckoutOrder state machine

Recommended `CheckoutOrder.status` values:

| Status | Meaning | Terminal? |
| --- | --- | --- |
| `draft` | Order created but not submitted to payment/manual review. | No |
| `pending_payment` | Awaiting payment completion or manual confirmation. | No |
| `payment_review` | Payment received but requires staff/provider review. | No |
| `paid` | Payment confirmed; order can be scheduled/fulfilled. | No |
| `inquiry` | Manual quote or sales-assisted order path. | No |
| `confirmed` | Staff confirmed order details; may or may not be paid depending on checkout mode. | No |
| `cancelled` | Order cancelled before fulfillment. | Yes |
| `refunded` | Order refunded after payment. | Yes |
| `completed` | Fulfilled and closed. | Yes |

### Legal transitions

| From | To | Trigger |
| --- | --- | --- |
| `draft` | `pending_payment` | Payment attempt created. |
| `draft` | `inquiry` | Manual purchase / quote-required checkout. |
| `pending_payment` | `paid` | Successful provider webhook or verified return flow. |
| `pending_payment` | `payment_review` | Ambiguous provider result. |
| `pending_payment` | `cancelled` | Customer/staff cancel or timeout. |
| `payment_review` | `paid` | Staff/provider confirms payment. |
| `payment_review` | `cancelled` | Staff/provider rejects payment. |
| `inquiry` | `confirmed` | Staff confirms quote/order. |
| `confirmed` | `pending_payment` | Payment requested after quote. |
| `paid` | `completed` | Fulfillment complete. |
| `paid` | `refunded` | Refund complete. |
| `paid` | `cancelled` | Staff cancellation before fulfillment, with refund path if needed. |
| `confirmed` | `cancelled` | Staff/customer cancellation. |

Transitions should be enforced in a service function such as:

```ts
transitionOrderStatus(orderId, nextStatus, context)
```

The service should:

- reject illegal transitions;
- write a timeline event;
- write actor metadata;
- optionally update fulfillment/payment side effects;
- be safe to call from server actions and webhooks.

## CheckoutPaymentAttempt state machine

Recommended `CheckoutPaymentAttempt.status` values:

| Status | Meaning | Terminal? |
| --- | --- | --- |
| `created` | Local attempt created. | No |
| `redirect_pending` | Customer should be redirected to provider. | No |
| `processing` | Provider has accepted/started processing. | No |
| `succeeded` | Provider confirmed successful payment. | Yes |
| `failed` | Provider rejected payment. | Yes |
| `cancelled` | Customer/provider cancelled. | Yes |
| `expired` | Attempt exceeded provider/local expiry. | Yes |
| `refunded` | Payment was refunded. | Yes |
| `review` | Manual/provider review required. | No |

### Payment attempt identity

Each attempt should store:

- provider name;
- provider reference/session ID;
- amount/currency snapshot;
- redirect URL if applicable;
- metadata from provider;
- created/updated timestamps.

Future schema improvement:

- add `providerEventId` or a separate `PaymentWebhookEvent` table for idempotency;
- add `idempotencyKey` for checkout submissions.

## Webhook idempotency

Payment webhook handlers must be idempotent.

Recommended flow:

```text
Receive webhook
  -> verify signature
  -> parse provider event ID
  -> check if event already processed
  -> locate CheckoutPaymentAttempt by providerReference
  -> apply legal payment attempt transition
  -> apply legal order transition if needed
  -> create timeline event
  -> store processed webhook event
  -> respond 2xx
```

If the provider retries the same webhook, the handler should detect the event and return success without duplicate timeline/order mutations.

## Fulfillment state

Current `CheckoutOrder.fulfillmentStatus` should be formalized separately from `CheckoutOrder.status`.

Recommended fulfillment statuses:

| Status | Meaning |
| --- | --- |
| `not_scheduled` | No fulfillment planning yet. |
| `scheduled` | Delivery/pickup date/window confirmed. |
| `preparing` | Florist is preparing the order. |
| `ready` | Order is ready for courier/customer. |
| `out_for_delivery` | Courier has the order. |
| `delivered` | Delivered successfully. |
| `delivery_failed` | Delivery failed and needs staff action. |
| `cancelled` | Fulfillment cancelled. |

Fulfillment updates should also create timeline events.

## Inventory and capacity model

Current `Product.availableToday` is not enough for production because it does not prevent overselling.

Recommended phased model:

### Phase A — capacity buckets

Good enough for a florist before SKU-level inventory exists.

Add a model such as:

```prisma
model FulfillmentCapacityBucket {
  id             String   @id @default(cuid())
  date           DateTime
  deliveryWindow String?
  capacityType   String   // delivery, pickup, same_day, florist_workload
  capacityTotal  Int
  capacityUsed   Int      @default(0)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([date, deliveryWindow, capacityType])
}
```

Checkout reserves capacity before payment capture or before staff confirmation.

### Phase B — product availability/reservation

For specific products or limited arrangements:

```prisma
model ProductInventoryBucket {
  id             String   @id @default(cuid())
  productId      String
  date           DateTime
  quantityTotal  Int
  quantityHeld   Int      @default(0)
  quantitySold   Int      @default(0)
  holdExpiresAt  DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([productId, date])
}
```

### Reservation lifecycle

Recommended reservation statuses:

| Status | Meaning |
| --- | --- |
| `held` | Temporary hold while checkout/payment is in progress. |
| `confirmed` | Payment/staff confirmation consumed the hold. |
| `released` | Hold expired or order cancelled. |

Reservation should have an expiry to prevent abandoned checkouts from blocking capacity.

## Timeline events

Every significant transition should write `CheckoutOrderTimelineEvent`.

Recommended event types:

- `order.created`
- `order.submitted`
- `order.status_changed`
- `payment.created`
- `payment.redirected`
- `payment.succeeded`
- `payment.failed`
- `payment.review_required`
- `fulfillment.scheduled`
- `fulfillment.status_changed`
- `reservation.held`
- `reservation.confirmed`
- `reservation.released`
- `staff.note_added`
- `customer.note_added`
- `order.cancelled`
- `order.refunded`
- `order.completed`

Timeline metadata should avoid storing sensitive full provider payloads unless redacted.

## Manual purchase / quote-required products

Products with `requiresQuote = true` or zero price should not enter the same payment path as fixed-price products.

Recommended behavior:

1. Cart can include quote-required products only if checkout mode supports inquiry/manual review.
2. Order status becomes `inquiry`.
3. Staff updates quote, confirms availability, and optionally requests payment.
4. Payment attempt can be created after quote confirmation.

This avoids capturing payment for products that need sales-assisted pricing.

## Implementation gaps to close

Before real payment provider launch:

- [ ] Extract checkout/order service layer.
- [ ] Enforce legal order status transitions.
- [ ] Enforce legal payment attempt transitions.
- [ ] Add payment webhook idempotency storage.
- [ ] Define cart conversion idempotency key.
- [ ] Define cart clear/converted behavior.
- [ ] Add inventory/capacity reservation model.
- [ ] Add timeline events for all transitions.
- [ ] Add admin/staff order transition UI rules.
- [ ] Add tests for duplicate webhook delivery.
- [ ] Add tests for failed payment retry.
- [ ] Add tests for cart converted only once.
- [ ] Add tests for capacity exhaustion.

## Recommended next code bundles

### Bundle C1 — Checkout status constants and guards

- Add shared constants for order/payment/fulfillment statuses.
- Add transition guard helpers.
- Add unit tests for legal/illegal transitions.
- Do not change UI behavior yet.

### Bundle C2 — Checkout service extraction

- Extract order creation and status updates from server actions/routes into services.
- Keep behavior unchanged.
- Add timeline event helper.

### Bundle C3 — Idempotent payment attempt foundation

- Add idempotency metadata fields or webhook event table.
- Add provider event replay tests.
- Keep provider adapter abstract.

### Bundle C4 — Capacity reservation v1

- Add fulfillment capacity bucket/reservation model.
- Hold capacity during checkout.
- Release on timeout/cancel/failure.

## Open decisions

- Should cart conversion happen before provider redirect or only after provider confirmation?
- Should mixed quote-required and fixed-price carts be allowed?
- What is the maximum reservation hold time?
- Should capacity be global per day/window or category-specific?
- Should refunds be manual only in v1?
- What payment provider will define webhook and idempotency requirements?
