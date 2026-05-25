# Phase 6 closeout

Phase 6 turned the Phase 4 payment-provider seam into a production-shaped PSP foundation with gateway request handling, verified callbacks, admin diagnostics, sandbox/test planning, and clearer customer-facing payment states.

## Completed foundations

- `zarinpal` configurable payment provider option.
- Server-side gateway request adapter.
- Environment-driven request, verify, handoff, merchant, description, and amount-conversion settings.
- Checkout handoff redirect when a payment attempt requires customer gateway completion.
- Provider callback routing through `/orders/return`.
- Zarinpal `Status=OK` and `Status=NOK` callback mapping.
- Server-side paid callback verification before marking an order paid.
- Verification failure maps to failed payment instead of trusted paid state.
- Idempotent retry-safe payment attempt and order result handling.
- Manual and `domestic_redirect` fallback providers preserved.
- Admin order detail payment diagnostics.
- Safe bounded provider metadata summaries for staff.
- Sandbox/live configuration checklist.
- Manual sandbox smoke flow.
- Mock callback matrix and deterministic fixtures for future automated tests.
- Localized public payment status labels.
- Customer-facing payment guidance for manual, redirect-pending, verified, failed/unverified, and cancelled states.

## Current CI baseline

The repository currently validates pull requests with:

- `npm install`
- `npm run check:file-lines`
- `npm run db:generate`
- `npm run typecheck`
- `npm run build`

## Production activation checklist

Before enabling live gateway payments, confirm:

- `DATABASE_URL` is configured and migrations/schema are applied.
- `CHECKOUT_DOMESTIC_GATEWAY_PROVIDER=zarinpal` is set only in the intended environment.
- `ZARINPAL_MERCHANT_ID` is present.
- `NEXT_PUBLIC_SITE_URL` points to the public production domain.
- Request, verify, and start URLs match the merchant account environment.
- `ZARINPAL_AMOUNT_MULTIPLIER` matches the provider-required amount unit.
- `CHECKOUT_REQUIRE_PROVIDER_VERIFICATION=true` is enabled before trusting generic paid callbacks.
- A real sandbox/live smoke test confirms request, redirect, callback, verify, repeated callback, and failed callback behavior.
- Admin order diagnostics show expected provider metadata and verification outcomes.

## Deferred items

- Additional PSP adapters such as Zibal or IDPay, only if merchant requirements demand them.
- Retry-payment button / second gateway-attempt flow.
- Full automated Playwright or unit-test coverage for mocked request/verify callbacks.
- Live merchant-dashboard screenshots or provider-specific runbooks.
- Public lookup rate limiting and security review.
- Full cart/session flow.
- Customer accounts and order history.
- Full Persian storefront localization.

## Recommended next direction

Phase 7 should move from single-product order draft checkout toward a real cart/session flow. The PSP foundation is now ready to receive multi-item totals from a cart as long as totals remain server-recomputed before gateway request creation.

Recommended Phase 7 track:

1. Cart data model and server-side cart repository.
2. Add-to-cart actions from product detail/cards.
3. Cart page and quantity updates.
4. Cart-to-checkout flow using the existing order draft and PSP path.
5. Cart expiry/session cleanup.
6. Basic cart smoke tests or documented fallback if test dependencies are still deferred.
