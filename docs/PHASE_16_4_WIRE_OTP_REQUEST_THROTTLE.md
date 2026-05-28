# Phase 16.4 — Wire OTP request throttling

## Goal

Connect the Phase 16.3 OTP request throttle evaluator to the live customer login OTP issuance path.

## Implemented

- Wired `issueCustomerOtp()` through the new `evaluateOtpRequestThrottle()` service.
- Query recent `CustomerAuthEvent` rows by `phoneHash` and optional `ipHash` before provider delivery.
- Persist `otp_request_blocked` events when the throttle blocks a send.
- Persist `otp_request_allowed` events only after provider delivery succeeds.
- Persist `otp_delivery_failed` events when provider delivery fails.
- Pass request context from `app/account/login/actions.ts` into the OTP repository:
  - `x-forwarded-for`
  - `x-real-ip`
  - `user-agent`
- Preserve existing login redirect statuses so the UI does not need broad copy changes in this bundle:
  - `cooldown`
  - `rate_limited`
  - `delivery_failed`
  - `request_failed`

## Event policy

The throttle counts only previous `otp_request_allowed` events as successful sends. Blocked attempts are recorded for observability but do not recursively make future lockout worse.

Delivery failures are also recorded separately as `otp_delivery_failed`; they are not counted as successful sends.

## Privacy boundary

The OTP repository records hashed phone, IP, and user-agent identifiers only. It must not persist raw OTP codes, raw IP addresses, raw user agents, full headers, provider secrets, or bearer/session tokens in `CustomerAuthEvent` metadata.

## Follow-up

Next bundle should focus on OTP verification throttling and lockout behavior:

1. record `otp_verify_failed` and `otp_verify_success` events;
2. record `otp_verify_blocked` when a challenge is exhausted;
3. preserve success-only challenge consumption;
4. add PII-safe admin/security summary after request and verify events are both flowing.
