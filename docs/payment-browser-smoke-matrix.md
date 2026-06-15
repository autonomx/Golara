# Payment Browser Smoke Matrix

Last updated: 2026-06-14

## Purpose

This document supports `docs/payment-readiness-implementation-roadmap.md` Phase P35.2. It defines the required customer-facing browser smoke coverage before `PAYMENT_BROWSER_SMOKE_TESTS_CONFIRMED="true"` can be set for production gateway checkout.

The executable source of truth is `lib/checkout/payment-browser-smoke-matrix.ts`; the focused guard is `tests/unit/payment-browser-smoke-matrix.test.ts`.

## Required areas

The matrix requires evidence for:

1. Guest cart add/update/remove/clear/subtotal/count behavior.
2. Guest checkout contact, delivery, validation, and server-recomputed order-summary behavior.
3. Signed-in checkout profile/default-address prefill without cross-customer exposure.
4. Provider handoff idempotency for repeated checkout submissions.
5. Provider success return and public order confirmation.
6. Provider cancel, failure, missing-token, and unverified return states that do not mark paid.
7. Public order privacy for provider/payment/timeline details.
8. English LTR and Persian RTL payment/checkout/order copy without mixed-language regressions.
9. Signed-in order history scoped to the current customer session.

## Evidence expectations

Each matrix case lists required evidence examples. Operator evidence may be screenshots, provider session IDs, admin screenshots, public order URLs, test logs, or notes from the target environment. Evidence must not include secrets, full payment card values, private provider credentials, or unredacted customer-sensitive payloads.

## Confirmation rule

Set `PAYMENT_BROWSER_SMOKE_TESTS_CONFIRMED="true"` only after every required case in `paymentBrowserSmokeMatrix` has target-environment evidence.

Do not set this flag based only on unit guards, source guards, documentation guards, or local static route checks.
