# Phase 8 closeout

Phase 8 added the customer account and order-history foundation on top of Golara's phone-first customer profiles, public order tokens, and cart checkout flow.

## Completed foundations

- `CustomerAccount` and `CustomerSession` Prisma models.
- Customer account relation to the existing phone-first `CustomerProfile` model.
- Provider/provider-account identity seam without locking a final auth vendor.
- Hashed customer session tokens.
- Session expiry, revocation, provider, user-agent, and optional IP hash fields.
- Account repository helpers for account linking, session creation, session lookup, session revocation, session expiry, and customer order-history lookup.
- HTTP-only customer session cookie helpers.
- `/account` route shell with signed-in profile and saved-address summaries.
- Logout action that revokes the active session and clears the cookie.
- Authenticated `/account/orders` page scoped to the signed-in customer profile.
- Customer order cards with status, fulfillment, payment summary, totals, item count, top line items, and links to privacy-safe public order status pages.
- Customer-owned saved address management under `/account/addresses`.
- Add, update, make-default, and delete address server actions with ownership checks.
- Account-aware cart checkout prefill from the signed-in profile and default saved address.

## Current CI baseline

The repository currently validates pull requests with:

- `npm install`
- `npm run check:file-lines`
- `npm run db:generate`
- `npm run typecheck`
- `npm run build`

## Important limitation

Phase 8 does not implement real customer login yet. The customer account/session model, cookie, route shell, order-history page, address management, and checkout prefill path are ready for a real sign-in provider or phone-first OTP flow, but no public sign-in flow currently creates customer sessions.

## Deferred items

- Real phone-first login or provider-backed sign-in flow.
- Customer profile/contact editing.
- Privacy/security review for authenticated order and address access.
- Field-level checkout validation polish and localization.
- Full Persian storefront localization.
- Lighthouse CI and full Playwright suite.

## Recommended next direction

Phase 9 should decide and implement the real customer authentication path.

Recommended Phase 9 track:

1. Auth provider decision: phone OTP, passwordless email, NextAuth/Auth.js, Clerk, Supabase Auth, or custom provider.
2. Customer login/register route and session creation.
3. Secure logout/session revocation hardening.
4. Account-aware checkout validation and profile/contact editing.
5. Privacy/security review for authenticated account and order access.
6. Basic smoke tests or documented manual QA for login, order history, address management, and checkout prefill.
