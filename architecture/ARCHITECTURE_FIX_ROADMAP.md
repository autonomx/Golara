# Architecture Fix Implementation Roadmap

## Purpose

This roadmap converts the architecture review concerns into implementation phases. It separates launch blockers from medium-term debt and keeps the work in small, CI-gated PRs.

## Current status snapshot

As of the Phase 19.7 merge, Golara is structurally ready for a controlled soft-launch path but still needs production hardening before broad public launch.

Approximate readiness:

- Controlled/manual soft launch: 70-75% ready.
- Real public launch after media/service-layer hardening: 80-85% ready.
- Full production readiness after payment-provider integration, capacity integration tests, deployment/ops checks, and SEO/localized metadata: 90%+.

The main remaining risks are not the basic storefront/CMS foundations. They are end-to-end production workflows: durable media storage, payment provider integration, fulfillment capacity exhaustion tests, CMS business invariant enforcement, operational deployment checks, localized metadata/SEO, and checkout/inquiry localization.

## Completed phases

### Phase 15 — Production runtime safety

Goal: prevent production from silently falling back to seeded preview data.

Status: Completed.

Implemented outcomes:

- Explicit runtime mode contract.
- Production-safe repository fallback behavior.
- Admin runtime readiness surface.
- Production runtime smoke/check coverage.

### Phase 16 — Customer OTP abuse prevention

Goal: close OTP toll-fraud and lockout risks before public launch.

Status: Completed.

Implemented outcomes:

- OTP rate-limit model.
- Central OTP request/verify guard service.
- OTP event/lockout hardening.
- Unit coverage and architecture docs.

### Phase 17 — Checkout state machine foundation

Goal: make order/payment/fulfillment transitions explicit and testable before payment-provider integration.

Status: Completed and expanded.

Implemented outcomes:

- Checkout order/payment/fulfillment status constants and transition guards.
- Checkout status mutation services.
- Admin order/fulfillment actions routed through status services.
- Payment event/idempotency foundation.
- Timeline events for accepted status transitions.

Remaining follow-up outside the original phase:

- Real payment-provider adapter integration.
- Provider webhook signature verification.
- Payment reconciliation/refund flows.

### Phase 18 — Inventory and fulfillment capacity

Goal: avoid selling same-day products or delivery windows that cannot be fulfilled.

Status: Foundation completed.

Implemented outcomes:

- Fulfillment capacity bucket model.
- Fulfillment capacity reservation model.
- Reservation lifecycle helpers.
- Checkout-facing capacity hold service seam.
- Order/payment lifecycle hooks to confirm or release reservations.

Remaining follow-up:

- DB-backed capacity exhaustion tests.
- Hold capacity during the real checkout/date-window action once that route exists.
- Release old holds when a delivery window changes.
- Scheduled cleanup for expired holds.
- Admin capacity bucket management.

### Phase 19 — Localization architecture and implementation

Goal: decide and implement multilingual storage before more catalog copy accrues.

Status: Completed beyond original roadmap scope.

Implemented outcomes:

- 19.1 Localization architecture decision.
- 19.2 Translation schema foundation.
- 19.3 Catalog localized read projection.
- 19.4 Admin product/category translation editing.
- 19.5 Existing-value loading and completeness signals.
- 19.6 Homepage translation editing.
- 19.7 Cookie-backed storefront locale resolution and language switcher.

Current behavior:

- Supported locales: `fa-IR` and `en-CA`.
- Storefront locale resolves from cookie, then `Accept-Language`, then default `fa-IR`.
- Storefront pages request localized homepage/category/product projections.
- Existing routes remain stable; no `/fa` or `/en` route segments yet.

Remaining follow-up:

- Localized metadata generation.
- Optional `/en` route segment support.
- Localized checkout and inquiry form labels/errors.
- Translated slugs if SEO requires them.

## Next phases

## Phase 20 — Media architecture cleanup

Goal: move from route-code image aliases and local-only assumptions to durable, data-driven media management.

### 20.1 Media source typing

- Add media source/type metadata.
- Track generated, uploaded, external, seed, and future object-storage media.
- Preserve existing image behavior.
- Add docs and unit coverage.

### 20.2 Category image alias migration

- Move category image aliases from route/component code into seed data or media mapping records.
- Keep old route behavior during migration.
- Ensure category and product pages continue rendering in route smoke.

### 20.3 Object storage provider seam

- Add S3/Cloudinary-compatible provider seam.
- Keep local development upload mode.
- Add env-driven storage provider selection.
- Add production readiness warning when local-only storage is used in production.

## Phase 21 — CMS service layer extraction

Goal: keep business invariants from scattering across server actions.

### 21.1 Category service

- Move create/update category validation into `lib/cms/services/`.
- Enforce parent/child category invariants.
- Prevent unsafe category deactivation when active children/products depend on it.
- Preserve audit logging and revalidation behavior.

### 21.2 Product service

- Move create/update product validation into `lib/cms/services/`.
- Enforce product code uniqueness and user-safe errors.
- Validate price/currency/media rules.
- Add audit reason support for price changes if needed.

### 21.3 Admin audit policy

- Define audit retention rules.
- Define export behavior.
- Define PII redaction rules for audit metadata.
- Add docs for operational handling.

## Phase 22 — Payment provider integration

Goal: connect the payment foundation to a real provider without compromising idempotency or order-state safety.

### 22.1 Provider adapter contract

- Define provider-neutral payment adapter interface.
- Map provider statuses to canonical checkout payment statuses.
- Keep provider-specific code isolated.

### 22.2 Webhook verification and processing

- Add provider webhook route.
- Verify provider signatures before recording events.
- Call the Phase 17.4 payment event service for idempotent processing.
- Add duplicate callback tests.

### 22.3 Payment reconciliation and refund flows

- Add staff/admin reconciliation visibility.
- Add refund status mapping.
- Ensure refunds update payment/order/capacity state safely.

## Phase 23 — Capacity and checkout integration tests

Goal: prove fulfillment capacity cannot be oversold in realistic checkout/payment/admin flows.

### 23.1 Capacity exhaustion tests

- Test available capacity.
- Test exhausted bucket rejection.
- Test release on order cancellation.
- Test release on payment failure.
- Test expiration of held reservations.

### 23.2 Delivery-window change lifecycle

- Release old hold when delivery window changes.
- Create a new hold for the selected window.
- Avoid duplicate active reservations per order.

### 23.3 Admin capacity management

- Add admin capacity bucket creation/editing.
- Add reserved/available capacity visibility.
- Add warning states for overbooked legacy data.

## Phase 24 — Production deployment and operations readiness

Goal: make the app safe to operate with real customers and real customer data.

### 24.1 Environment and deployment checklist

- Validate required production env vars.
- Document deploy steps.
- Document Prisma migration workflow.
- Document seed/import workflow for initial content.

### 24.2 Observability and error reporting

- Add structured app error logging policy.
- Add error reporting provider seam if needed.
- Add operational runbook for checkout/payment/auth failures.

### 24.3 Security and privacy hardening

- Review security headers.
- Review admin session hardening.
- Review customer data retention.
- Review public form rate limits.
- Review PII handling in logs and audit metadata.

## Phase 25 — SEO, localized metadata, and launch QA

Goal: make the localized storefront launch-ready for search engines and real user QA.

### 25.1 Localized metadata

- Generate metadata from the resolved/requested locale.
- Add localized Open Graph/Twitter metadata.
- Preserve stable canonical URLs.

### 25.2 Optional locale URL segments

- Decide whether to add `/en` routes.
- Keep primary Persian routes stable.
- Avoid duplicate-content ambiguity.

### 25.3 Launch QA matrix

- Test storefront in `fa-IR` and `en-CA`.
- Test admin translation editing.
- Test checkout, inquiry, account, cart, order, payment, and fulfillment flows.
- Test production mode without seed fallback.

## Soft-launch path

Recommended order before controlled launch:

1. Phase 20.1-20.3 media cleanup.
2. Phase 21.1-21.2 CMS service extraction.
3. Phase 23.1 capacity exhaustion tests.
4. Checkout/inquiry localization fixes.
5. Production deployment checklist.

Recommended order before broad public launch:

1. Payment provider adapter and webhook verification.
2. Object storage configured for production.
3. Capacity admin management and full lifecycle tests.
4. Localized metadata/SEO pass.
5. Final QA matrix across Persian and English.

## Merge policy

Each bundle should be a focused PR:

1. implement one small architectural fix;
2. update docs;
3. check CI;
4. merge only when CI passes and PR is mergeable.
