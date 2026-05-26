# Phase 9.7-9.9 customer login and verification UI

This bundle connects the OTP foundation to customer-facing account login.

## Added behavior

- Adds `/account/login` as a dynamic public login page.
- Adds phone-number OTP request form.
- Adds verification-code form after an OTP has been requested.
- Adds server actions for:
  - requesting an OTP challenge
  - verifying an OTP challenge
  - linking or creating the phone-backed customer account
  - creating a customer session
  - setting the HTTP-only customer session cookie
- Updates `/account` to link unauthenticated customers to the real phone login page.
- Supports safe relative `returnTo` redirects after successful verification.
- Keeps development OTP delivery through server logs for now.

## Current scope

This is the first functional customer login path. It still relies on development OTP delivery logging and does not add SMS provider integration, rate limiting, resend cooldown enforcement, or profile/contact editing yet.

## Follow-up bundles

1. Add OTP request/verification rate limiting and resend cooldown copy.
2. Add production SMS provider integration.
3. Add session revocation hardening.
4. Add customer profile/contact editing.
5. Add privacy/security review docs for authenticated account and order access.
