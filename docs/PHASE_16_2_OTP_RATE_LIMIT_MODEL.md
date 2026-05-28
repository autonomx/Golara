# Phase 16.2 — OTP rate-limit model foundation

## Goal

Add persistent rate-limit primitives and safe identifier helpers for OTP abuse prevention without changing the customer login flow yet.

## Implemented

- Added `CustomerAuthEvent` to Prisma schema.
- Added indexes for common aggregation windows:
  - `phoneHash + eventType + createdAt`
  - `ipHash + eventType + createdAt`
  - `challengeId + eventType + createdAt`
  - `eventType + createdAt`
- Added `lib/customer-auth/identity.ts` with pure helpers for:
  - digit normalization;
  - phone normalization;
  - IP normalization;
  - user-agent normalization;
  - keyed hashing for phone/IP/user-agent identifiers.
- Added unit tests for normalization, stable hashing, hash separation by identifier kind, secret sensitivity, and production secret enforcement.

## Privacy boundary

The new `CustomerAuthEvent` model stores hashes and bounded metadata. It should not store raw OTP codes, raw IP addresses, provider secrets, bearer tokens, or full request headers.

## Hash secret behavior

`hashCustomerAuthIdentifier()` uses `CUSTOMER_AUTH_HASH_SECRET` when configured. In production, the helper throws if the secret is missing. In development/test, it falls back to a deterministic dev-only SHA-256 hash so unit tests and local development can run without a secret.

## Follow-up

Phase 16.3 should wire these primitives into OTP request throttling:

- per-phone rolling request window;
- per-phone daily cap;
- per-IP rolling request window;
- per-phone+IP rolling request window;
- cooldown between sends;
- `otp_request_allowed` and `otp_request_blocked` event creation.
