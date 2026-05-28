# Golara Customer Account Architecture

## Purpose

This document defines the production customer-account and OTP-authentication architecture for Golara before public OTP launch.

The immediate goal is to close abuse risks around phone-first login, especially SMS toll fraud, brute-force verification, phone enumeration, and resend spam. The longer-term goal is to keep customer identity, sessions, profile ownership, and order access auditable and safe as checkout expands.

## Scope

Covers:

- customer profile and account ownership;
- OTP request flow;
- OTP verify flow;
- customer session creation and revocation;
- abuse risks;
- required throttles;
- lockout/backoff policy;
- user-safe error copy;
- observability and audit metadata;
- implementation phases.

Does not select a concrete SMS provider. Provider integration remains behind the existing customer-message provider seam.

## Current model

Relevant schema models already exist:

- `CustomerProfile`
- `CustomerAccount`
- `CustomerSession`
- `CustomerOtpChallenge`
- `CustomerAddress`
- `CheckoutOrder`

The current model has the right broad shape:

- `CustomerProfile` owns customer phone, locale, profile details, addresses, sessions, and orders.
- `CustomerAccount` links identity providers to a profile.
- `CustomerSession` stores hashed session tokens with expiry and optional IP/user-agent metadata.
- `CustomerOtpChallenge` stores destination, code hash, purpose, attempt count, max attempts, expiry, consumed timestamp, and provider metadata.

The main missing production piece is persistent, queryable abuse telemetry and throttling across destination, IP, and challenge verification attempts.

## Principles

1. **Never reveal account existence.** Request and verify copy must not confirm whether a phone is registered.
2. **Throttle before provider delivery.** Request guards must run before an SMS/webhook provider is called.
3. **Hash abuse identifiers.** Store normalized phone/IP/user-agent hashes for security events; avoid storing raw IPs in throttle records.
4. **Consume OTP only on success.** Failed attempts increment counters and can lock the challenge, but should not consume the challenge.
5. **Sessions are separate from OTP challenges.** Successful OTP verification creates/reuses customer profile/account records and creates a customer session.
6. **Order/profile access is ownership-scoped.** Authenticated routes must only read/write profile, address, and order records belonging to the active customer session.
7. **Operations need visibility without PII exposure.** Admin/security summaries should show counts and redacted/hash identifiers only.

## OTP request flow

```text
Customer enters phone
  -> normalize phone
  -> derive phoneHash
  -> derive ipHash from request headers
  -> derive userAgentHash when available
  -> evaluate OTP request guard
  -> if blocked, record blocked event and return generic safe copy
  -> create CustomerOtpChallenge with hashed code and expiry
  -> record otp_request_allowed event
  -> send via configured message provider
  -> if provider send fails, record delivery failure and do not imply account status
  -> show generic next-step copy
```

### Request guard inputs

- normalized destination phone;
- phoneHash;
- ipHash;
- optional userAgentHash;
- purpose, usually `login`;
- current time;
- recent security events;
- active unexpired challenges.

### Request guard outputs

- `allowed: true` with send context; or
- `allowed: false` with internal reason code and customer-safe message key.

Internal reason codes should be specific for observability, but customer-facing copy should remain generic.

## OTP verify flow

```text
Customer submits phone/challenge/code
  -> normalize phone
  -> locate latest active challenge for destination/purpose or explicit challenge token
  -> if no valid challenge, return generic invalid/expired copy
  -> check challenge expiry, consumedAt, and lockout state
  -> evaluate verify guard for max attempts and lockout
  -> compare submitted code with codeHash
  -> on mismatch: increment attempt count, record failed verify event, maybe lock challenge, return generic copy
  -> on success: mark challenge consumed
  -> create or load CustomerProfile
  -> create or load CustomerAccount(provider=phone)
  -> update phoneVerifiedAt/lastLoginAt
  -> create CustomerSession with hashed token, expiry, ipHash/userAgent metadata
  -> set HTTP-only session cookie
  -> record otp_verify_success event
  -> redirect to safe return path
```

## Session creation and revocation

### Creation

A successful OTP verification creates a `CustomerSession` with:

- `customerId`;
- `tokenHash` only, never raw token;
- provider such as `customer` or `phone`;
- optional `userAgent` or `userAgentHash` depending on schema phase;
- optional `ipHash`;
- `expiresAt`;
- `revokedAt: null`.

### Lookup

Authenticated customer routes should:

1. Read the HTTP-only session cookie.
2. Hash the token.
3. Load unexpired, unrevoked session.
4. Join to `CustomerProfile`.
5. Scope profile/address/order queries to `customerId`.

### Revocation

Logout and security workflows should mark `revokedAt` and clear the cookie. Future account-security UI can revoke all sessions for a customer.

## Profile and account ownership

Customer-owned data includes:

- profile display name, email, locale;
- delivery addresses;
- order history;
- order status lookup when attached to the customer profile.

Ownership rule:

```text
active CustomerSession.customerId must equal target record.customerId
```

Public order-token lookup can remain available, but authenticated order-history pages must use session ownership rather than public lookup token alone.

## Abuse risks

| Risk | Failure mode | Required mitigation |
| --- | --- | --- |
| SMS toll fraud | Attacker requests many OTPs to expensive destinations. | Per-phone, per-IP, phone+IP, cooldown, daily destination cap, provider failure logging. |
| Brute-force verify | Attacker guesses OTP codes for a challenge. | Max attempts per challenge, failed-attempt events, lockout/backoff. |
| Phone enumeration | Request/verify errors reveal whether a phone has an account. | Generic copy and same visible flow for known/unknown phones. |
| Resend spam | Legit or malicious users hammer resend. | Cooldown between sends and rolling request windows. |
| Distributed abuse | Many IPs attack one phone or many phones from one IP range. | Phone/day and IP/window limits, security-event aggregation. |
| Operational blind spots | Staff cannot see attack patterns. | PII-safe admin/security summaries and event counts. |

## Required throttles

Initial production thresholds should be configurable constants, not scattered literals.

| Throttle | Suggested default | Purpose |
| --- | --- | --- |
| Per phone request window | 3 requests / 10 minutes | Stops repeated sends to one destination. |
| Per phone daily cap | 8 requests / day | Limits toll-fraud spend per destination. |
| Per IP request window | 10 requests / 10 minutes | Blocks broad request floods. |
| Per phone+IP request window | 3 requests / 10 minutes | Blocks a single client hammering one destination. |
| Cooldown between sends | 60 seconds | Prevents resend spam. |
| Verify attempts per challenge | 5 attempts | Blocks brute-force guessing. |
| Failed verify lockout | 10 to 15 minutes | Slows repeated attacks after too many failures. |

These values are starting points. Production should tune them against delivery provider cost, expected customer behavior, and observed security events.

## Recommended persistence model

Phase 16.2 should add a persistent append-only event model before request/verify throttling logic becomes complex.

Recommended Prisma model:

```prisma
model CustomerAuthEvent {
  id            String   @id @default(cuid())
  eventType     String
  phoneHash     String?
  ipHash        String?
  userAgentHash String?
  challengeId   String?
  metadata      Json?
  createdAt     DateTime @default(now())

  @@index([phoneHash, eventType, createdAt])
  @@index([ipHash, eventType, createdAt])
  @@index([challengeId, eventType, createdAt])
  @@index([eventType, createdAt])
}
```

Recommended event types:

- `otp_request_allowed`
- `otp_request_blocked`
- `otp_delivery_failed`
- `otp_verify_failed`
- `otp_verify_blocked`
- `otp_verify_success`
- `customer_session_created`
- `customer_session_revoked`

`metadata` should contain bounded operational details such as reason codes, purpose, channel, provider, and coarse request source. Do not store raw OTP codes, raw IPs, raw bearer tokens, provider secrets, or full request headers.

## Hashing and normalization

### Phone normalization

Phone normalization should be centralized in a helper used by request, verify, customer profile linking, and event logging.

Minimum behavior:

- trim whitespace;
- normalize local digit variants if needed;
- remove formatting characters;
- preserve or derive country code according to supported market rules;
- reject impossible lengths before provider delivery.

### Hashing

Hash phone/IP/user-agent identifiers with a server-side secret pepper.

Recommended helper:

```text
hashCustomerAuthIdentifier(kind, normalizedValue)
```

The `kind` prefix prevents cross-context hash reuse. Example logical inputs:

- `phone:+98912...`
- `ip:203.0.113.10`
- `ua:Mozilla/...`

Use a deployment secret such as `CUSTOMER_AUTH_HASH_SECRET`. Production should fail closed if persistent throttling is enabled without the hash secret.

## Lockout and backoff policy

### Request backoff

- If within cooldown, return generic resend-later copy.
- If over rolling phone or phone+IP limit, block until the window expires.
- If over daily phone cap, block until the daily window expires.
- If over IP rolling limit, block with generic temporary-unavailable copy.

### Verify lockout

- Increment challenge `attemptCount` on each wrong code.
- Block verification when `attemptCount >= maxAttempts`.
- Record `otp_verify_blocked` event.
- Keep the challenge unconsumed but unusable after lockout.
- A new challenge should not be issued until request throttles permit it.

Future schema can add explicit fields like `lockedUntil` or `blockedReason` if event-derived lockout becomes too expensive or unclear.

## User-safe error copy

Customer-facing messages should be generic and reusable.

| Situation | Safe copy direction |
| --- | --- |
| Request allowed | "If the phone number can receive messages, we sent a verification code." |
| Request throttled | "Please wait before requesting another code." |
| Provider failure | "We could not send a code right now. Please try again later." |
| Invalid code | "The code is invalid or expired." |
| Too many verify attempts | "Too many attempts. Please request a new code later." |
| Expired challenge | "The code is invalid or expired." |

Avoid copy such as "account not found" or "this phone is already registered" in OTP request and verify flows.

## Observability and admin/security summary

Phase 16.5 should add an admin/security summary that shows:

- recent OTP request count;
- recent OTP verify failure count;
- blocked request count;
- blocked verify count;
- delivery failure count;
- top phone hashes by blocked attempts;
- top IP hashes by blocked attempts.

PII policy:

- show hashes or partial phone only;
- never show raw IP address by default;
- never show OTP codes;
- never show provider secrets or raw delivery payloads.

## Implementation phases

### Phase 16.2 — OTP rate-limit model foundation

- Add `CustomerAuthEvent` or equivalent persistent event model.
- Add phone/IP/user-agent normalization and hashing helpers.
- Add indexes for event aggregation windows.
- Add unit tests for normalization and hashing.

### Phase 16.3 — OTP request throttling

- Add `lib/customer-auth/otp-rate-limit.ts`.
- Enforce per-phone, per-IP, per-phone+IP, cooldown, and daily cap limits.
- Record allowed and blocked events.
- Return user-safe errors.

### Phase 16.4 — OTP verification throttling

- Enforce max verify attempts per challenge.
- Add lockout/backoff behavior.
- Record failed, blocked, and successful verification events.
- Keep challenge consumption success-only.

### Phase 16.5 — OTP admin/security observability

- Add PII-safe admin/security summary.
- Update the risk register checklist when request and verify throttles are enforced.

## Open decisions

- Final production SMS provider and country-specific destination policy.
- Whether to store partial phone display for admin diagnostics or rely on hash-only identifiers.
- Whether lockout should be event-derived or explicit on `CustomerOtpChallenge`.
- Whether high-risk IP ranges should require CAPTCHA or staff review in a later phase.
