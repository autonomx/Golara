# Phase 9.1-9.3 customer authentication decision

This bundle documents the recommended authentication direction before adding real customer sign-in behavior.

## Recommendation

Use a phone-first OTP authentication path as Golara's primary customer authentication model.

Why this fits Golara:

- The existing customer profile model is already phone-first.
- The checkout flow already requires phone contact details.
- The Iran-market checkout direction makes phone-first identity a practical default.
- It keeps customer accounts lightweight while preserving the option to add email/passwordless or OAuth later through the `CustomerAccount.provider` seam.
- It can create sessions using the existing hashed `CustomerSession` model and HTTP-only customer session cookie.

## Phase 9 implementation path

### Phase 9.4-9.6 — OTP request and verification model

Planned:

- Add an OTP challenge model with hashed codes, expiry, attempt count, and consumed timestamp.
- Add repository helpers for issuing, verifying, consuming, and expiring challenges.
- Add a notification-provider seam for development logs and production SMS providers.

### Phase 9.7-9.9 — Customer login/register UI

Planned:

- Add `/account/login` phone entry page.
- Add verification code step.
- Create or link the `CustomerProfile` and `CustomerAccount` record after successful verification.
- Create a customer session and set the HTTP-only session cookie.
- Redirect back to account, checkout, or order-history surfaces.

### Phase 9.10-9.12 — Auth hardening and account polish

Planned:

- Rate-limit OTP requests and verification attempts.
- Add resend cooldown copy.
- Add session revocation hardening.
- Add profile/contact editing.
- Add privacy/security review docs for authenticated order and address access.

## Deferred auth options

The following options remain viable later through the provider seam but are not recommended as the first production path:

- Passwordless email: useful later, but less aligned with phone-first checkout.
- OAuth/social login: useful for convenience, but not required for order history.
- Clerk/Supabase/Auth.js: useful if the deployment requires managed auth, but adds vendor/runtime constraints.
- Custom password login: not recommended as the first path because it adds password reset, storage, and support burden.

## Non-goals for this bundle

- No runtime login behavior.
- No OTP generation yet.
- No SMS provider integration yet.
- No schema changes yet.
