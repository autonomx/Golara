# Security Audit Report and Roadmap

This document tracks the June 2026 security audit of the **Golara** codebase. The audit covers authentication, authorization, session management, CSRF and same-origin protections, public abuse controls, payment/order security, input validation, media handling, browser headers, secrets, data privacy, logging, and automated security gates.

Status values:

- **Fixed** — merged and covered by tests or CI gates.
- **Partial** — meaningful controls exist, but material audit work remains.
- **Deferred** — not yet implemented.
- **Accepted** — intentionally accepted risk with rationale.

## Current audit position

The project has completed a broad hardening pass across authorization, session management, public API boundaries, public abuse controls, payment/order integrity, privacy, logging, media handling, input validation, browser headers, secrets, dependency scanning, incident-response documentation, production security deployment checklist coverage, and supporting production security policies. This roadmap reconciles the current security-audit status through PR #653 / main commit `71b2f36`.

The highest-risk remaining implementation work is now concentrated in future surface monitoring, production sign-off application, and operator/environment decisions that must be completed during release rather than in repository policy text.

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
| Security roadmap Phase C/F/G/K reconciliation | **Fixed** | PR #630 reconciled public-abuse and query-complexity roadmap status through PR #629. |
| Payment confirmation order privacy | **Fixed** | PR #631 source-gates payment confirmation, return redirects, public DTO exposure, and session-bound private order history. |
| Checkout creation boundary idempotency | **Fixed** | PR #632 source-gates checkout same-origin, cart claim ordering, payment-attempt ordering, cart completion, and reservation transaction boundaries. |
| Manual payment refund audit trail | **Fixed** | PR #633 source-gates owner-only manual refund/void actions, manual-provider restriction, transition metadata, audit metadata redaction, and reservation release. |
| Payment return callback minimization | **Fixed** | PR #634 removes duplicate Zarinpal `authority` forwarding and proves extra provider-return query params are ignored. |
| Security roadmap Phase D/E/F/G/K reconciliation | **Fixed** | PR #635 reconciled payment/order integrity and related privacy/logging roadmap status through PR #634. |
| Payment webhook error response sanitization | **Fixed** | PR #636 replaces raw webhook exception messages with generic 500 responses and tests that internal/provider details are not exposed. |
| Admin authorization-denial logging | **Fixed** | PR #637 emits bounded/redacted admin authorization denial events without labels, emails, cookies, passwords, or raw form data. |
| OTP blocked-request logging | **Fixed** | PR #638 persists bounded `otp_request_blocked` customer auth events with hashed phone/IP/user-agent identifiers. |
| Security incident response runbook | **Fixed** | PR #639 adds a production incident-response runbook covering triage, evidence preservation, containment, recovery, communications, and closure. |
| Security roadmap Phase C/D/E/F/K reconciliation | **Fixed** | PR #640 reconciled error-response, authorization-denial, OTP-event, and incident-response roadmap status through PR #639. |
| Production security deployment checklist | **Fixed** | PR #641 adds a production release checklist covering secrets, headers/CSP, payment webhooks, abuse controls, monitoring, backups, dependency policy, evidence, and sign-off. |
| Security roadmap Phase I/J/K reconciliation | **Fixed** | PR #642 reconciled roadmap status through PR #641 and linked deployment-checklist coverage. |
| Public abuse throttling policy | **Fixed** | PR #643 adds public abuse throttling policy guidance for in-process, distributed, and hybrid production throttling decisions. |
| CSP reporting and tightening policy | **Fixed** | PR #644 adds CSP reporting/tightening policy guidance and checklist linkage. |
| Backup and restore policy | **Fixed** | PR #645 adds database/media backup, restore-test, and evidence-hygiene policy guidance. |
| Dependency advisory exception policy | **Fixed** | PR #646 adds dependency advisory exception, remediation, expiry, lockfile review, and evidence-hygiene policy guidance. |
| Security release sign-off template | **Fixed** | PR #647 adds a bounded security release sign-off template and links it from the production deployment checklist. |
| Security roadmap Phase C/I/J/K reconciliation | **Fixed** | PR #648 reconciled roadmap status through PR #647 after production checklist and policy docs landed. |
| Production session lifetime policy | **Fixed** | PR #649 adds admin/customer session lifetime, privileged re-auth, OTP bridge expiry, revocation, and monitoring policy guidance. |
| Public inquiry spam policy | **Fixed** | PR #650 adds public inquiry spam/anti-automation launch decision guidance and checklist linkage. |
| Security roadmap reconciliation through #650 | **Fixed** | PR #651 reconciled roadmap status through public inquiry spam policy coverage. |
| Media malware and metadata policy | **Fixed** | PR #652 adds launch decision guidance for media malware scanning, metadata stripping, accepted risk, evidence, and review cadence. |
| Package integrity and license policy | **Fixed** | PR #653 adds production package review fields, license suitability, publisher/integrity review, lockfile review, exception handling, and review cadence. |

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
- Production session lifetime policy now documents admin/customer lifetimes, OTP bridge expiry, privileged re-auth, revocation, and monitoring decisions.

Remaining work:

1. Apply the production session lifetime policy during release sign-off and update implementation if the chosen policy is stricter than current defaults.
2. Revisit privileged re-auth implementation if future admin/customer surfaces become materially higher risk.

### Phase C — Public abuse controls and throttling

**Priority:** High  
**Status:** Mostly fixed / policy remains  
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
- Blocked OTP request decisions persist bounded customer auth events with hashed identifiers.
- Public abuse throttling policy now documents in-process, distributed, and hybrid launch decisions.
- Public inquiry spam policy now documents baseline acceptance, escalation triggers, stronger controls, evidence hygiene, and review cadence.

Remaining work:

1. Apply the public abuse throttling and public inquiry spam policies during production deployment sign-off.
2. Continue adding schema allowlists before introducing richer public sort/filter/listing surfaces.

### Phase D — Payment and order integrity

**Priority:** Critical/High  
**Status:** Mostly fixed / monitor  
**Goal:** ensure payment state transitions cannot be replayed, spoofed, over/underpaid, cross-owned, or silently mis-audited.

Completed:

- Payment webhook signature validation exists.
- Public webhook routes are allowlisted and required to retain signature/raw-body validation.
- Webhook payment-attempt matching is source-gated against public-token-only lookup.
- Paid webhook state transitions require settled amount/currency reconciliation.
- Provider-reference webhook lookups require supplied order-number/public-token corroboration.
- Duplicate webhook replay is a pure early return and cannot re-run settlement or state transitions.
- Payment/webhook outcomes emit bounded security events for incident review.
- Payment confirmation and return redirects remain public-safe and avoid hydrating private order details.
- Private customer order history is derived from the verified customer session and bound to `session.customerId`.
- Checkout creation flow is source-gated so cart claim, order draft creation, payment-attempt creation, cart completion, and reservation transactions remain ordered and idempotency-safe.
- Manual refund/void flows are owner-only, manual-provider-only, order-bound, and preserve payment transition/audit metadata without provider-reference leakage.
- Refunded/cancelled/failed payment transitions release fulfillment capacity and inventory reservations.
- Provider callback parsing forwards only the normalized provider reference and ignores extra return query params.
- Payment webhook failure responses are generic and do not expose caught exception details.

Remaining work:

1. Continue monitoring new payment-provider integrations for the same settlement, corroboration, callback minimization, response-sanitization, and audit-trail boundaries.
2. Add additional provider-specific reconciliation tests when non-manual/non-Zarinpal providers gain refund or settlement flows.

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
- Payment confirmation, return redirects, and provider-return payload handling are source-gated for public-safe exposure.
- Payment webhook failure responses use generic messages and hide internal/provider exception details.

Remaining work:

1. Broader storefront/API exposure audit for new emails, phone numbers, addresses, internal IDs, payment metadata, and admin fields as features expand.
2. Search/catalog response allowlists if richer public APIs are introduced.
3. Continue adding production-safe error response tests as new public/API surfaces are introduced.

### Phase F — Logging, audit trails, and incident readiness

**Priority:** Medium/High  
**Status:** Mostly fixed / monitor  
**Goal:** make security-relevant events traceable without leaking sensitive data.

Completed:

- Redacted error logging exists for account, cart, checkout, OTP login, and payment return surfaces.
- Admin login emits bounded/redacted security events for success, failure, throttling, and unconfigured auth.
- Payment webhooks emit bounded/redacted security events for duplicate replay, missing attempt, clean settlement, and needs-attention settlement/state outcomes.
- Media audit metadata is redacted while retaining bounded incident context.
- Checkout timeline and admin notification text fields are bounded before storage/timeline use.
- Public order lookup throttles, public inquiry cooldowns, and cart mutation throttles emit bounded/redacted public-abuse security events.
- Manual refund/void transitions preserve bounded payment status and admin audit metadata without provider-reference leakage.
- Admin authorization denials emit bounded/redacted security events without labels, emails, cookies, passwords, or raw form data.
- Blocked OTP request decisions emit bounded customer auth events with hashed phone/IP/user-agent identifiers.
- A production security incident response runbook now covers triage, evidence preservation, containment, communication, recovery validation, post-incident review, and closure.

Remaining work:

1. Media delete logging if delete helpers are introduced.
2. Keep incident-response and logging guidance synchronized as new security-event sources are added.

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
- Provider return parsing ignores unexpected callback query params.

Remaining work:

1. Rich text/Markdown renderer audit if any renderer is introduced.
2. Product/category/admin content rendering audit for unsafe HTML paths as content features expand.
3. Email/SMS/template escaping checks for any future outbound provider integrations.
4. Apply the media malware/metadata policy during release sign-off if production privacy goals require uploaded-image metadata stripping.

### Phase H — Media deletion, path traversal, and malware policy

**Priority:** Medium  
**Status:** Mostly fixed / policy remains  
**Goal:** finish upload lifecycle controls beyond upload-time MIME/signature checks.

Completed:

- Upload size/type allowlist and magic-byte sniffing exist.
- SVG/script uploads are rejected.
- Media upload allowlist CI gate exists.
- Local `/uploads/` URLs reject traversal, encoded traversal, nested paths, and query strings.
- Cloudinary upload response URLs are normalized through the media URL allowlist before storage.
- Media audit metadata avoids storing raw URLs/paths.
- Media malware and metadata policy now documents malware-scanning, metadata-stripping, accepted-risk, evidence, and review-cadence decisions.

Remaining work:

1. Media deletion authorization and ownership checks if delete helpers are introduced.
2. Apply the media malware and metadata policy during production deployment sign-off.
3. Continue verifying Cloudinary/server credential isolation as deployment configuration evolves.

### Phase I — Browser/header deployment verification

**Priority:** Medium  
**Status:** Mostly fixed / policy remains  
**Goal:** ensure security headers are present in production-like responses, not only in config.

Completed:

- Baseline headers and CSP exist in the app configuration.
- Header config tests exist.
- Route smoke verifies required security headers on production-like responses.
- Production deployment checklist now includes browser header and CSP verification.
- CSP reporting and tightening policy now documents report-only, enforced-baseline, and tightening-required launch decisions.

Remaining work:

1. Apply the CSP reporting/tightening policy during production deployment sign-off.
2. Admin/storefront header parity verification beyond the existing smoke route set as routes expand.

### Phase J — Dependency and supply-chain gate

**Priority:** Medium  
**Status:** Mostly fixed / policy remains  
**Goal:** prevent known critical/high dependency vulnerabilities and supply-chain regressions.

Completed:

- CI runs `npm audit --omit=dev --audit-level=high` after dependency install.
- Committed-secret scanning runs in unit CI.
- Production deployment checklist now includes dependency and lockfile review sign-off.
- Dependency advisory exception policy now documents exception criteria, remediation, expiry, lockfile review, and evidence hygiene.
- Package integrity and license policy now documents required review fields, license suitability, publisher/integrity checks, lockfile review, exceptions, and review cadence.

Remaining work:

1. Apply the dependency advisory exception policy during production deployment sign-off.
2. Apply the package integrity and license policy during production deployment sign-off and future production-facing dependency additions.

### Phase K — Security roadmap closeout and documentation

**Priority:** Medium  
**Status:** Mostly fixed / monitor  
**Goal:** keep the security plan accurate enough to guide final production hardening.

Completed:

- Roadmap reconciliations were added after major security-hardening waves.
- This document is reconciled through PR #653 and main commit `71b2f36`.
- A production security incident response runbook has been added.
- A production security deployment checklist now references secrets, headers, provider webhooks, monitoring, backups, dependency policy, evidence, sign-off, media malware/metadata review, and package integrity/license review.
- Public abuse throttling, CSP reporting/tightening, backup/restore, dependency advisory exception, release sign-off, production session lifetime, public inquiry spam, media malware/metadata, and package integrity/license policy docs have been added and linked from the checklist.

Remaining work:

1. Keep this document synchronized after each security PR or direct-main security change.
2. Mark phases as **Fixed** only when implementation and CI gates have both landed.
