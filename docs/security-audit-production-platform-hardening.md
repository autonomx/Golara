# Production platform hardening audit

This slice closes the first production security audit finding for the public storefront/admin app shell.

## Finding

`next.config.mjs` allowed remote images from any `http` or `https` host and did not define baseline response hardening headers.

## Change

- Remote image configuration now allows only HTTPS Cloudinary images through `res.cloudinary.com`.
- Arbitrary `http` and wildcard remote image hosts are no longer allowed.
- The app now emits baseline headers for all routes:
  - `Strict-Transport-Security`
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
- Deploy readiness unit coverage now locks these platform settings.

## Follow-up audit items

- Add production readiness blocker for missing `CUSTOMER_OTP_SECRET`.
- Add admin sign-in attempt throttling before public production launch.
- Stage a Content Security Policy after confirming all analytics, media, and payment provider domains.
