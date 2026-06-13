# Security Audit Report and Roadmap

This document tracks the June 2026 security audit of the **Golara** codebase. The audit covers authentication, authorization, session management, CSRF and same-origin protections, public abuse controls, payment/order security, input validation, media handling, browser headers, secrets, data privacy, logging, and automated security gates.

Status values:

- **Fixed** — merged and covered by tests or CI gates.
- **Partial** — meaningful controls exist, but material audit work remains.
- **Deferred** — not yet implemented.
- **Accepted** — intentionally accepted risk with rationale.

## Current audit position

The project has completed a broad hardening pass across authorization, session management, public API boundaries, public abuse controls, payment/order integrity, privacy, logging, media handling, input validation, browser headers, secrets, and dependency scanning. This roadmap reconciles the current security-audit status through PR #629 / main commit `18bd9627`.

The highest-risk remaining implementation work is now concentrated in final payment/order creation and refund integrity, production session policy decisions, production-safe error response coverage, incident-response documentation, persistent/distributed abuse-control policy, CSP/reporting decisions, and supply-chain policy refinements.

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
| Security roadmap/status reconciliation | **Fixed** | PR #599 replaced stale audit state with a phased roadmap. |
| Admin RBAC source gate | **Fixed** | PR #600 inventories high-risk admin mutations and enforces owner/staff role boundaries through runtime/unit CI. |
| Admin session rotation and expiry | **Fixed** | PR #601 rotates admin session cookies per login, signs issued-at/nonce payloads, and rejects stale, future-dated, malformed, and tampered sessions. |
| Customer order session boundary | **Fixed** | PR #602 binds customer order history to the verified session object and adds a source gate against raw customer ID order listing. |
| Customer login session rotation | **Fixed** | PR #603 revokes the prior browser customer session after successful OTP replacement-session creation and redacts OTP login errors. |
| Admin logout cookie clearing | **Fixed** | PR #604 centralizes admin cookie attributes and clears logout cookies with the same name/path and `maxAge: 0`. |
| Phase B roadmap reconciliation | **Fixed** | PR #605 reconciled session-lifecycle roadmap status through admin/customer session hardening work. |
| Customer session expiry/revocation gate | **Fixed** | PR #606 locks hashed-token lookup, `revokedAt: null`, `expiresAt > now`, expiry cleanup, and revoke timestamp behavior. |
| Admin owner-action denial coverage | **Fixed** | PR #607 and direct-main commits `5a7d224`/`433d404` add staff-denial tests for API-token, payment-provider, staff-management, discount, and manual-payment owner-only actions. |
| Customer mutation session binding | **Fixed** | Commit `07aa41c` gates profile/address mutations against caller-supplied customer IDs and locks mutation helpers to the verified session. |
| Public order lookup abuse/privacy guards | **Fixed** | Commits `e4ae916` and `9b2f88d` add runtime token-bound tests and public DTO PII omission gates. |
| Payment webhook lookup integrity guard | **Fixed** | Commit `cebd2fd` prevents webhook matching from regressing to public-token-only lookup. |
| Order return log redaction | **Fixed** | Commit `4ba2acf` redacts failed payment-return status logging. |
| Public inquiry input bounds | **Fixed** | Commit `7d5388f` adds executable coverage for inquiry name/email/message/delivery-note upper bounds. |
| Route security-header smoke gate | **Fixed** | Commit `9422b8e` makes route smoke fail if responses omit CSP, HSTS, frame, nosniff, referrer, or permissions policy headers. |
| Production dependency audit gate | **Fixed** | Commit `502c3c3` adds a CI `npm audit --omit=dev --audit-level=high` gate for production dependencies. |
| Paid webhook settlement gate | **Fixed** | PR #608 gates paid webhook state changes on settled amount/currency reconciliation. |
| Payment reference corroboration | **Fixed** | PR #609 requires supplied order-number/public-token corroborators to match provider-reference webhook lookups. |
| Duplicate payment webhook idempotency | **Fixed** | PR #610 makes duplicate webhook replay a pure early return without settlement or state mutation. |
| Public order timeline privacy | **Fixed** | PR #611 hides raw internal timeline titles from public order status and renders safe event-type labels. |
| Public order DTO allowlist | **Fixed** | PR #612 source-gates the public order DTO against customer/address/payment/provider/timeline internals. |
| Payment diagnostics owner gate | **Fixed** | PR #613 requires owner role for payment operation diagnostics pages. |
| Admin login security events | **Fixed** | PR #614 logs bounded/redacted admin login success, failure, throttle, and unconfigured-auth events. |
| Payment webhook security events | **Fixed** | PR #615 logs bounded/redacted duplicate, missing-attempt, settlement, and needs-attention webhook outcomes. |
| Local media path traversal guard | **Fixed** | PR #616 rejects unsafe `/uploads/` URL forms including traversal, encoded traversal, nested paths, and query strings. |
| Cloudinary response URL normalization | **Fixed** | PR #617 normalizes Cloudinary upload response URLs through the media URL allowlist before storage. |
| Media audit URL metadata redaction | **Fixed** | PR #618 removes full media URLs/paths from CMS media audit metadata while preserving bounded incident context. |
| Catalog search query bounds | **Fixed** | PR #619 caps `/products?q=...` server-side and mirrors the bound in the browser input. |
| Public inquiry UI/server bounds alignment | **Fixed** | PR #620 centralizes inquiry field limits and mirrors them in the storefront form. |
| Admin order notification input bounds | **Fixed** | PR #621 bounds admin notification recipient, subject, body, template key, actor, and provider error fields. |
| Checkout timeline text bounds | **Fixed** | PR #622 bounds checkout order, fulfillment, and payment timeline notes/actor fields. |
| Security roadmap Phase K addition | **Fixed** | PR #623 reconciled security status through PR #622 and added roadmap closeout tracking. |
| Public order lookup throttling | **Fixed** | PR #624 adds bounded in-process throttling before public order-token lookups. |
| Public inquiry cooldown boundary | **Fixed** | PR #625 source-gates same-origin, cooldown, and validation/service ordering for public inquiries and hardens cooldown cookie attributes. |
| Cart mutation burst throttling | **Fixed** | PR #626 adds bounded in-process throttles for add, update, and clear cart mutations. |
| Abandoned cart cleanup bounds | **Fixed** | PR #627 bounds expired-cart cleanup to an active expired-cart batch before deleting cart items. |
| Catalog/category query complexity gate | **Fixed** | PR #628 source-gates product/category listing pages and repositories against raw public pagination, sort, filter, or list-size controls. |
| Public abuse security events | **Fixed** | PR #629 logs bounded/redacted security events for public order lookup throttles, inquiry cooldowns, and cart mutation throttles. |

## Remaining roadmap

### Phase A — Admin RBAC and owner-only mutation authorization

**Priority:** Critical  
**Status:** Mostly fixed / monitor  
**Goal:** prove every sensitive admin mutation enforces the correct role on the server, not just in UI.

Completed:

- High-risk admin mutation inventory source gate exists.
- Owner-only role requirements are locked for settings, staff-account, API-token, payment-provider, webhook, manual-payment, discount, catalog, media, variant, and stock mutations.
- Staff-level role requirements are locked for order/inquiry operational mutations.
- CMS/catalog/media helper usage is guarded so the helper must remain owner-only.
- Staff-denial tests cover representative owner-only actions.
- Payment operation diagnostics now require owner role.

Remaining work:

1. Add admin API mutation inventory if new `app/api/admin/**` routes are introduced.
2. Keep destructive media/catalog deletion paths in the owner-only inventory as they are added.
3. Review any newly added diagnostics/audit-log views for owner-only or staff-safe access before release.

### Phase B — Session lifecycle hardening

**Priority:** High  
**Status:** Mostly fixed / policy remains  
**Goal:** tighten admin/customer session creation, logout, expiry, and fixation resistance.

Completed:

- Customer session cookie helper clears existing customer session cookies before setting a new token.
- Admin sessions rotate per successful login with signed issued-at timestamps and nonces.
- Admin session verification rejects stale, future-dated, malformed, tampered, and old deterministic cookie formats.
- Admin logout clears the browser-facing cookie with the same name/path contract and `maxAge: 0`.
- Customer OTP login rotates sessions by creating the replacement session first, revoking the prior browser session, and setting the replacement cookie.
- Account order history is bound to the verified customer session object instead of accepting arbitrary customer IDs.
- Profile/address mutations are bound to verified customer sessions.
- Customer session lookup/cleanup/revoke expiry predicates are source-gated.

Remaining work:

1. Finalize production customer/admin session lifetime policy.
2. Decide fixed lifetime vs sliding renewal for customer sessions.
3. Decide whether privileged customer/admin actions require shorter re-auth windows.

### Phase C — Public abuse controls and throttling

**Priority:** High  
**Status:** Mostly fixed / production policy remains  
**Goal:** prevent spam, enumeration, resource exhaustion, and brute-force access against public flows.

Completed:

- OTP abuse regression coverage exists.
- Public order token handling was hardened.
- Webhook raw-body/replay/idempotency boundary was improved.
- Public API allowlist CI gate exists.
- Public order lookup tokens are normalized with runtime tests for minimum/maximum length and allowed characters.
- Public inquiry inputs now have aligned server/UI upper bounds.
- Catalog search strings have server/browser length bounds.
- Public order lookups are throttled before token database lookup.
- Public inquiry submissions are gated by same-origin, cooldown, then validation/service ordering.
- Cart mutation bursts are throttled for add, update, and clear operations.
- Abandoned cart cleanup is bounded to an active expired-cart batch.
- Product/category listing pages and repositories are source-gated against raw public pagination, page-size, sort, filter, and query-complexity controls.
- Public order lookup, inquiry cooldown, and cart throttle outcomes emit bounded/redacted public-abuse security events.

Remaining work:

1. Decide persistent/distributed throttling policy for multi-instance production deployment.
2. Decide whether public inquiry needs additional spam/anti-automation controls beyond same-origin/cooldown.
3. Continue adding schema allowlists before introducing richer public sort/filter/listing surfaces.

### Phase D — Payment and order integrity

**Priority:** Critical/High  
**Status:** Partial / strongly improved  
**Goal:** ensure payment state transitions cannot be replayed, spoofed, over/underpaid, cross-owned, or silently mis-audited.

Completed:

- Payment webhook signature validation exists.
- Public webhook routes are allowlisted and required to retain signature/raw-body validation.
- Webhook payment-attempt matching is source-gated against public-token-only lookup.
- Paid webhook state transitions require settled amount/currency reconciliation.
- Provider-reference webhook lookups require supplied order-number/public-token corroboration.
- Duplicate webhook replay is a pure early return and cannot re-run settlement or state transitions.
- Payment/webhook outcomes emit bounded security events for incident review.

Remaining work:

1. Order ownership checks for storefront payment confirmation and any private payment/order views.
2. Idempotency-key enforcement for payment/order creation boundaries.
3. Refund and settlement audit trail completeness.
4. Provider callback payload minimization and response sanitization review.

### Phase E — Data privacy and response exposure audit

**Priority:** High  
**Status:** Partial / strongly improved  
**Goal:** verify customer and internal operational data never leaks through pages, APIs, logs, diagnostics, or search.

Completed:

- Account, cart, checkout, OTP-login, and payment-return caught-error logs use redaction helpers.
- Redaction source gates cover key customer-input mutation paths.
- Public order DTO source gates prevent customer/contact/address/staff-note/payment-provider fields from being selected.
- Public order status hides raw internal timeline titles and metadata.
- Payment operation diagnostics require owner role.
- Media audit metadata no longer stores raw media URLs/paths.
- Public abuse throttle/cooldown logs avoid raw tokens, product IDs, line keys, and customer PII.

Remaining work:

1. Production-safe error response tests that hide stacks/internal details.
2. Broader storefront/API exposure audit for new emails, phone numbers, addresses, internal IDs, payment metadata, and admin fields as features expand.
3. Search/catalog response allowlists if richer public APIs are introduced.

### Phase F — Logging, audit trails, and incident readiness

**Priority:** Medium/High  
**Status:** Partial / improved  
**Goal:** make security-relevant events traceable without leaking sensitive data.

Completed:

- Redacted error logging exists for account, cart, checkout, OTP login, and payment return surfaces.
- Admin login emits bounded/redacted security events for success, failure, throttling, and unconfigured auth.
- Payment webhooks emit bounded/redacted security events for duplicate replay, missing attempt, clean settlement, and needs-attention settlement/state outcomes.
- Media audit metadata is redacted while retaining bounded incident context.
- Checkout timeline and admin notification text fields are bounded before storage/timeline use.
- Public order lookup throttles, public inquiry cooldowns, and cart mutation throttles emit bounded/redacted public-abuse security events.

Remaining work:

1. Authorization-failure logging without secret/customer leakage.
2. OTP abuse and throttle-event logging beyond existing login/admin/public-abuse events.
3. Media delete logging if delete helpers are introduced.
4. Incident response runbook for investigation, containment, recovery, and notification.

### Phase G — Input validation and injection safety follow-up

**Priority:** Medium/High  
**Status:** Partial / strongly improved  
**Goal:** finish the non-upload validation and rendering audit.

Completed:

- Safe return-path normalization exists.
- JSON-LD serialization escapes script-breaking and HTML-sensitive characters.
- Public inquiry field limits have executable coverage and matching form bounds.
- Catalog search query strings are normalized and length-capped server-side and in the UI.
- Admin notification recipient/body/template/provider fields are bounded.
- Checkout timeline notes and actor fields are bounded.
- Product/category list query-complexity gates guard against raw public pagination, sort, filter, and page-size controls.

Remaining work:

1. Rich text/Markdown renderer audit if any renderer is introduced.
2. Product/category/admin content rendering audit for unsafe HTML paths as content features expand.
3. Email/SMS/template escaping checks for any future outbound provider integrations.
4. Uploaded-image metadata stripping policy, if required by production privacy goals.

### Phase H — Media deletion, path traversal, and malware policy

**Priority:** Medium  
**Status:** Partial / improved  
**Goal:** finish upload lifecycle controls beyond upload-time MIME/signature checks.

Completed:

- Upload size/type allowlist and magic-byte sniffing exist.
- SVG/script uploads are rejected.
- Media upload allowlist CI gate exists.
- Local `/uploads/` URLs reject traversal, encoded traversal, nested paths, and query strings.
- Cloudinary upload response URLs are normalized through the media URL allowlist before storage.
- Media audit metadata avoids storing raw URLs/paths.

Remaining work:

1. Media deletion authorization and ownership checks if delete helpers are introduced.
2. Production malware-scanning decision: integrate scanning or document accepted risk.
3. Optional metadata stripping for privacy-sensitive images.
4. Continue verifying Cloudinary/server credential isolation as deployment configuration evolves.

### Phase I — Browser/header deployment verification

**Priority:** Medium  
**Status:** Partial / stable  
**Goal:** ensure security headers are present in production-like responses, not only in config.

Completed:

- Baseline headers and CSP exist in the app configuration.
- Header config tests exist.
- Route smoke verifies required security headers on production-like responses.

Remaining work:

1. CSP tightening plan to remove/reduce `unsafe-inline` where practical.
2. CSP report endpoint or monitoring decision.
3. Admin/storefront header parity verification beyond the existing smoke route set.

### Phase J — Dependency and supply-chain gate

**Priority:** Medium  
**Status:** Partial / stable  
**Goal:** prevent known critical/high dependency vulnerabilities and supply-chain regressions.

Completed:

- CI runs `npm audit --omit=dev --audit-level=high` after dependency install.
- Committed-secret scanning runs in unit CI.

Remaining work:

1. Decide allowlist/expiration policy for unavoidable advisories.
2. Ensure lockfile changes are reviewed by CI.
3. Consider license/publisher/package-integrity checks if production risk warrants it.

### Phase K — Security roadmap closeout and documentation

**Priority:** Medium  
**Status:** Partial / improved  
**Goal:** keep the security plan accurate enough to guide final production hardening.

Completed:

- Roadmap reconciliations were added after major security-hardening waves.
- This document is reconciled through PR #629 and main commit `18bd9627`.

Remaining work:

1. Keep this document synchronized after each security PR or direct-main security change.
2. Add a production incident-response runbook.
3. Add deployment checklist references for secrets, headers, provider webhooks, monitoring, backups, and dependency policy.
4. Mark phases as **Fixed** only when implementation and CI gates have both landed.
