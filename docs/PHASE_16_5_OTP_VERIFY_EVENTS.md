# Phase 16.5 — OTP verification event and lockout hardening

## Goal

Record PII-safe verification events and make challenge lockout behavior explicit before adding admin/security observability.

## Implemented

- Added `otp_verify_failed` event creation for:
  - missing or expired challenge;
  - invalid code when attempts remain.
- Added `otp_verify_blocked` event creation for:
  - challenge already at max attempts;
  - invalid code that exhausts max attempts.
- Added `otp_verify_success` event creation for successful verification.
- Added hashed phone/IP/user-agent context to verification events.
- Passed request context from `verifyCustomerOtpAction()` into `verifyCustomerOtp()`.
- Preserved existing login redirect statuses and UI copy.
- Stopped consuming exhausted challenges only because they hit max attempts. Challenges are consumed on success and by expiry cleanup only.

## Event metadata

Verification event metadata is bounded and PII-safe:

- `purpose`
- `reason`
- `remainingAttempts`
- `attemptCount`
- `maxAttempts`

The event row may include:

- `phoneHash`
- `ipHash`
- `userAgentHash`
- `challengeId`

It must not store raw OTP codes, raw phone/IP/user-agent values, provider secrets, session tokens, or raw request headers.

## Lockout behavior

When `attemptCount >= maxAttempts`, verification returns `too_many_attempts` and records `otp_verify_blocked`.

The challenge is not consumed just because it is exhausted. This keeps challenge consumption semantically tied to success and scheduled expiry cleanup, while still blocking further verification through the max-attempt check.

## Follow-up

The next bundle should add PII-safe admin/security observability:

- recent request allowed/blocked counts;
- recent verification failed/blocked/success counts;
- delivery failure count;
- top phone hashes by blocked attempts;
- top IP hashes by blocked attempts;
- no raw phone/IP/user-agent values in admin output.
