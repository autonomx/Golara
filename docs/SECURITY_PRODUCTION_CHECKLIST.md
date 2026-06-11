# Security Production Checklist

This checklist is intended for engineers and operators deploying the **Golara** platform to a production environment.  Use it to verify that all critical security controls are enabled and correctly configured.  The items are grouped by category; all items marked **Required** must be satisfied before a production deployment.

## 1. Secrets and Environment (Required)

- [ ] **Set strong admin credentials:** Define `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` with high entropy.  The session secret should be at least 32 characters.  Never reuse demo/default values.
- [ ] **Set customer OTP secret:** Define `CUSTOMER_OTP_SECRET` with adequate length for HMAC operations.  Verify that OTP fallback logic is disabled in production.
- [ ] **Webhook secrets:** Configure unique webhook secrets for each payment provider and environment.  Do not leave webhook secrets empty or shared across providers.
- [ ] **Media provider credentials:** When uploads are enabled, configure Cloudinary/S3 credentials via environment variables and ensure they are not exposed to the client.
- [ ] **Separate env files:** Use a `.env.production` (or equivalent secrets manager) distinct from local/demo `.env` files.  Do not commit secrets to the repository.

## 2. Authentication and Sessions (Required)

- [ ] **Admin auth enabled:** Confirm that `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` are set; otherwise admin authentication will be disabled.【7†L56-L69】
- [ ] **Session cookie flags:** Ensure `httpOnly`, `secure` and `sameSite` flags are set on admin and customer session cookies【6†L80-L85】.
- [ ] **Session rotation:** After successful admin login, rotate the session cookie to mitigate session fixation.
- [ ] **Logout behaviour:** Verify that admin and customer logout endpoints call `clearAdminSession()`/equivalent and remove cookies【6†L92-L94】.
- [ ] **Session lifetime:** Confirm that `ADMIN_SESSION_MAX_AGE_SECONDS` and customer session max‑age values reflect the desired session lifetime and that sessions expire appropriately【7†L5-L8】.
- [ ] **Rate limiting:** Implement throttling on admin login (already present) and customer OTP requests.

## 3. CSRF / Same‑Origin Protection (Required)

- [ ] **Same‑origin guard on all server actions:** Ensure that every cookie‑backed `POST`, `PUT`, `PATCH` and `DELETE` server action calls `assertSameOriginServerAction()` or uses a signed CSRF token.  This includes cart, checkout, inquiry, wishlist and admin mutation actions.
- [ ] **Signed API tokens:** For public API endpoints that cannot enforce same‑origin (e.g., webhooks or external clients), require HMAC signatures and verify them on each request.
- [ ] **Idempotency tokens:** Use idempotency keys for payment and order operations to prevent replay attacks.

## 4. Authorization and RBAC (Required)

- [ ] **Define roles:** Confirm that `owner` and `staff` roles are configured correctly in environment variables (`ADMIN_ROLE`).  Use the helper functions in `admin-auth-core.ts` to create identities.
- [ ] **Restrict mutations:** Audit each admin mutation (orders, products, categories, media, settings) and ensure it calls `assertAdminRole(requiredRole)` with the appropriate role requirement.
- [ ] **Hidden actions:** Do not rely on UI hiding alone; verify that server actions reject unauthorized requests.

## 5. Public Endpoints and Abuse Controls (Required)

- [ ] **Rate limits:** Configure per‑IP and per‑account limits on OTP requests, contact/inquiry forms, cart creation and search endpoints.
- [ ] **Body and query limits:** Enforce maximum body size and restrict query complexity for search/browsing APIs.
- [ ] **Token entropy:** Ensure public order lookup tokens and password reset tokens are long and random (e.g., UUID v4 or secure random base64).
- [ ] **CAPTCHA/PoW:** For publicly exposed forms (contact, inquiry), consider adding CAPTCHA or proof‑of‑work controls.
- [ ] **Logging:** Enable detailed logging for all unauthenticated endpoints to detect abuse patterns.

## 6. Payment and Order Security (Required)

- [ ] **Webhook validation:** Verify HMAC signatures on incoming webhook events and reject invalid signatures.
- [ ] **Replay protection:** Store webhook event IDs and timestamps to detect and reject duplicate or stale events.
- [ ] **Amount/currency checks:** Validate that payment provider payloads match expected order amounts and currency; reject mismatches.
- [ ] **Order ownership checks:** Confirm that payment confirmation endpoints ensure the order belongs to the current customer session.
- [ ] **Hide sensitive data:** Do not expose payment or admin data in storefront responses.

## 7. Input Validation and Encoding (Required)

- [ ] **Sanitize HTML:** Escape or remove unsafe HTML in product descriptions, category names and custom content.  Use a library such as DOMPurify.
- [ ] **Safe Markdown:** Render user‑generated Markdown with a safe renderer that escapes HTML tags.
- [ ] **Query validation:** Implement allowlists for search/filter parameters.  Do not allow direct injection into SQL or ORM queries.
- [ ] **Template escaping:** Escape all user input in email, SMS and webhook templates to avoid injection.
- [ ] **Redirect whitelisting:** Validate `returnTo`/redirect URLs against an allowed list to prevent open redirects.

## 8. Media and Upload Handling (Required)

- [ ] **File type enforcement:** Use MIME sniffing to determine file type server‑side and reject mismatches.  Disallow potentially dangerous types (e.g., executable files, unsanitized SVG).
- [ ] **Size limits:** Enforce a maximum file size for uploads (both client‑side and server‑side).
- [ ] **Path safety:** Normalize and join file paths to prevent path traversal.  Restrict uploads to a designated directory.
- [ ] **Deletion controls:** When deleting media, verify ownership and ensure the path is within the allowed directory.
- [ ] **Credential isolation:** Do not expose Cloudinary/S3 credentials to the client; handle upload presets server‑side.
- [ ] **Malware scanning:** Integrate virus/malware scanning for uploaded files if they will be public.

## 9. Security Headers and Browser Hardening (Recommended)

- [ ] **Content‑Security‑Policy:** Define a strict CSP with nonces/hashes and avoid `unsafe-inline`.  Add a `report-uri`/`report-to` directive for monitoring.
- [ ] **HSTS:** Enable `Strict‑Transport‑Security` with an appropriate max‑age and include subdomains.
- [ ] **X‑Frame‑Options:** Use `DENY` or specify in CSP to prevent click‑jacking.
- [ ] **Referrer Policy:** Adopt a strict referrer policy (e.g. `no-referrer`).
- [ ] **Admin parity:** Ensure admin pages receive the same headers as public pages.

## 10. Logging and Monitoring (Recommended)

- [ ] **Structured logs:** Implement structured logging for admin actions, authorization failures, payment events, OTP requests and media uploads.
- [ ] **Audit trails:** Store immutable audit logs with timestamps, user identifiers and IP addresses.
- [ ] **Abuse detection:** Monitor logs for spikes in OTP requests, failed logins or unusual upload activity.
- [ ] **Alerting:** Set up alerts for repeated authorization failures, webhook signature failures and other high‑risk events.
- [ ] **Incident runbook:** Prepare incident response procedures and ensure on‑call staff know how to access logs and revoke credentials.

## 11. Automated Security Gates (Recommended)

- [ ] **Dependency scanning:** Run `npm audit` or a similar tool in CI and fail builds on high‑severity vulnerabilities.
- [ ] **Static analysis:** Integrate ESLint/TypeScript rules and custom security lint rules to detect insecure patterns.
- [ ] **Secret scanning:** Use secret‑scanning tools on all commits and PRs to catch accidental inclusion of secrets.
- [ ] **Action boundary check:** Run `tools/check-action-boundaries.mjs` or an extended version to ensure all server actions include appropriate guards.
- [ ] **Header tests:** Automate tests that fetch pages and verify required headers are present.
- [ ] **Public endpoint allowlist:** Maintain a list of allowed unauthenticated endpoints and fail CI if new endpoints are added without review.

## 12. Data Privacy and Compliance (Recommended)

- [ ] **Data minimization:** Only collect and store personal data that is necessary for the service.
- [ ] **Privacy notices:** Provide clear privacy policies and obtain user consent where required.
- [ ] **Redaction:** Redact sensitive information in logs and analytics; avoid storing full payment details or PII.
- [ ] **Right to delete:** Implement account deletion and data export functionality in compliance with applicable regulations.

## Final note

This checklist complements the more detailed findings in the security audit report.  All **Required** items must be addressed before launching in production.  The **Recommended** items are strongly advised to reduce risk and ease future maintenance.  Revisit this checklist regularly as new features are added and threat models evolve.
