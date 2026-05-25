# Phase 6.1-6.3 gateway verification

This bundle starts Phase 6 by turning the Phase 4 payment-provider seam into a real gateway request and callback verification path while preserving manual fallback behavior.

## Added behavior

- Adds `zarinpal` as a configurable domestic gateway provider option.
- Creates a server-side Zarinpal-style payment request when configured with `ZARINPAL_MERCHANT_ID` and `NEXT_PUBLIC_SITE_URL`.
- Redirects the customer to the provider handoff URL when the payment attempt requires a redirect.
- Routes provider callback parameters through `/orders/return`.
- Maps Zarinpal `Status=OK` to a requested paid result and `Status=NOK` to a failed result.
- Verifies paid Zarinpal callbacks server-side before marking an order as paid.
- Treats provider verification failure as a failed payment result.
- Preserves idempotent attempt/order update behavior for repeated callbacks.
- Keeps manual and `domestic_redirect` behavior available as fallback providers.

## Environment variables

- `CHECKOUT_DOMESTIC_GATEWAY_PROVIDER=zarinpal` enables the Zarinpal adapter.
- `ZARINPAL_MERCHANT_ID` is required for live request and verify calls.
- `NEXT_PUBLIC_SITE_URL` is required so callback URLs can be generated.
- `ZARINPAL_REQUEST_URL` can override the payment request endpoint.
- `ZARINPAL_VERIFY_URL` can override the payment verification endpoint.
- `ZARINPAL_START_URL` can override the customer handoff base URL.
- `ZARINPAL_AMOUNT_MULTIPLIER` can convert stored canonical amount units to the provider-required amount unit.
- `ZARINPAL_DESCRIPTION` can override the provider request description.
- `CHECKOUT_REQUIRE_PROVIDER_VERIFICATION=true` prevents generic paid callbacks from marking non-verified providers paid.

## Security posture

- Order totals are still created server-side before any provider request.
- The callback still requires the order number plus public lookup token before any order is updated.
- Paid Zarinpal callbacks are verified server-side before `CheckoutOrder.status` can become `paid`.
- Failed/cancelled provider callbacks do not mark orders paid.
- Callback retries remain idempotent and avoid repeatedly mutating already-final payment attempts.
- Provider metadata remains bounded and avoids storing customer PII.

## Current limits

- This implements the first provider adapter path, not every Iranian PSP.
- The exact PSP production settings must be verified in the merchant dashboard before launch.
- No database schema changes are included in this first Phase 6 bundle.
- No browser/e2e tests are added yet.

## Recommended next bundles

1. Add admin-facing payment attempt diagnostics and provider metadata summaries.
2. Add gateway failure reason display for staff.
3. Add provider-specific test/sandbox documentation after merchant credentials and sandbox behavior are confirmed.
4. Add Playwright coverage for successful, failed, and repeated callback flows using mocked provider endpoints.
