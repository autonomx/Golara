# Phase 32 Payment Webhooks and Settlement Progress

Last updated: 2026-06-04

This note supplements `docs/production-roadmap.md` while Phase 32 is in progress.

## Current status

Phase 32 is in progress. Golara now has provider-neutral payment webhook normalization, idempotent inbound webhook persistence, webhook signature verification, minimal provider webhook routes, trusted webhook-driven checkout state transitions, durable settlement reconciliation records integrated into the webhook service path, authenticated admin settlement visibility with an explicit durable/fallback source indicator, main admin navigation access, payment webhook alert planning, a read-only admin webhook alert surface, sidebar navigation for settlement and alert workflows, normal unit-runner wiring for Phase 32 supplemental payment guards, conditional deploy-readiness blockers for production gateway checkout, an operator smoke-test runbook, a production gateway launch checklist, a blank provider validation evidence template with a completion checklist, a settlement migration contract note, launch-checklist links to evidence/contract docs, production-checklist links to evidence/contract docs, and wired launch/evidence/migration-contract documentation guard coverage for:

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
- Added `lib/checkout/payment-webhook-signature.ts` for provider webhook HMAC/signing checks.
- Updated webhook routes to read raw request bodies, verify signatures when secrets are configured, then parse JSON and record events.
- Added `lib/checkout/payment-webhook-transition-plan.ts` for pure webhook-to-checkout state transition planning.
- Integrated trusted webhook state transitions into `payment-webhook-service.ts` so matched trusted webhook events can update `CheckoutPaymentAttempt.status`, `CheckoutOrder.status`, and payment-result timeline events after the webhook event is created.
- Added `lib/checkout/payment-settlement-reconciliation.ts` for pure settlement classification.
- Added `lib/checkout/payment-settlement-service.ts` for read-only settlement summaries derived from recorded `CheckoutPaymentEvent` rows.
- Added `prisma/migrations/20260604170000_add_payment_settlement_reconciliation/migration.sql` for durable `PaymentSettlementReconciliation` records.
- Added `lib/checkout/payment-settlement-repository.ts` for raw-SQL settlement reconciliation upsert/list helpers.
- Integrated settlement reconciliation upserts into `payment-webhook-service.ts` after webhook event creation and on duplicate webhook refreshes.
- Updated `payment-settlement-service.ts` so settlement summaries prefer durable `PaymentSettlementReconciliation` rows when present, with safe fallback to `CheckoutPaymentEvent`-derived summaries if the durable table is unavailable or empty.
- Updated `AdminPaymentSettlementSummaryPanel` to show whether the settlement summary is backed by durable reconciliation rows, event-derived fallback data, or unavailable data.
- Added `components/admin/AdminPaymentSettlementSummaryPanel.tsx` and `app/admin/payments/settlement/page.tsx` for authenticated settlement visibility.
- Added `Payment settlement` to the main admin sidebar under Customer Ops.
- Added `lib/checkout/payment-webhook-alerts.ts` for retry/alert planning around failed, pending, missing-attempt, stale-pending, and settlement-mismatch payment webhook events.
- Added `lib/checkout/payment-webhook-alert-service.ts`, `components/admin/AdminPaymentWebhookAlertsPanel.tsx`, and `app/admin/payments/alerts/page.tsx` for read-only operator alert visibility.
- Added `Payment alerts` to the main admin sidebar under Customer Ops.
- Added supplemental source/pure guard tests for webhook service, route handling, signatures, state transitions, settlement reconciliation, settlement repository, settlement service integration, settlement summary service, admin settlement visibility, settlement navigation, webhook alert planning, webhook alert admin visibility, and webhook alert navigation.
- Wired all Phase 32 supplemental guards into `tests/unit/run-tests.ts` and raised the runner count from 99 to 113 files.
- Added durable-first settlement summary and settlement source badge guards to the wired Phase 32 unit guards.
- Added conditional deploy-readiness blockers for production gateway deployments when provider webhook settings, settlement migration confirmation, or smoke-test confirmation are missing.
- Added `.env.example` entries for the provider webhook secret and Phase 32 confirmation flags.
- Added `docs/production-roadmap-phase32-payment-webhook-smoke-tests.md` with staging/production validation steps, required URLs, provider checks, reconciliation checks, and exit criteria.
- Added `docs/production-payment-gateway-launch-checklist.md` with gateway-mode launch scope, required provider environment, Phase 32 confirmation flags, deploy-readiness expectations, admin verification, and rollback notes.
- Added `tests/unit/payment-gateway-launch-docs.test.ts` and wired it into `tests/unit/run-tests.ts`, raising the runner count from 113 to 114 files.
- Added `docs/production-roadmap-phase32-payment-webhook-validation-evidence.md` as a blank operator evidence template for Stripe, ZarinPal, migration application, deploy-readiness output, admin settlement checks, admin alert checks, duplicate replay results, invalid signature results, operator, environment, date, and deployed SHA.
- Added `tests/unit/payment-webhook-validation-evidence-docs.test.ts` and wired it into `tests/unit/run-tests.ts`, raising the runner count from 114 to 115 files. This is a documentation/source guard and does not claim provider validation has been completed.
- Added `docs/production-roadmap-phase32-settlement-migration-contract.md` to document that `PaymentSettlementReconciliation` is migration-backed, raw-SQL accessed, not Prisma schema-backed, and must be applied and verified in the target environment before setting `PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED="true"`.
- Extended `tests/unit/payment-settlement-repository.test.ts` to guard the migration contract note alongside the existing table/repository contract guard. This reuses the existing wired guard and does not change the runner count.
- Linked the validation evidence template and settlement migration contract from `docs/production-payment-gateway-launch-checklist.md` and `docs/PRODUCTION_CHECKLIST.md` so gateway launch sign-off points to both operator evidence capture and migration contract review.
- Extended `tests/unit/payment-gateway-launch-docs.test.ts` to guard the evidence/contract links from the gateway launch checklist and canonical production checklist. This reuses the existing wired guard and does not change the runner count.
- Added this recommended validation sequence so operators can complete the remaining Phase 32 environment checks in a consistent order without treating repository documentation as provider validation evidence.
- Tightened `docs/production-roadmap-phase32-payment-webhook-validation-evidence.md` with a completion checklist requiring concrete values, links, screenshot references, command output, provider event identifiers, or operator notes before sign-off. The checklist covers deployed SHA confirmation, migration verification, provider-generated success/duplicate/invalid-signature cases, admin settlement visibility, alert review, deploy-readiness output, rollback confirmation, and confirmation-flag ordering.
- Extended `tests/unit/payment-webhook-validation-evidence-docs.test.ts` to guard the completion checklist language. This reuses the existing wired guard and does not change the runner count.

## Recommended validation sequence

Use this order before enabling production `CHECKOUT_MODE="gateway"`:

1. Deploy the intended git SHA to a staging or production-like environment with provider credentials configured.
2. Apply and verify `prisma/migrations/20260604170000_add_payment_settlement_reconciliation/migration.sql` against the target PostgreSQL database.
3. Review `docs/production-roadmap-phase32-settlement-migration-contract.md`, then set `PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED="true"` only after the target table, indexes, and admin read path are verified.
4. Configure Stripe and/or ZarinPal provider dashboard webhook endpoints for the target environment.
5. Run `docs/production-roadmap-phase32-payment-webhook-smoke-tests.md` with provider-generated requests, including success, failure/cancel, duplicate replay, and invalid-signature cases.
6. Confirm `/admin/payments/settlement` shows durable settlement records and `/admin/payments/alerts` shows expected attention states.
7. Record the results in `docs/production-roadmap-phase32-payment-webhook-validation-evidence.md` with operator, date, environment, deployed SHA, duplicate replay result, invalid signature result, and admin verification notes.
8. Set `PAYMENT_WEBHOOK_SMOKE_TESTS_CONFIRMED="true"` only after the evidence template is complete.
9. Run production deploy-readiness with gateway mode enabled and keep rollback to `CHECKOUT_MODE="inquiry"` or `CHECKOUT_MODE="assisted"` available until live traffic is verified.

## Still pending before Phase 32 is complete

- Execute the smoke-test runbook against live/staging Stripe and ZarinPal provider dashboards.
- Validate Stripe and ZarinPal webhook signature behavior against provider-generated requests.
- Apply and verify the settlement reconciliation migration in the target environment.
- Fill in `docs/production-roadmap-phase32-payment-webhook-validation-evidence.md` with real operator evidence after staging or production validation.

## Notes

Phase 32 now has an end-to-end foundation from provider webhook receipt to idempotent event persistence, optional signature verification, trusted matched checkout state transitions, durable settlement reconciliation storage integrated into the webhook service path, operator settlement visibility with explicit durable/fallback source labeling, sidebar navigation for settlement and alert workflows, retry/alert planning, a read-only alert surface, unit-runner coverage for Phase 32 webhook, settlement, admin visibility, alert, deploy-readiness, launch-documentation, validation-evidence documentation, settlement migration contract, gateway evidence-link guards, and a recommended validation sequence, conditional production gateway deploy-readiness blockers, a documented provider smoke-test runbook, a production gateway launch checklist, a blank validation evidence template with a completion checklist, and a settlement migration contract note. Production trust still depends on configured webhook secrets, live provider dashboard validation, migration application, smoke testing, and captured operator evidence. Dashboard imports and actual outbound alert delivery remain pending.
