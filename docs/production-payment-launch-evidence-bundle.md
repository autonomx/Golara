# Production Payment Launch Evidence Bundle

Last updated: 2026-06-16

Use this bundle before an owner signs off on production gateway checkout with DigiKala-style payment methods. It consolidates repository-side evidence references and target-environment capture prompts. It does **not** claim that staging or production validation has been completed.

This bundle supplements:

- `docs/LAUNCH_AUDIT.md`
- `docs/PRODUCTION_CHECKLIST.md`
- `docs/production-payment-gateway-launch-checklist.md`
- `docs/production-roadmap-phase32-payment-webhook-smoke-tests.md`
- `docs/production-roadmap-phase32-payment-webhook-validation-evidence.md`
- `docs/production-roadmap-phase32-settlement-migration-contract.md`
- `lib/settings/payment-method-readiness-gate.ts`
- `lib/settings/payment-method-smoke-checklist.ts`

## 1. Bundle scope

Record this header for the target deployment:

- Target environment and deployment URL.
- Target git SHA.
- Checkout mode under review.
- Enabled payment methods.
- Enabled payment providers.
- Owner/operator collecting evidence.
- Date/time evidence was collected.
- Storage location for sensitive screenshots, CSV files, provider dashboard exports, and operator notes.

Do not commit provider dashboard screenshots, customer data, bank references, phone numbers, addresses, payment tokens, webhook secrets, CSV exports, or production order identifiers to source control. Store sensitive evidence in the operator-approved launch folder or ticketing system.

## 2. Method-level evidence packet

For every enabled payment method, capture one row of evidence:

| Field | Evidence to record |
| --- | --- |
| Method key | Configured payment method key shown in `/admin/payment-methods`. |
| Enabled/default/manual-review state | Snapshot or operator note from the admin payment-method settings panel. |
| Readiness status | Output from the non-blocking readiness summary, including any missing operational evidence keys. |
| Smoke checklist status | Completed source-controlled smoke items from `lib/settings/payment-method-smoke-checklist.ts`. |
| Customer-facing copy | Order detail, confirmation, receipt, instruction, approval/rejection, or reminder copy visible to the customer. |
| Admin evidence | Admin order/payment surface showing selected method, provider/manual-review state, and method-specific metadata. |
| Settlement/reconciliation evidence | `/admin/payments/settlement` snapshot and `/admin/payments/reconciliation/csv` output after representative activity exists. |
| Notification delivery evidence | Admin delivery visibility showing queued, failed, retry-pending, sent, or skipped communication evidence when applicable. |
| Rollback owner | Person responsible for disabling the method or reverting checkout mode if validation fails. |

Required method lanes:

- Gateway/IPG: provider checkout creation, return mapping, webhook method-key mapping, provider reference persistence, settlement visibility, duplicate event safety, and failed/cancelled behavior.
- Wallet/store credit: wallet debit, wallet refund receipt, liability balance, idempotency, and overspend rejection evidence.
- Manual transfer/card-to-card: customer instruction copy, reference/proof capture, received/rejected/follow-up staff workflow, and manual-transfer settlement totals.
- Installment/credit: request capture, approval/rejection/follow-up copy, schedule creation, collection status, and installment receivables summary.
- COD: delivery collection reminder, collected/failed/waived staff action, fulfillment completion guard, adjustment/refund evidence, and COD collection totals.

## 3. Admin and export snapshot index

Attach or link target-environment evidence for these surfaces:

- `/admin/payment-methods` — readiness warnings for enabled methods, missing operational evidence keys, default method, manual-review requirements, and method ordering.
- `/admin/payments/settlement` — P7 settlement dashboard panels for method-level totals, manual-transfer totals, wallet liability, COD collections, and installment receivables.
- `/admin/payments/reconciliation/csv` — CSV export containing method-level, manual-transfer, wallet, COD, and installment sections.
- Admin order detail/timeline — selected payment method, provider reference/manual-review metadata, refund/reversal timeline events, and communication delivery evidence.
- Customer account/order detail — method-specific confirmation, receipt, instruction, approval/rejection, or reminder copy.
- Provider dashboard or local operation log — provider-generated payment/webhook evidence or local-operation evidence for non-gateway methods.

## 4. Final go/no-go alignment

Before final owner sign-off, confirm:

- `docs/LAUNCH_AUDIT.md` has the target deployment audit, smoke audit, owner sign-off, and rollback notes.
- `docs/PRODUCTION_CHECKLIST.md` is complete for environment, secrets, database, media storage, notification mode, deploy-readiness, and data-safety confirmations.
- `docs/production-payment-gateway-launch-checklist.md` is complete for gateway mode, provider secrets, Phase 32 settlement/webhook confirmations, method-level readiness, provider dashboard checks, admin verification, and rollback notes.
- `docs/production-roadmap-phase32-payment-webhook-validation-evidence.md` records provider-generated webhook validation when gateway/IPG methods are in scope.
- `docs/production-roadmap-phase32-settlement-migration-contract.md` has been checked against the target database before setting `PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED=true`.
- `APP_MODE="production" npm run check:deploy-readiness` has been run against production-like environment variables and passed for the intended checkout mode.
- Every enabled method has either complete evidence or an owner-approved decision to keep the method disabled until evidence is complete.

## 5. Current status

This file is a source-controlled evidence bundle template. It is intentionally non-blocking and does not enable checkout enforcement. Target-environment payment validation, provider dashboard evidence, production database verification, CSV capture, notification delivery evidence, and owner go/no-go sign-off remain operator tasks.
