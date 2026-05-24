# Phase 4.2 customer profiles

This phase adds the first data foundation for phone-first customer checkout.

## Added foundation

- `CustomerProfile` Prisma model keyed by normalized phone number.
- `CustomerAddress` Prisma model for saved delivery addresses.
- `lib/customers/customer-repository.ts` with:
  - phone normalization
  - customer profile upsert
  - saved address creation
  - saved address listing

## Scope intentionally deferred

- SMS or OTP verification.
- Customer login/session UI.
- Cart and order draft creation.
- Gateway handoff and verification.
- Admin order management.

## Next phase

Phase 4.3 should add cart/order draft models and reuse the customer profile/address repository when creating checkout drafts.
