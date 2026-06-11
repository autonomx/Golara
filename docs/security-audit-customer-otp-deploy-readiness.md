# Customer OTP deploy readiness guard

Production customer OTP hashing already requires `CUSTOMER_OTP_SECRET` at runtime. This slice also moves that requirement into deploy readiness so a production deploy is blocked before launch when the dedicated customer OTP secret is missing or too short.

## Scope

- Add deploy-readiness blockers for missing or short customer OTP secrets.
- Keep preview/development mode unchanged.
- Add a focused unit guard that runs in `npm run test:unit`.

## Follow-up

Rotate any shared or previously exposed secrets before production launch and keep customer OTP, admin session, payment webhook, and database secrets separate.
