# Phase 9.10-9.12 authentication hardening

This bundle adds the first OTP request hardening pass.

## Added behavior

- Adds OTP resend cooldown checks before issuing a new challenge.
- Adds a rolling OTP request-window limit per destination and purpose.
- Adds structured request-block reasons for cooldown and rate-limit states.
- Updates OTP request actions to surface cooldown and rate-limit states to the login page.
- Updates `/account/login` copy to explain resend cooldown and request limits.

## Environment knobs

- `CUSTOMER_OTP_RESEND_COOLDOWN_SECONDS` controls the resend cooldown window. Default: `60`.
- `CUSTOMER_OTP_REQUEST_WINDOW_MINUTES` controls the rolling request window. Default: `15`.
- `CUSTOMER_OTP_MAX_REQUESTS_PER_WINDOW` controls max requests per destination/purpose in the rolling window. Default: `5`.

## Current scope

This is a lightweight repository-level and UI-copy hardening pass. It does not add IP-wide throttling, CAPTCHA, production SMS provider integration, customer profile editing, or the full privacy/security review yet.

## Follow-up bundles

1. Add production SMS provider integration.
2. Add customer profile/contact editing.
3. Add privacy/security review docs for authenticated account and order access.
4. Add broader abuse controls such as IP-level throttling if needed.
