# Payment Readiness Implementation Roadmap

Last updated: 2026-06-14

## Current production decision

Golara is **not ready for autonomous live gateway commerce** yet. It remains suitable for inquiry-first or manually assisted checkout when the operator launch checklist is complete. The live payment path should stay behind explicit environment and operator gates until the items below are completed with target-environment evidence.

This roadmap consolidates the missing payment-readiness work that is currently spread across Phase 31 through Phase 38 production notes.

## What is already in place

- Live provider checkout foundations exist for Stripe Checkout Sessions and ZarinPal-style checkout/return handling.
- Payment webhook routes, provider-neutral normalization, signature verification helpers, idempotent event persistence, trusted matched state transitions, durable settlement reconciliation storage, and read-only admin settlement/alert visibility exist.
- Deploy-readiness blockers and evidence templates exist for gateway-mode launches.
- Refund/void planning, no-mutation previews, migration-backed operation-record contracts, read-only operation diagnostics, provider readiness diagnostics, and go/no-go documents exist.
- Real notification provider foundations exist only as inert/provider-neutral planning and diagnostics. No real email, SMS, or WhatsApp delivery is enabled.
- Security hardening exists for same-origin/CSRF boundaries, payment/order privacy, webhook integrity, public abuse controls, redaction, secret readiness, and release policies.

## Missing before live payment launch

### 1. Target-environment gateway validation

**Status:** pending operator/provider evidence.

**Goal:** prove that configured Stripe and/or ZarinPal checkout, return, webhook, settlement, duplicate, and invalid-signature paths work in the intended staging or production-like environment.

**Implementation slices:**

1. Deploy the intended SHA to a staging or production-like environment with real provider sandbox credentials.
2. Apply and verify `prisma/migrations/20260604170000_add_payment_settlement_reconciliation/migration.sql` in the target database.
3. Complete `docs/production-roadmap-phase32-payment-webhook-validation-evidence.md` with concrete operator evidence.
4. Run the Phase 32 smoke-test runbook for success, failure/cancel, duplicate replay, invalid signature, missing attempt, and settlement-mismatch cases.
5. Verify `/admin/payments/settlement` uses durable settlement records, not fallback-only event summaries.
6. Verify `/admin/payments/alerts` surfaces expected pending/failed/missing-attempt/settlement-mismatch states.
7. Run `APP_MODE="production" CHECKOUT_MODE="gateway" npm run check:deploy-readiness` with the target environment configuration.
8. Set confirmation flags only after evidence is complete:
   - `PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED="true"`
   - `PAYMENT_WEBHOOK_SMOKE_TESTS_CONFIRMED="true"`

**Exit criteria:**

- Provider-generated webhook evidence exists for each enabled provider.
- Duplicate webhook replay is idempotent.
- Invalid signatures are rejected.
- Paid state changes require matched provider references and reconciled amount/currency.
- Settlement and alert admin pages are verified against the target database.
- Rollback to inquiry/manual mode is documented and tested.

### 2. Checkout and payment browser QA

**Status:** repository foundations exist; full e2e validation remains pending.

**Goal:** validate the complete customer-facing path from cart to provider handoff to public order status.

**Implementation slices:**

1. Add Playwright or equivalent smoke tests for cart → checkout → provider handoff preparation.
2. Add route/browser tests for return success, cancel, failed/unverified, and missing-token scenarios.
3. Add tests for duplicate checkout submission/idempotency-key behavior.
4. Add tests for localized payment guidance in English and Persian.
5. Add manual QA runbook for mobile, desktop, RTL, LTR, signed-in, and guest checkout flows.

**Exit criteria:**

- Customers can create a cart order without stale totals or duplicate payment attempts.
- Success/cancel/failure return pages produce safe customer-facing states.
- Public order pages do not expose internal payment/provider details.
- English and Persian checkout/payment copy render in the correct language and direction.

### 3. Payment operation migration validation

**Status:** repo-side contract exists; target-environment migration evidence is pending.

**Goal:** make the future payment-operation history table safe to use before any refund/void execution is enabled.

**Implementation slices:**

1. Apply and verify `prisma/migrations/20260604200000_add_payment_operation_records/migration.sql` in the target database.
2. Complete `docs/production-roadmap-phase33-payment-operation-migration-validation-evidence.md`.
3. Confirm raw-SQL read/write helpers can create, list, and transition operation records behind `PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED`.
4. Confirm no Prisma model/client access is introduced unless the schema strategy is explicitly changed and reviewed.
5. Set `PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED="true"` only after target-environment evidence is complete.

**Exit criteria:**

- Operation-record table, indexes, uniqueness, and migration history are verified in the target database.
- Admin history diagnostics can read target-environment records safely.
- Migration confirmation is tied to evidence, not source existence.

### 4. Refund and void live execution enablement

**Status:** explicit **NO-GO** until target evidence and guarded execution criteria are met.

**Goal:** add provider-backed refunds/voids without corrupting order/payment state, double-refunding, or releasing inventory incorrectly.

**Implementation slices:**

1. Complete provider endpoint mapping evidence for each enabled provider outside source control.
2. Complete provider readiness evidence packets for Stripe/ZarinPal refund and void behavior.
3. Add provider-backed adapter implementations using injected HTTP clients only; do not add default live fetch behavior.
4. Add strict owner-only admin execution controls with confirmation UX, reason capture, idempotency key display, and disabled states for unready providers.
5. Add operation-record creation before provider execution and submitted/succeeded/failed/manual-review transitions after execution.
6. Add provider response normalization for accepted, rejected, unavailable, retryable, duplicate, partial-refund, and void-not-supported outcomes.
7. Add post-provider-success order/payment transition service guarded by provider success evidence.
8. Add inventory/capacity release policy only after refund/void state transitions are explicitly reviewed.
9. Add audit-log and timeline entries with bounded/redacted provider metadata.
10. Add tests for full refund, partial refund, duplicate idempotency key reuse, provider failure, retryable error, void before capture, already-settled void rejection, unauthorized staff denial, and migration-unconfirmed blocking.

**Exit criteria:**

- Refund/void execution is owner-only and disabled unless all provider and migration readiness gates pass.
- Every operation is idempotent and auditable.
- Failed provider operations do not mutate order/payment state.
- Successful provider operations update internal state only through guarded transition helpers.
- Inventory/capacity release behavior is deterministic and covered by tests.

### 5. Real notification delivery for payment/order events

**Status:** inert foundation only; no real sends enabled.

**Goal:** customers and staff receive reliable payment/order notifications after provider evidence, consent/suppression review, and smoke-test validation.

**Implementation slices:**

1. Operator selects email/SMS/WhatsApp provider scope for launch.
2. Record provider account ownership, credential-source names, sender/domain/number verification, template approval, and suppression/consent expectations outside source control.
3. Add concrete provider adapters behind explicit enablement gates; preserve disabled/manual/log modes.
4. Add delivery-attempt persistence migration and idempotency keys for payment/order notification events.
5. Add admin read-only delivery history for order confirmation, payment failure, payment success, fulfillment update, and staff alerts.
6. Add retry worker only after durable persistence and no-duplicate-send protections are complete.
7. Add smoke tests for accepted, rejected, rate-limited, unavailable, duplicate, and retry outcomes.

**Exit criteria:**

- No live notification send occurs without operator-selected provider evidence.
- Delivery attempts are durable, observable, and idempotent.
- Staff can diagnose failed sends without exposing secrets or customer-sensitive payloads.
- Manual/log modes remain available as fallback.

### 6. End-to-end order, fulfillment, and reconciliation QA

**Status:** planned Phase 37 work.

**Goal:** validate payment as part of the complete production order lifecycle, not as isolated route helpers.

**Implementation slices:**

1. Add e2e tests for cart → checkout → payment → order → notification → admin fulfillment.
2. Add paid, failed, cancelled, pending, refunded, partially refunded, and voided order-state scenarios.
3. Add inventory reservation/release tests around payment success, cancellation, failure, refund, and void.
4. Add discount, tax, shipping, and currency consistency tests for the supported launch markets.
5. Add admin print/CSV/packing-slip checks for live paid orders and refunded/voided orders.
6. Add a production manual runbook for the full order lifecycle.

**Exit criteria:**

- Customer, payment, inventory, fulfillment, notification, and admin views agree on one order truth.
- Operators can follow one runbook from order creation through fulfillment or refund.
- Payment states cannot become orphaned from order/fulfillment state.

### 7. Production monitoring, incident response, and rollback

**Status:** partial security/production policy exists; payment-specific production observability remains incomplete.

**Goal:** make payment incidents visible and recoverable before customer reports become the first alert.

**Implementation slices:**

1. Add structured logs for checkout creation, provider handoff, payment return, webhook processing, settlement reconciliation, payment operations, notifications, and admin payment actions.
2. Add error-monitoring hooks for provider failures, webhook signature failures, stale pending payments, settlement mismatches, duplicate replay anomalies, and notification failures.
3. Add health/readiness checks for database, media storage, checkout provider config, webhook secrets, notification provider config, and migration confirmation flags.
4. Add admin payment operations dashboards for stale pending payments, mismatches, failed webhooks, failed notifications, and operation failures.
5. Add incident runbooks for provider outage, webhook backlog, payment state mismatch, notification outage, refund failure, and migration rollback.
6. Run and record backup/restore and rollback drills against the target production stack.

**Exit criteria:**

- Operators can see payment problems from admin/monitoring before customers report them.
- Rollback to inquiry/manual checkout is documented and tested.
- Backup/restore and migration rollback evidence exists for the target production environment.

## Recommended implementation order

1. **Phase P35.1 — Gateway target-environment validation evidence**
   - No new live behavior; complete Phase 32 evidence and migration checks.
2. **Phase P35.2 — Checkout/payment browser smoke coverage**
   - Add customer-facing route/e2e coverage before enabling gateway mode.
3. **Phase P35.3 — Payment-operation migration validation**
   - Confirm operation-record persistence before execution controls.
4. **Phase P35.4 — Provider refund/void execution behind hard gates**
   - Add live execution only after evidence and owner-only controls are ready.
5. **Phase P35.5 — Post-success order/payment/inventory transitions**
   - Wire internal state mutation only after provider success behavior is proven.
6. **Phase P35.6 — Real notification provider enablement**
   - Add delivery after provider evidence, templates, suppression, and smoke tests.
7. **Phase P35.7 — Full order lifecycle e2e QA**
   - Validate cart, payment, order, notification, fulfillment, refund/void together.
8. **Phase P35.8 — Production observability and rollback drills**
   - Add monitoring, dashboards, runbooks, and target-environment evidence.

## Non-negotiable safety gates

Do not enable gateway checkout, refunds/voids, live notifications, or payment-state mutation unless the matching evidence gate is complete.

Do not add default live provider endpoints, source-controlled credentials, secret values, or production-ready claims without operator validation.

Do not treat source guards, documentation guards, or repository diffs as provider validation evidence.

Do not enable refund/void execution until migration confirmation, provider readiness evidence, owner-only authorization, idempotency, audit logging, and post-success transition behavior are all guarded.

Do not release inventory/capacity from a payment operation until the release policy and payment/order transition behavior have test coverage.

## Go/no-go summary

- **Inquiry-first production:** can proceed through the existing launch audit path after operator environment sign-off.
- **Manual/assisted commerce:** acceptable if payment is handled outside automatic provider trust and staff manually verify order state.
- **Live gateway checkout:** blocked until Phase P35.1 and P35.2 exit criteria are complete.
- **Live refunds/voids:** blocked until Phase P35.3 through P35.5 exit criteria are complete.
- **Real notification delivery:** blocked until Phase P35.6 exit criteria are complete.
- **Full autonomous commerce launch:** blocked until all phases through P35.8 are complete.
