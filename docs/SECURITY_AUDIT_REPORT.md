# Security Audit Report and Roadmap

This document tracks the June 2026 security audit of the **Golara** codebase. The audit covers authentication, authorization, session management, CSRF and same-origin protections, public abuse controls, payment/order security, input validation, media handling, browser headers, secrets, data privacy, logging, and automated security gates.

Status values:

- **Fixed** — merged and covered by tests or CI gates.
- **Partial** — meaningful controls exist, but material audit work remains.
- **Deferred** — not yet implemented.
- **Accepted** — intentionally accepted risk with rationale.

## Current audit position

The project has completed the first major hardening pass and has moved into the remaining high-risk authorization, session, abuse-control, and payment/order verification work. The audit report previously marked several Phase 6, 7, 9, 10, 11, and 12 items as deferred even after they were fixed; this update reconciles that status through PR #598.

## Recently completed security work

| Area | Status | Evidence |
| --- | --- | --- |
| Customer account same-origin guard | **Fixed** | PR #583 added same-origin protection to customer OTP/profile/address mutations. |
| Admin login throttle and origin boundary | **Fixed** | Admin login has throttling and same-origin checks. |
| Public API abuse and payment guards | **Fixed** | PR #588 hardened OTP abuse tests, public order token handling, webhook duplicate replay handling, raw webhook body validation, and payment webhook token matching. |
| Safe return paths and JSON-LD escaping | **Fixed** | PR #589 added centralized same-origin return-path normalization and hardened JSON-LD serialization. |
| Media magic-byte validation | **Fixed** | PR #590 rejects spoofed uploads and unsupported/SVG/script payload bytes before local or Cloudinary storage. |
| Production secret readiness | **Fixed** | PR #591 blocks missing, short, and default/placeholder production admin/customer secrets. |
| Account mutation log redaction | **Fixed** | PR #592 redacts caught account profile/address errors. |
| Homepage visual polish | **Non-security fixed** | PR #593 softened homepage background transition. |
| Checkout/cart log redaction | **Fixed** | PR #594 redacts caught cart and checkout mutation errors. |
| Public API allowlist gate | **Fixed** | PR #595 inventories `app/api/**/route.ts`, keeps only signed payment webhooks public, and requires auth/token/signature boundaries elsewhere. |
| Media upload allowlist gate | **Fixed** | PR #596 locks upload size/type/signature/host controls into CI. |
| Secret scanning gate | **Fixed** | PR #597 adds committed-secret scanning to unit CI. |
| Server-action CSRF guard gate | **Fixed** | PR #598 broadens CSRF/server-action scanning to all `app/**` server-action modules and wires it into runtime/unit CI. |

## Phases left

### Phase A — Admin RBAC and owner-only mutation authorization

**Priority:** Critical  
**Status:** Deferred  
**Goal:** prove every sensitive admin mutation enforces the correct role on the server, not just in UI.

Remaining work:

1. Inventory all admin server actions and admin API mutations.
2. Classify each action by required role: `staff`, `owner`, or service-token/webhook-only.
3. Require `assertAdminAuthenticated()` or `assertAdminRole(...)` in each mutation path.
4. Add negative tests for lower-role denial, especially owner-only actions.
5. Expand source gates to prevent new high-risk admin mutations without explicit role requirements.

High-risk targets:

- Staff/user management.
- Payment operations, captures, refunds, and settlement controls.
- Provider settings and credentials.
- Order status and fulfillment mutations.
- Media deletion and destructive catalog mutations.
- Admin diagnostics and audit-log access.

### Phase B — Session lifecycle hardening

**Priority:** High  
**Status:** Deferred  
**Goal:** tighten admin/customer session creation, logout, expiry, and fixation resistance.

Remaining work:

1. Verify admin logout reliably clears the session cookie.
2. Rotate admin session cookie value after successful login.
3. Review customer and admin session lifetimes.
4. Add session expiry and renewal tests.
5. Add cross-customer negative tests for account/address/order access.

### Phase C — Public abuse controls and throttling

**Priority:** High  
**Status:** Partial  
**Goal:** prevent spam, enumeration, resource exhaustion, and brute-force access against public flows.

Completed:

- OTP abuse regression coverage exists.
- Public order token handling was hardened.
- Webhook raw-body/replay/idempotency boundary was improved.
- Public API allowlist CI gate exists.

Remaining work:

1. Inquiry/contact form rate limiting, content-size validation, and spam controls.
2. Public order lookup throttling and lockout after repeated failures.
3. Cart creation throttling and abandoned-cart cleanup controls.
4. Product/category query complexity and pagination limits.
5. Abuse-event logging that avoids customer-data leakage.

### Phase D — Payment and order integrity

**Priority:** Critical/High  
**Status:** Partial  
**Goal:** ensure payment state transitions cannot be replayed, spoofed, over/underpaid, cross-owned, or silently mis-audited.

Completed:

- Payment webhook signature validation exists.
- Duplicate webhook replay rejection has regression coverage.
- Public webhook routes are allowlisted and required to retain signature/raw-body validation.

Remaining work:

1. Amount and currency reconciliation against the canonical order total.
2. Order ownership checks for storefront payment confirmation and public order views.
3. Idempotency-key enforcement for payment/order creation boundaries.
4. Provider callback payload minimization and response sanitization.
5. Complete audit trail for payment, settlement, refund, and webhook outcomes.

### Phase E — Data privacy and response exposure audit

**Priority:** High  
**Status:** Partial  
**Goal:** verify customer and internal operational data never leaks through pages, APIs, logs, diagnostics, or search.

Completed:

- Account, cart, and checkout caught-error logs use redaction helpers.
- Redaction source gates cover key customer-input mutation paths.

Remaining work:

1. Audit storefront pages and public APIs for exposed emails, phone numbers, addresses, internal IDs, payment metadata, and admin fields.
2. Mask or minimize order/customer fields in public views.
3. Protect admin diagnostic/provider pages with owner-only access.
4. Add production-safe error response tests that hide stacks/internal details.
5. Add search response allowlist tests for public/catalog endpoints.

### Phase F — Logging, audit trails, and incident readiness

**Priority:** Medium/High  
**Status:** Partial  
**Goal:** make security-relevant events traceable without leaking sensitive data.

Completed:

- Redacted error logging exists for several customer mutation surfaces.

Remaining work:

1. Structured admin login/audit events with safe metadata.
2. Authorization-failure logging without secret/customer leakage.
3. Payment/webhook event logging with signature/idempotency results.
4. OTP abuse and throttle-event logging.
5. Media upload/delete logging with actor and result.
6. Incident response runbook for investigation, containment, and notification.

### Phase G — Input validation and injection safety follow-up

**Priority:** Medium/High  
**Status:** Partial  
**Goal:** finish the non-upload validation and rendering audit.

Completed:

- Safe return-path normalization exists.
- JSON-LD serialization escapes script-breaking and HTML-sensitive characters.

Remaining work:

1. Rich text/Markdown renderer audit.
2. Product/category/admin content rendering audit for unsafe HTML paths.
3. Search/filter schema allowlists.
4. Email/SMS/template escaping checks.
5. Uploaded-image metadata stripping policy, if required by production privacy goals.

### Phase H — Media deletion, path traversal, and malware policy

**Priority:** Medium  
**Status:** Partial  
**Goal:** finish upload lifecycle controls beyond upload-time MIME/signature checks.

Completed:

- Upload size/type allowlist and magic-byte sniffing exist.
- SVG/script uploads are rejected.
- Media upload allowlist CI gate exists.

Remaining work:

1. Path traversal checks for local media paths and deletion helpers.
2. Media deletion authorization and ownership checks.
3. Cloudinary/server credential isolation verification.
4. Production malware-scanning decision: integrate scanning or document accepted risk.
5. Optional metadata stripping for privacy-sensitive images.

### Phase I — Browser/header deployment verification

**Priority:** Medium  
**Status:** Partial  
**Goal:** ensure security headers are present in production-like responses, not only in config.

Completed:

- Baseline headers and CSP exist in the app configuration.
- Header config tests exist.

Remaining work:

1. Production-like route header smoke tests for storefront and admin routes.
2. CSP tightening plan to remove/reduce `unsafe-inline` where practical.
3. CSP report endpoint or monitoring decision.
4. Admin/storefront header parity verification.

### Phase J — Dependency and supply-chain gate

**Priority:** Medium  
**Status:** Deferred  
**Goal:** prevent known critical/high dependency vulnerabilities and supply-chain regressions.

Remaining work:

1. Add dependency audit gate with a clear severity threshold.
2. Decide allowlist/expiration policy for unavoidable advisories.
3. Ensure lockfile changes are reviewed by CI.
4. Consider license/publisher/package-integrity checks if production risk warrants it.

### Phase K — Security roadmap closeout and documentation

**Priority:** Medium  
**Status:** In progress  
**Goal:** keep security status auditable and aligned with merged code.

Remaining work:

1. Update this document after each security PR.
2. Add owner/reviewer signoff for accepted risks.
3. Link all completed items to PRs or commits.
4. Convert remaining phases into narrowly scoped implementation PRs.
5. Keep all security gates documented in the CI section of the production roadmap.

## Automated gates currently in place

| Gate | Status | Notes |
| --- | --- | --- |
| Secret scanning | **Fixed** | `npm run check:secrets` runs before the unit suite. |
| Public API allowlist | **Fixed** | Public routes are inventoried and must have explicit approval/boundaries. |
| Media upload allowlist | **Fixed** | Size, MIME allowlist, magic-byte checks, SVG rejection, and validated-byte reuse are covered. |
| Server-action CSRF guard scanner | **Fixed** | `check:csrf-guards` runs in runtime and unit CI and scans all `app/**` server-action modules. |
| Deploy-readiness secret checks | **Fixed** | Production admin/customer secrets are checked for presence, length, and placeholder/default values. |
| Redacted logging source guards | **Partial** | Customer mutation paths are covered; admin/provider diagnostics still need broader audit. |
| Dependency audit | **Deferred** | Still needs CI integration and policy. |
| Production route header smoke | **Deferred** | Config tests exist; response-level smoke remains. |

## Recommended next phase order

1. **Phase A — Admin RBAC and owner-only mutation authorization.** This is the highest remaining risk because UI hiding is not a server-side security boundary.
2. **Phase B — Session lifecycle hardening.** Fix logout, rotation, and cross-customer access tests.
3. **Phase D — Payment and order integrity.** Add amount/currency/order-ownership/idempotency verification.
4. **Phase C — Public abuse controls.** Add inquiry/order-lookup/cart/query throttles and lockouts.
5. **Phase E/F — Privacy, diagnostics, and audit trail hardening.** Broaden redaction and operational logging.
6. **Phase H/I/J — Media lifecycle, deployment headers, and dependency gate.** Finish remaining regression gates and accepted-risk documentation.

## Conclusion

The security audit is no longer at the initial discovery stage. A substantial set of hardening controls and CI gates has landed, especially around public API boundaries, upload safety, secret readiness, logging redaction, and server-action CSRF scanning. The remaining highest-risk work is now concentrated in admin RBAC, session lifecycle, public abuse controls, payment/order integrity, and privacy/audit-trail completeness. Each remaining phase should continue as a narrow PR with CI-backed regression coverage.
