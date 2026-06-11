# Customer OTP runtime secret guard

This security-audit slice removes the production fallback from customer OTP hashing.

## Change

- Production customer OTP hashes now require `CUSTOMER_OTP_SECRET`.
- Preview, development, and test modes can still use the existing local fallback so local workflows remain compatible.
- The dedicated OTP secret should be a high-entropy value and should not reuse the admin session secret.

## Follow-up

The deploy-readiness test file still needs a separate readiness-gate slice once the connector allows the env-matrix test update. The runtime path now fails closed in production even before that readiness warning lands.
