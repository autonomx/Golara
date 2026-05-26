# Phase 10 closeout

Phase 10 made the Phase 9 phone-first OTP sign-in path closer to production launch by adding a delivery provider seam, documenting account security posture, and giving signed-in customers a safe profile/contact editing path.

## Completed foundations

- Reusable customer message delivery provider seam.
- Log delivery mode for local and development environments.
- Disabled delivery mode for deployments that must block sign-in until delivery is configured.
- Webhook-style delivery mode for integrating an external message service without coupling auth to one vendor.
- Optional bearer token support for webhook delivery.
- OTP issuance now routes through the message provider seam.
- OTP challenge creation is blocked when delivery fails.
- Delivery provider and provider reference metadata are stored with OTP challenges.
- Account surface inventory for customer-facing authenticated routes.
- Current protection checklist for profile, address, order history, checkout prefill, logout, and OTP login surfaces.
- Account takeover risk review covering OTP attempts, cooldowns, delivery mode, sessions, and phone-number ownership.
- Account-page data exposure review.
- Session cookie handling review.
- Delivery provider secret-handling review.
- Production launch checklist for account security.
- Signed-in customer profile edit page.
- Profile update server action.
- Display name, email, and locale update support.
- Verified phone changes explicitly deferred until a separate verification flow exists.
- Account overview link to profile editing.
- Account, profile, and checkout revalidation after profile changes.

## Current CI baseline

The repository currently validates pull requests with:

- `npm install`
- `npm run check:file-lines`
- `npm run db:generate`
- `npm run typecheck`
- `npm run build`

## Production limitations

Phase 10 closes the account-security foundation, but the production launch still has known limits:

- No concrete SMS vendor adapter has been selected or implemented yet.
- Webhook delivery is a generic provider seam, not a vendor-specific runbook.
- IP-level throttling is not implemented yet.
- Automated smoke tests are still deferred.
- Full Persian storefront localization is still deferred.
- Verified phone-number changes need a future OTP-backed change flow before customers can edit their sign-in phone number.

## Manual launch checklist

Before enabling production customer sign-in:

1. Configure a real delivery path and verify delivery secrets are server-only.
2. Run login, resend cooldown, request-window limit, incorrect-code, expired-code, and logout flows manually.
3. Verify account overview, order history, saved addresses, checkout prefill, and profile editing only show data owned by the signed-in customer.
4. Confirm disabled delivery mode blocks OTP issuance cleanly in environments without a configured provider.
5. Confirm webhook delivery failure does not create a usable OTP challenge.
6. Confirm customer session cookies are HTTP-only and expire as expected.
7. Confirm profile edits revalidate account/profile/checkout surfaces.

## Deferred items

- Concrete SMS provider adapter and production delivery runbook.
- IP-level and broader abuse throttling.
- Automated Playwright or equivalent smoke coverage.
- Verified phone-change flow.
- Field-level login and checkout validation polish.
- Full Persian storefront localization.
- Lighthouse CI.

## Recommended next direction

Phase 11 should focus on localization and Persian storefront readiness without a large framework rewrite.

Recommended Phase 11 track:

1. Add a small copy helper or registry for common customer-facing labels.
2. Keep English fallback behavior intact.
3. Prioritize account/login, cart, checkout, order status, homepage, category, and product surfaces.
4. Add RTL manual QA notes for customer-facing pages.
5. Defer a full i18n framework migration until the copy surface demands it.
