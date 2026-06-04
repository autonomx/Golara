# Phase 32 Payment Webhooks and Settlement Progress

Last updated: 2026-06-04

This note supplements `docs/production-roadmap.md` while Phase 32 is in progress.

## Current status

Phase 32 is in progress. Golara now has provider-neutral payment webhook normalization, idempotent inbound webhook persistence, webhook signature verification, minimal provider webhook routes, trusted webhook-driven checkout state transitions, durable settlement reconciliation records, authenticated admin settlement visibility, main admin navigation access, payment webhook alert planning, a read-only admin webhook alert surface, and sidebar navigation for settlement and alert workflows for:

- **Stripe Checkout Sessions** webhooks.
- **ZarinPal** verification/callback-style payment events.

## Completed in Phase 32 so far

- Added `lib/checkout/payment-webhook-core.ts` for provider-neutral payment webhook normalization.
- Normalized Stripe `checkout.session.completed`, `checkout.session.expired`, and payment failure-style events into paid, cancelled, failed, or pending statuses.
- Normalized ZarinPal `OK`, `NOK`, cancelled, numeric paid codes, and unknown statuses into paid, failed, cancelled, or pending statuses.
- Added stable webhook payload digests and idempotency keys using provider, event name, provider reference, and payload digest.
- Added settlement summary counts for paid, failed, cancelled, pending, and attention-needed webhook events.
- Added `lib/checkout/payment-webhook-record.ts` for persistable payment webhook record planning.
- Added record planning for recorded, duplicate, and needs-attention webhook states.
- Added explicit decisions for when a webhook may apply payment state and when it becomes a settlement reconciliation candidate.
- Added a `CheckoutPaymentEvent` persistence input builder that targets the existing provider/idempotency unique event table.
- Added `lib/checkout/payment-webhook-service.ts` for DB-backed inbound webhook persistence through the existing `CheckoutPaymentEvent` table.
- Added duplicate protection via the existing unique provider/idempotency key.
- Added minimal payment webhook routes:
  - `app/api/webhooks/payments/stripe/route.ts`
  - `app/api/webhooks/payments/zarinpal/route.ts`
- Added `lib/checkout/payment-webhook-route-core.ts` for provider-neutral webhook route handling.
- Added `lib/checkout/payment-webhook-signature.ts` for Stripe and ZarinPal/Golara-style HMAC signature checks.
- Updated webhook routes to read raw request bodies, verify signatures when secrets are configured, then parse JSON and record events.
- Added `lib/checkout/payment-webhook-transition-plan.ts` for pure webhook-to-checkout state transition planning.
- Integrated trusted webhook state transitions into `payment-webhook-service.ts` so matched trusted webhook events can update `CheckoutPaymentAttempt.status`, `CheckoutOrder.status`, and payment-result timeline events after the webhook event is created.
- Added `lib/checkout/payment-settlement-reconciliation.ts` for pure settlement classification.
- Added `lib/checkout/payment-settlement-service.ts` for read-only settlement summaries derived from recorded `CheckoutPaymentEvent` rows.
- Added `prisma/migrations/20260604170000_add_payment_settlement_reconciliation/migration.sql` for durable `PaymentSettlementReconciliation` records.
- Added `lib/checkout/payment-settlement-repository.ts` for raw-SQL settlement reconciliation upsert/list helpers.
- Added `components/admin/AdminPaymentSettlementSummaryPanel.tsx` and `app/admin/payments/settlement/page.tsx` for authenticated settlement visibility.
- Added `Payment settlement` to the main admin sidebar under Customer Ops.
- Added `lib/checkout/payment-webhook-alerts.ts` for retry/alert planning around failed, pending, missing-attempt, stale-pending, and settlement-mismatch payment webhook events.
- Added `lib/checkout/payment-webhook-alert-service.ts`, `components/admin/AdminPaymentWebhookAlertsPanel.tsx`, and `app/admin/payments/alerts/page.tsx` for read-only operator alert visibility.
- Added `Payment alerts` to the main admin sidebar under Customer Ops.
- Added supplemental source/pure guard tests for webhook service, route handling, signatures, state transitions, settlement reconciliation, settlement repository, settlement summary service, admin settlement visibility, settlement navigation, webhook alert planning, webhook alert admin visibility, and webhook alert navigation.
- Kept supplemental test files separate because edits to `tests/unit/run-tests.ts` have been unreliable in the connector environment.

## Still pending before Phase 32 is complete

- Wire supplemental Phase 32 test files into `tests/unit/run-tests.ts` when runner edits are safe, or fold their coverage into an existing wired test file.
- Validate Stripe and ZarinPal webhook signature behavior against live/staging provider dashboards.
- Integrate durable settlement reconciliation upserts into the webhook service path after payment events are recorded.
- Run production/staging webhook smoke tests with real provider credentials and callback URLs.

## Notes

Phase 32 now has an end-to-end foundation from provider webhook receipt to idempotent event persistence, optional signature verification, trusted matched checkout state transitions, durable settlement reconciliation storage, operator settlement visibility, sidebar navigation for settlement and alert workflows, retry/alert planning, and a read-only alert surface. Production trust still depends on configured webhook secrets, live provider dashboard validation, service-path reconciliation wiring, and smoke testing. Dashboard imports and actual outbound alert delivery remain pending.
