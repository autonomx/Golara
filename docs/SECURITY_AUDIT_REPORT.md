# Security Audit Report

This document summarizes the results of a multi‑phase security audit of the **Golara** codebase.  The audit was performed in June 2026 and covers authentication, authorization, session management, CSRF and same‑origin protections, rate limiting and abuse controls, payment and order security, input validation, media handling, headers, secrets, data privacy, logging, and automated security gates.  Each finding is categorized by severity and status (Fixed, Accepted, Deferred) and links to the relevant pull request where applicable.

## Phase 0 – Customer account same‑origin guard

**Purpose:** extend the same‑origin boundary used for admin login to all customer account mutations (OTP, profile and address).  PR #583 added `assertSameOriginServerAction()` calls to these server actions and introduced focused unit tests.

**Status:** **Fixed**.  The merged PR ensures that customer OTP requests, OTP verification, profile edits and address mutations call `assertSameOriginServerAction()` before changing state.  The guard compares the submitted `Origin` header to the host/protocol and rejects cross‑origin submissions, while tolerating missing headers【12†L7-L13】.

**Findings:**  The code addition increases protection against CSRF on customer account endpoints.  The helper is reusable and should be applied to other cookie‑backed actions in later phases.

## Phase 1 – Authentication and session boundaries

**Completed:**

- Admin dedicated pages and console routes require login.
- Admin login includes throttling for repeated attempts and same‑origin checking【6†L69-L87】.
- Customer OTP flow uses a dedicated secret and deploy‑readiness checks ensure the secret is present and of adequate length.

**Remaining actions (High):**

| Finding | Description | Severity | Status |
| --- | --- | --- | --- |
| **Admin mutation session checks** | Audit all admin mutation APIs (product/category/order/media/settlement etc.) to ensure they call `assertAdminAuthenticated()` or `assertAdminRole()`.  Currently only the generic helpers exist and there is no guarantee every server action calls them. | Critical | **Deferred** |
| **Admin logout session clearing** | Ensure that the `clearAdminSession()` API reliably deletes the admin session cookie【6†L92-L94】.  Verify that logout endpoints call this function and test that the cookie is removed. | High | **Deferred** |
| **Session rotation** | After successful admin login, rotate the session cookie to prevent session fixation.  This can be done by generating a new cookie value in `createAdminSession()`. | High | **Deferred** |
| **Customer session lifetime and renewal** | Review `ADMIN_SESSION_MAX_AGE_SECONDS` and the analogous customer session lifetime to ensure tokens expire appropriately【7†L5-L8】.  Implement rolling session renewal to prevent indefinite sessions. | Medium | **Deferred** |
| **Access control tests** | Add tests verifying that one customer cannot access another customer’s data (addresses, orders, session) through direct API calls.  Negative tests should exercise unauthorized access paths. | Critical | **Deferred** |

## Phase 2 – CSRF / same‑origin protection for all mutations

**Completed:**

- Same‑origin guard added to admin login and customer account actions (Phase 0)【12†L7-L13】.

**Remaining actions (Critical):**

Apply the same‑origin or signed token requirement to *every* cookie‑backed state‑changing route.  The following route families need explicit protection:

1. **Cart actions:** Adding, updating or removing items should call `assertSameOriginServerAction()`.  If implemented as server actions, these functions should verify the `Origin` header before mutating the cart.
2. **Checkout/inquiry actions:** Checkout submission, order creation and inquiry forms should either require a same‑origin boundary or rely on signed webhooks/API tokens.  Anonymous checkout flows must be rate‑limited and validated.
3. **Wishlist/saved items:** If the project supports wishlists, ensure mutations are same‑origin.
4. **Admin mutations:** All admin product/category/order/media/settings actions must require the admin session and optionally a signed CSRF token.  Without this, an authenticated admin could be tricked into submitting a forged request from another site.
5. **POST, PUT, PATCH, DELETE APIs:** Any state‑changing API using cookies must be audited.  If the endpoint is public, it should accept only signed tokens and be rate‑limited.

## Phase 3 – Public API and abuse controls

Unauthenticated endpoints and public actions can be abused for spam or resource exhaustion.  Recommended controls:

| Endpoint/Action | Potential Abuse | Recommendation | Severity | Status |
| --- | --- | --- | --- | --- |
| **OTP request** | Attackers can request OTP codes repeatedly, causing SMS/email abuse | Implement per‑identity and per‑IP rate limits; enforce minimum intervals between OTP sends; log abuse events | High | Deferred |
| **Inquiry/contact forms** | Forms may be used to send spam or perform injection | Add CAPTCHA or proof‑of‑work; rate limit per IP; validate message content and size | High | Deferred |
| **Public order lookup** | Guessable tokens may expose order details | Ensure order tokens have sufficient entropy; implement throttling and lockout after repeated failures | High | Deferred |
| **Product/category browsing API** | May allow enumeration and heavy queries | Add pagination, limit query complexity and enforce body size limits | Medium | Deferred |
| **Cart creation** | Unauthenticated users could create excessive carts | Rate limit cart creation by IP and cookie; clean up abandoned sessions | Medium | Deferred |
| **Upload/media endpoints** | Could be abused to store arbitrary content | Enforce strong authentication on uploads; limit file size and type; scan for malware | Critical | Deferred |
| **Webhook endpoints** | Accept external calls; risk of abuse if secrets leak | Validate HMAC signatures and reject requests with incorrect signatures; implement replay protection and idempotency | Critical | Deferred |

## Phase 4 – Authorization and RBAC

Admin authentication alone is not enough; each action must check the caller’s role.  The codebase defines roles (`owner`, `staff`) in `admin-auth-core.ts` and includes helpers like `adminRoleMeetsRequirement()`【7†L38-L41】【7†L119-L121】.  The audit identifies the following gaps:

1. **Owner‑only actions:** Payment operations, settlement and high‑risk order mutations should require the `owner` role.  Ensure each server action calls `assertAdminRole('owner')`.
2. **Staff management:** Creating or deleting staff accounts and assigning roles should be limited to owners.  Audit the routes under `app/admin/staff` or equivalent.
3. **Payment operations:** Issuing refunds, capturing payments and managing payout settings require strict RBAC.  Confirm there are no missing checks.
4. **Order mutation actions:** Changing order status, editing order items, or updating shipping details should require at least the `staff` role and sometimes `owner`.
5. **UI vs. server:** Remember that hiding UI elements is not a security control.  Tests must verify that lower roles receive authorization errors when calling restricted server actions.

**Severity:** Critical.  **Status:** Deferred (implementation required).

## Phase 5 – Payment and order security

Payment flows involve external providers and carry high risk.  Observations:

- **Webhook signature validation exists**: The payment webhook code validates HMAC signatures (observed in the repository).  Negative tests ensure invalid signatures are rejected.
- **Remaining tasks:**
  - **Replay protection:** Store webhook event IDs and timestamps to prevent replay attacks.  Reject duplicates or out‑of‑order events.
  - **Idempotency enforcement:** Use idempotency keys when creating payments and orders to avoid double charges.
  - **Amount/currency checks:** Validate that the payment amount and currency match the order; reject mismatches.
  - **Order ownership:** Ensure that payment confirmation endpoints verify the order belongs to the current customer session; do not allow enumeration.【6†L69-L87】 shows how admin sessions set cookies; similar patterns should be used for customer order tokens.
  - **Public token entropy:** Order lookup tokens must be long, random and unguessable; consider using UUIDv4 or strong base64 values.
  - **Response sanitization:** Do not expose payment or admin data in storefront responses.  Ensure that only necessary fields (e.g. status, amount) are returned.
  - **Audit trail:** Record all settlement and payment actions with timestamps, actors and IPs.

**Severity:** Critical/High.  **Status:** Deferred.

## Phase 6 – Input validation and injection safety

Despite using an ORM (Prisma) which reduces SQL injection risk, user input can still cause issues.  The audit recommends:

1. **HTML rendering:** Sanitize product descriptions, category names and rich text fields to prevent XSS.  Avoid using `dangerouslySetInnerHTML` unless sanitized.  Consider libraries like DOMPurify.
2. **Markdown/rich text:** When rendering user‑generated Markdown, use a safe renderer that escapes HTML tags.
3. **Search/filter queries:** Validate and escape search parameters; implement allowlist for filter fields to prevent injection into SQL or Mongo queries.
4. **Email/SMS/webhook payloads:** Escape values included in templates to avoid injection into HTML emails or command contexts.
5. **URL handling:** Validate redirect URLs and ensure they belong to allowed domains; avoid open redirect vulnerabilities.
6. **File metadata:** Strip or sanitize metadata from uploaded files (e.g., EXIF) to avoid leakage of internal paths or GPS coordinates.

**Severity:** High.  **Status:** Deferred.

## Phase 7 – Uploads, media and external resource safety

File uploads and external media present numerous risks.  The following controls are recommended:

| Control | Purpose | Severity | Status |
| --- | --- | --- | --- |
| **MIME sniffing** | Determine file type by inspecting file headers, not just the client‑provided MIME/type.  Reject mismatches. | High | Deferred |
| **Max file size** | Enforce server‑side limits for uploads to prevent resource exhaustion.  Document the limit in configuration. | High | Deferred |
| **SVG sanitization** | Do not allow inline SVG content that could execute scripts.  Either disallow SVG uploads or sanitize them. | High | Deferred |
| **Path traversal prevention** | Ensure that upload paths cannot traverse out of the designated media directory.  Use safe join functions and normalize paths. | Medium | Deferred |
| **Deletion safeguards** | Media deletion actions should ensure the file being deleted belongs to the current user and is within allowed directories.  Avoid unsanitized input in `fs.unlink()` calls. | Medium | Deferred |
| **Credential isolation** | Store Cloudinary or other media provider credentials exclusively on the server; never expose them to the client.  Use environment variables with strong secrets【7†L56-L60】. | Medium | Deferred |
| **Virus/malware scanning** | For public‑facing uploads, integrate a malware scanning service (e.g., ClamAV, S3 AV). | Medium | Deferred |

## Phase 8 – Security headers and browser hardening

The project already uses baseline security headers and a Content‑Security‑Policy (CSP).  Recommendations:

- **Tighten CSP:** Gradually reduce `script-src` allowances by adopting nonces or hashes, remove `unsafe-inline` where possible and specify allowed domains.  Consider adding a `report-uri`/`report-to` directive to collect CSP violation reports.
- **Verify deployment:** Confirm that the same headers are present in production (e.g. Vercel) and that route overrides do not weaken them.  Use automated tests or a CI script to scan response headers.
- **Admin parity:** Ensure admin pages receive the same security headers as storefront pages.
- **Frame options:** Use `X-Frame-Options: DENY` or corresponding CSP directives to prevent click‑jacking.
- **HSTS:** Set `Strict‑Transport‑Security` with a long max‑age to enforce HTTPS.

**Severity:** High.  **Status:** Deferred.

## Phase 9 – Secrets, environment and deploy readiness

The code currently requires `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` to be set; otherwise admin auth is disabled【7†L56-L69】.  Observations:

- **Ensure strong values:** Enforce minimum length/entropy for `ADMIN_SESSION_SECRET`, `ADMIN_PASSWORD` and `CUSTOMER_OTP_SECRET`.  Use a runtime check that fails startup if secrets are weak.
- **Default credentials:** Block known default credentials in production; ensure `.env.example` clearly separates demo values and instructs operators to set real secrets.
- **Webhook secrets:** Require unique secrets for each payment provider’s webhook; do not fall back to a default.
- **Media provider:** Require production media provider credentials (e.g., S3, Cloudinary) when uploads are enabled.
- **Secret scanning:** Integrate secret scanning in CI to catch accidental commits of API keys or secrets.

**Severity:** Critical/High.  **Status:** Deferred.

## Phase 10 – Data privacy and exposure audit

Audit goals:

1. **Personal data leakage:** Ensure customer phone numbers, emails and addresses are never exposed in pages or APIs without proper authorization.  Mask or redact sensitive fields in logs and responses.
2. **Order details:** Protect order details behind unguessable tokens and session checks.  Do not include internal identifiers or payment information in storefront responses.
3. **Admin logs:** Restrict access to audit logs and admin diagnostic endpoints to owners; do not expose them to staff roles.
4. **Internal provider diagnostics:** Remove or protect endpoints that reveal internal provider configuration or error details.
5. **Search endpoints:** Ensure that search APIs return only necessary fields and do not leak private metadata.
6. **Error handling:** In production, hide stack traces and internal error messages; provide generic error responses to clients while logging details server‑side.

**Severity:** High.  **Status:** Deferred.

## Phase 11 – Logging, audit trails and incident readiness

Security is not only prevention; traceability matters:

- **Admin logins:** Record admin sign‑in attempts, including timestamps, IP addresses and throttle status.  Use structured logs and rotate them appropriately.
- **Mutation audit logs:** For each admin mutation, record the actor, action, target, time and outcome.  Store logs securely and make them accessible only to authorized roles.
- **Authorization failures:** Log failed authorization attempts without revealing sensitive details to the client.  Monitor for repeated failures indicating brute‑force attacks.
- **Payment and webhook failures:** Record webhook events, including signature validation results, idempotency keys and responses from payment providers.
- **OTP abuse:** Log OTP request events and throttle triggers.  Use logs to detect abuse patterns.
- **Media uploads:** Log upload attempts, file metadata and scan results.  Record deletion events and actor identity.
- **Incident runbook:** Develop incident response runbooks that outline how to investigate logs, contain breaches and communicate with stakeholders.

**Severity:** Medium/High.  **Status:** Deferred.

## Phase 12 – Automated security gates

After completing the manual audit slices, add automated CI gates to prevent regressions:

| Gate | Purpose | Status |
| --- | --- | --- |
| **Dependency audit** | Run `npm audit` or a curated security audit on dependencies; fail builds on critical vulnerabilities. | Deferred |
| **Secret scanning** | Use tools like GitHub Advanced Security or TruffleHog to detect secrets in commits and PRs. | Deferred |
| **Route mutation auth guard** | Add a script to scan server actions for missing `assertAdminAuthenticated()`, `assertAdminRole()` or `assertSameOriginServerAction()` calls.  Fail CI if a mutation lacks a guard.  The repository already contains `tools/check-action-boundaries.mjs`; extend it to cover admin and storefront actions. | Deferred |
| **CSP/header guard** | Write tests that fetch pages and assert that required headers are present (e.g., via Playwright). | Deferred |
| **Public API allowlist** | Maintain a list of public endpoints; test that no new unauthenticated endpoints are introduced without explicit approval. | Deferred |
| **Upload/media allowlist** | Enforce file type and size checks via automated tests. | Deferred |
| **Deploy‑readiness guard** | Add a CI gate that verifies required secrets are set and fail deployment if not. | Deferred |

## Conclusion

The Golara project has made progress in hardening its authentication and CSRF boundaries, particularly through the recently merged customer account same‑origin guard.  However, many critical and high‑severity items remain outstanding, particularly around admin mutation authorization, CSRF protections across all routes, abuse controls, role‑based access, and secrets management.  The remaining phases outlined above should be addressed systematically, with each item either fixed or formally accepted/deferred and tracked in production.  Comprehensive tests and automated security gates will help ensure future changes do not reintroduce these vulnerabilities.
