# Production Payment Runbook

Last updated: 2026-06-04

This runbook covers the Phase 31 live checkout setup for Golara payment gateways. It is intentionally compact and should be used with `docs/LAUNCH_AUDIT.md` before production launch.

## Gateway model

- Use **ZarinPal** for Iranian/Toman domestic checkout.
- Use **Stripe Checkout Sessions** for overseas/card checkout.
- Keep inquiry-first/manual/WhatsApp fallback checkout enabled until live payment smoke tests are signed off.

## Required environment settings

Stripe:

- `STRIPE_SECRET_KEY`
- `STRIPE_CHECKOUT_SUCCESS_URL`
- `STRIPE_CHECKOUT_CANCEL_URL`

ZarinPal:

- `ZARINPAL_MERCHANT_ID`
- `ZARINPAL_REQUEST_URL`
- `ZARINPAL_START_URL`
- `ZARINPAL_VERIFY_URL`
- `ZARINPAL_AMOUNT_MULTIPLIER` if provider amount units differ from stored checkout amount units.

Shared checkout settings:

- `CHECKOUT_PAYMENT_PROVIDER` or the deployment-specific payment provider selector must route domestic/Toman checkout to `zarinpal` and overseas/card checkout to `stripe`.
- `CHECKOUT_REQUIRE_PROVIDER_VERIFICATION` should stay enabled for paid live provider returns when operator verification is required.

## Pre-launch checks

1. Confirm production environment variables are present and scoped to the correct deployment.
2. Confirm domestic checkout currency is Toman before selecting ZarinPal.
3. Confirm Stripe success/cancel URLs point back to `/orders/return` or the configured production return route with order, token, provider, status/payment, and checkout session reference parameters.
4. Confirm ZarinPal callback URL points back to `/orders/return` with order, token, provider, `Authority`, and `Status` parameters.
5. Confirm manual/inquiry checkout remains available as a fallback while live payment validation is pending.

## Smoke test checklist

Use low-value test orders only.

1. Place a domestic/Toman checkout and confirm the customer is redirected to a ZarinPal hosted payment page.
2. Cancel or fail the ZarinPal payment and confirm the public order page returns with `result=failed` or `result=cancelled` and the order is not marked paid.
3. Complete a successful ZarinPal payment and confirm provider verification returns a paid result before trusting the order as paid.
4. Place an overseas/card checkout and confirm the customer is redirected to a Stripe Checkout hosted page.
5. Cancel the Stripe Checkout session and confirm the public order page returns with `result=cancelled` and the order is not marked paid.
6. Complete a successful Stripe Checkout session and confirm the public order page returns with `result=paid`; treat webhook/session verification as the production authority once Phase 32 is complete.
7. Repeat one provider return URL and confirm duplicate recent payment-result timeline events are not created.

## Operational notes

- Browser return parsing improves customer UX but must not be the only production trust boundary for provider-paid orders.
- Phase 32 should make webhooks and settlement reconciliation authoritative for payment trust.
- Refunds, voids, and payment operations remain Phase 33 work.
- If provider credentials, callback URLs, or dashboard settings are changed, rerun the smoke checklist before accepting live payment traffic.
