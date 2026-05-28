# Phase 16.3 — OTP request throttling

## Goal

Add a focused OTP request throttle evaluator before wiring SMS delivery to production OTP flows.

This phase is intentionally service-level only. It evaluates recent `CustomerAuthEvent` history and returns an allow/block decision. A later wiring phase should call this service from the OTP request action/route, persist the returned event payload, and only send SMS when the decision is allowed.

## Implemented

- Added `lib/customer-auth/otp-rate-limit.ts`.
- Added default request throttles:
  - 3 requests per phone per 10 minutes;
  - 8 requests per phone per 24 hours;
  - 10 requests per IP per 10 minutes;
  - 3 requests per phone+IP per 10 minutes;
  - 60 second resend cooldown.
- Added `evaluateOtpRequestThrottle()`.
- Added `buildOtpRequestAuthEvent()` for bounded event payload creation.
- Added unit tests for:
  - allowed request with no history;
  - missing phone hash;
  - resend cooldown;
  - phone rolling window;
  - phone daily cap;
  - IP rolling window;
  - phone+IP rolling window;
  - ignoring blocked events when evaluating allowed-send history;
  - ignoring events outside the windows;
  - allowed and blocked event payload construction.

## Event policy

The evaluator only counts `otp_request_allowed` history when deciding whether another provider send should be allowed.

Blocked events are still useful for observability, but they should not make a customer lockout worse by themselves.

## User-safe output

The evaluator returns internal `reasonCode` values and coarse `messageKey` values:

- `otp_request_allowed`
- `otp_request_wait`
- `otp_request_unavailable`

Route/action code should map these message keys to generic, non-enumerating customer copy.

## Follow-up

Phase 16.4 should wire request throttling into the actual OTP request handler:

1. normalize phone/IP/user-agent;
2. compute phone/IP/user-agent hashes;
3. query recent `CustomerAuthEvent` rows for the relevant windows;
4. evaluate the throttle decision;
5. persist `otp_request_allowed` or `otp_request_blocked`;
6. only create/send an OTP challenge when allowed.

Phase 16.5 should then add verification attempt throttling and lockout behavior.
