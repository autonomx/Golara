# Phase 6.7-6.9 provider test harness and sandbox docs

This bundle documents the gateway sandbox/test path and adds deterministic mock callback fixtures for Phase 6 payment verification work.

## Current test posture

The repository currently has CI coverage for:

- file length guard
- Prisma client generation
- TypeScript typecheck
- production build

There is not yet a unit-test runner or Playwright browser suite wired into CI. This bundle avoids adding a new test dependency or browser-install step while the payment gateway surface is still being shaped.

## Sandbox configuration checklist

Before enabling a live domestic PSP in production, confirm these values in the merchant dashboard and deployment environment:

- `CHECKOUT_DOMESTIC_GATEWAY_PROVIDER=zarinpal`
- `ZARINPAL_MERCHANT_ID`
- `NEXT_PUBLIC_SITE_URL`
- `ZARINPAL_REQUEST_URL` if using a sandbox/non-default endpoint
- `ZARINPAL_VERIFY_URL` if using a sandbox/non-default endpoint
- `ZARINPAL_START_URL` if using a sandbox/non-default handoff URL
- `ZARINPAL_AMOUNT_MULTIPLIER` for the provider's required unit conversion
- `ZARINPAL_DESCRIPTION`
- `CHECKOUT_REQUIRE_PROVIDER_VERIFICATION=true` before trusting non-manual paid callbacks

## Manual sandbox smoke flow

1. Configure a database-backed environment and seed products.
2. Set gateway environment variables.
3. Create an order from a product page checkout form.
4. Confirm the new payment attempt is `redirect_required` and has a provider reference.
5. Complete or simulate the provider callback to `/orders/return`.
6. Confirm successful callbacks only mark the order paid after server-side verification.
7. Confirm failed/cancelled callbacks do not mark the order paid.
8. Repeat the same callback and confirm the order remains stable.
9. Review admin order detail payment diagnostics for verification outcome and safe metadata.

## Mock callback matrix

The first automated/mocked tests should cover these cases:

| Case | Provider query | Expected result |
| --- | --- | --- |
| Successful paid callback | `provider=zarinpal&Status=OK&Authority=AUTH_OK` | Verify request is called; order becomes paid only if verify succeeds. |
| Provider-declined callback | `provider=zarinpal&Status=NOK&Authority=AUTH_NOK` | Order stays non-paid; latest attempt becomes failed. |
| Missing authority | `provider=zarinpal&Status=OK` | Verification fails; order stays non-paid. |
| Missing merchant config | `provider=zarinpal&Status=OK&Authority=AUTH_OK` without `ZARINPAL_MERCHANT_ID` | Verification fails; order stays non-paid. |
| Failed verify response | `provider=zarinpal&Status=OK&Authority=AUTH_FAIL` | Order stays non-paid; metadata records failed verification. |
| Repeated success callback | same successful callback twice | Second callback is idempotent and does not duplicate state transitions. |
| Repeated failed callback | same failed callback twice | Second callback is idempotent and does not create noisy repeated transitions. |

## Recommended mocked harness path

When adding automated tests, prefer a local mocked route or request interceptor over real gateway calls:

- Set `ZARINPAL_REQUEST_URL` to a local mock endpoint.
- Set `ZARINPAL_VERIFY_URL` to a local mock endpoint.
- Return deterministic request authorities such as `AUTH_OK`, `AUTH_NOK`, and `AUTH_FAIL`.
- Return deterministic verify payloads for success, already verified, and failed verification.
- Assert database state after each callback.

## Deferred

- Adding Playwright or Vitest dependencies.
- CI browser install steps.
- Live PSP credential validation.
- Provider-specific sandbox screenshots or merchant-dashboard instructions until the exact merchant account is available.
