# Phase 9 closeout

Phase 9 implemented Golara's first real customer authentication path using phone-first OTP and the Phase 8 customer account/session foundation.

## Completed foundations

- Phone-first OTP selected as the primary customer sign-in model.
- Authentication decision and implementation path documented.
- `CustomerOtpChallenge` Prisma model.
- Salted hashed OTP code storage.
- OTP expiry, consumed timestamp, attempt count, and maximum attempts.
- OTP issue, verify, consume, failed-attempt, and expiry repository helpers.
- Development OTP delivery logging seam.
- `/account/login` phone entry page.
- OTP verification step.
- OTP request and verification server actions.
- Customer profile/account linking after successful verification.
- Customer session creation and HTTP-only customer session cookie set after verification.
- Safe relative return redirects after login.
- `/account` links unauthenticated customers to the real login page.
- OTP resend cooldown checks before issuing new challenges.
- Rolling OTP request-window limit per destination and purpose.
- Structured cooldown and rate-limit request-block reasons.
- Login page copy explaining resend cooldown and request limits.

## Current CI baseline

The repository currently validates pull requests with:

- `npm install`
- `npm run check:file-lines`
- `npm run db:generate`
- `npm run typecheck`
- `npm run build`

## Important limitation

OTP delivery currently uses development server logs unless a future SMS provider is integrated. The login flow is functional for development and staging where logs are available, but production customer login needs a real delivery provider and operational security review.

## Deferred items

- Production SMS provider integration.
- IP-level and broader abuse throttling.
- Customer profile/contact editing.
- Privacy/security review docs for authenticated account and order access.
- Field-level login and checkout validation polish.
- Full Persian storefront localization.
- Lighthouse CI and full Playwright suite.

## Recommended next direction

Phase 10 should make authentication production-ready.

Recommended Phase 10 track:

1. Add a production SMS provider seam and one concrete provider adapter.
2. Add SMS environment configuration docs and local/dev fallback behavior.
3. Add auth privacy/security review docs.
4. Add profile/contact editing for signed-in customers.
5. Add manual QA checklist for login, OTP resend/cooldown, order history, address management, checkout prefill, and logout.
6. Add automated smoke coverage when the test stack is introduced.
