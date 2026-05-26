# Phase 9.4-9.6 OTP request and verification foundation

This bundle adds the backend foundation for phone-first OTP authentication.

## Added behavior

- Adds `CustomerOtpChallenge` Prisma model.
- Stores OTP codes as salted SHA-256 hashes.
- Tracks destination, purpose, channel, expiry, attempt count, maximum attempts, and consumed timestamp.
- Adds repository helpers for:
  - issuing OTP challenges
  - replacing previous active challenges for the same destination/purpose
  - verifying OTP codes
  - consuming successful challenges
  - incrementing failed attempts
  - expiring old challenges
- Adds development notification logging through `CUSTOMER_OTP_DELIVERY_PROVIDER=log` or unset provider.
- Adds environment knobs:
  - `CUSTOMER_OTP_TTL_MINUTES`
  - `CUSTOMER_OTP_MAX_ATTEMPTS`
  - `CUSTOMER_OTP_LENGTH`
  - `CUSTOMER_OTP_SECRET`
  - `CUSTOMER_OTP_DELIVERY_PROVIDER`

## Current scope

This is a backend-only OTP foundation. It does not add public login pages, verification forms, SMS integration, customer session creation after verification, or rate limiting yet.

## Follow-up bundles

1. Add `/account/login` phone entry and verification step.
2. Link or create customer profile/account after successful verification.
3. Create a customer session and set the HTTP-only session cookie after verification.
4. Add OTP request and verification rate limiting.
5. Add production SMS provider integration.
