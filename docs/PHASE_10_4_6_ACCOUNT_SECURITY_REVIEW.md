# Phase 10.4-10.6 account privacy and security review

This document captures the first privacy and security review for customer account surfaces, order history, saved addresses, session cookies, and phone-based sign-in.

## Current account surfaces

- `/account` shows signed-in profile details and saved address summaries.
- `/account/login` requests and verifies phone sign-in codes.
- `/account/orders` lists orders scoped to the signed-in customer profile.
- `/account/addresses` manages saved delivery addresses scoped to the signed-in customer profile.
- `/cart/checkout` can prefill delivery/contact fields from the signed-in customer profile and default saved address.

## Current protections

- Customer sessions use server-generated opaque tokens.
- Customer session tokens are stored as SHA-256 hashes in the database.
- Customer session cookies are HTTP-only, `sameSite=lax`, path-scoped to `/`, and `secure` in production.
- OTP codes are stored as salted SHA-256 hashes.
- OTP challenges expire and are consumed on successful verification.
- Failed verification attempts increment the challenge attempt count.
- OTP requests have a resend cooldown and rolling request-window limit per destination/purpose.
- Saved address mutations require an active customer session.
- Saved address mutations are scoped by signed-in customer ownership.
- Order-history reads are scoped by signed-in customer ownership.
- Public order status pages still require privacy-safe public lookup tokens.
- Relative return redirects reject protocol-relative or external URLs.

## Risks and mitigations

### Account takeover through OTP abuse

Risk: repeated OTP guessing or excessive requests could weaken phone-based sign-in.

Current mitigations:

- OTP attempt count and max attempts.
- OTP expiry and consumed timestamp.
- Resend cooldown.
- Rolling request-window limit.
- Hashed code storage.

Recommended follow-ups:

- Add IP-level request throttling.
- Add delivery-provider abuse feedback handling.
- Add optional CAPTCHA or challenge only if abuse appears.
- Add audit events for repeated failed verification attempts.

### Data exposure through account pages

Risk: order history and saved addresses expose customer data if session checks fail.

Current mitigations:

- `/account/orders` redirects unauthenticated visitors.
- `/account/addresses` redirects unauthenticated visitors.
- Repository mutations verify address ownership with `customerId`.
- Order-history reads filter by authenticated `customerId`.

Recommended follow-ups:

- Add automated smoke tests for unauthenticated redirects.
- Add private order-detail ownership checks if private account order details are introduced.
- Keep public token order pages separate from authenticated account pages.

### Session cookie handling

Risk: weak cookie configuration could expose sessions.

Current mitigations:

- HTTP-only customer session cookie.
- SameSite Lax.
- Secure in production.
- Server-side token hash lookup.
- Logout revokes active session and clears cookie.

Recommended follow-ups:

- Add session rotation after successful verification.
- Add optional all-device/session revocation later.
- Review deployment proxy HTTPS headers before launch.

### Delivery provider secrets

Risk: message provider webhook tokens or future SMS credentials may leak through logs or client bundles.

Current mitigations:

- Provider configuration is server-side only.
- Message provider lives under server-only module boundaries.
- OTP repository stores provider/reference metadata, not secrets.

Recommended follow-ups:

- Keep provider tokens out of public env names.
- Add deployment secret checklist.
- Avoid logging full provider responses if they include secrets.

## Production launch checklist

Before production customer sign-in is enabled:

1. Configure a production delivery provider or webhook adapter.
2. Set `CUSTOMER_MESSAGE_PROVIDER` away from local-only log delivery.
3. Set a strong `CUSTOMER_OTP_SECRET`.
4. Confirm `ADMIN_SESSION_SECRET` and customer session TTL values are production-ready.
5. Confirm HTTPS is enforced by deployment and proxy configuration.
6. Test unauthenticated redirects for `/account/orders` and `/account/addresses`.
7. Test login, resend cooldown, invalid code, expired code, and logout flows.
8. Test order history with two different customer profiles to confirm scoping.
9. Test saved address update/delete with two different customer profiles to confirm ownership checks.
10. Review logs to ensure OTP codes are not emitted in production delivery mode.

## Current non-goals

- This review does not add automated tests.
- This review does not add a concrete SMS provider adapter.
- This review does not add IP-level throttling.
- This review does not add customer profile editing.
