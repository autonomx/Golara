# Architecture Fix Implementation Roadmap

## Purpose

This roadmap converts the architecture review concerns into implementation phases. It separates launch blockers from medium-term debt and keeps the work in small, CI-gated PRs.

## Phase 15 — Production runtime safety

Goal: prevent production from silently falling back to seeded preview data.

### 15.1 Runtime mode contract

- Add explicit `APP_MODE` support.
- Supported modes: `preview`, `development`, `test`, `production`.
- Treat `VERCEL_ENV=production` as production unless `APP_MODE` says otherwise.
- Keep seeded fallback available in preview/development/test.
- Require `DATABASE_URL` in production.

### 15.2 Repository fallback guard

- Update repository fallback helpers so DB read failures do not fall back to seed data in production.
- Seed fallback should be explicit preview behavior.
- Add clear error messages for misconfigured production.

### 15.3 Deployment architecture doc

- Document required environment variables.
- Document preview vs production behavior.
- Document migration/seed process.

## Phase 16 — Customer OTP abuse prevention

Goal: close OTP toll-fraud and lockout risks before public launch.

### 16.1 OTP rate limit model

- Per-phone OTP request limit.
- Per-IP OTP request limit.
- Per-phone verify attempt limit.
- Backoff or lockout policy.

### 16.2 OTP service guard implementation

- Centralize OTP request/verify checks in a service module.
- Record rate-limit metadata.
- Add user-safe error messages.

### 16.3 Tests and docs

- Add unit tests for rate-limit windows.
- Add abuse-prevention docs in `architecture/CUSTOMER_ACCOUNT_ARCHITECTURE.md`.

## Phase 17 — Checkout state machine foundation

Goal: make order/payment/fulfillment transitions explicit and testable before payment-provider integration.

### 17.1 Status constants and transition guards

- Add order status constants.
- Add payment attempt status constants.
- Add fulfillment status constants.
- Add legal transition guard helpers.
- Add unit tests.

### 17.2 Checkout service extraction

- Extract cart-to-order and order status update logic into services.
- Keep server actions/routes thin.
- Ensure every transition writes a timeline event.

### 17.3 Payment idempotency foundation

- Add idempotency key or webhook event tracking.
- Add duplicate webhook tests.
- Keep provider-specific adapters deferred.

## Phase 18 — Inventory and fulfillment capacity

Goal: avoid selling same-day products or delivery windows that cannot be fulfilled.

### 18.1 Capacity bucket model

- Add fulfillment capacity buckets by date/window/type.
- Add reservation status model.
- Hold capacity during checkout.

### 18.2 Reservation lifecycle

- Confirm reservation on payment/staff confirmation.
- Release on expiration/cancel/failure.
- Add capacity-exhaustion tests.

## Phase 19 — Localization schema decision

Goal: decide and implement multilingual storage before more catalog copy accrues.

### 19.1 Localization architecture

- Choose column-per-locale vs translation table.
- Define URL/cookie/locale behavior.
- Define Persian fallback and English fallback.

### 19.2 Catalog copy migration

- Add locale-aware category/product fields or translation records.
- Keep existing storefront behavior compatible.

## Phase 20 — Media architecture cleanup

Goal: move from route-code image aliases to data-driven media resolution.

### 20.1 Media source typing

- Add media source/type metadata.
- Mark generated, uploaded, external, and future object-storage media.

### 20.2 Category image alias migration

- Move category image aliases from route code into seed data or media mapping records.
- Keep old route behavior during migration.

### 20.3 Object storage plan

- Add S3/Cloudinary-compatible provider seam.
- Keep local dev upload mode.

## Phase 21 — CMS service layer extraction

Goal: keep business invariants from scattering across server actions.

### 21.1 Category service

- Move create/update category validation into `lib/cms/services/`.
- Add invariants around deactivation, child categories, and active products.

### 21.2 Product service

- Move create/update product validation into service layer.
- Add audit reason support for price changes if needed.

### 21.3 Admin audit policy

- Define retention, export, and PII redaction rules.

## Merge policy

Each bundle should be a focused PR:

1. implement one small architectural fix;
2. update docs;
3. check CI;
4. merge only when CI passes and PR is mergeable.
