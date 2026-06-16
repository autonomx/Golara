# DigiKala-Style Payment System — Remaining Phases

Status: updated after installment schedule foundation merged.

## Completed foundations

- Configurable payment method registry with database-backed settings and default enabled methods.
- Admin visibility page for payment methods.
- Admin controls to enable/disable methods, choose defaults, set manual-review requirements, and order methods.
- Checkout method selection driven by enabled payment methods.
- Admin order visibility for selected payment method, provider, and manual-review state.
- Bank-transfer/card-to-card checkout instructions with optional customer reference/proof-link capture.
- Manual-transfer/card-to-card verification workflow with a dedicated admin review queue.
- Manual-transfer verification outcomes: received, rejected, and needs follow-up.
- Manual-transfer audit metadata: verifier, timestamp, note, received amount, and provider/bank reference.
- Customer wallet balance and immutable ledger tables.
- Owner-only wallet credit/debit adjustment controls.
- Wallet ledger idempotency, row-locking, overspend protection, and audit logging foundations.
- Admin wallet balance visibility page.
- Wallet checkout reservation/capture flow for wallet-selected payments.
- Wallet payment attempt transition to paid after successful capture.
- Wallet checkout idempotency keys for reservation/capture ledger entries.
- Wallet checkout double-spend protection through locked balance rows and insufficient-balance rejection.
- Wallet checkout inventory/capacity confirmation after capture.
- Customer account wallet history page.
- Customer wallet balance summary and ledger-entry history.
- Account overview navigation to wallet history.
- Refund-to-wallet workflow for paid payment attempts.
- Wallet refund idempotency and over-refund protection.
- Wallet refund ledger entries with locked balance updates.
- Owner-only wallet refund admin action with audit logging.
- Wallet refund admin page for order/payment-attempt initiated refunds.
- Payment-attempt refund metadata and full-refund transition to refunded.
- Customer-facing wallet refund receipt/details in account wallet history.
- Wallet refund receipt metadata display in customer wallet history.
- Admin order/payment visibility for wallet refund metadata.
- Staff-facing wallet refund receipt details in admin orders and CSV exports.
- Method-aware wallet refund status fields on admin order summaries.
- Installment/credit request capture at checkout.
- Installment checkout metadata with pending-review approval status.
- Installment requested-term and customer-note capture without undefined metadata persistence.
- Installment admin review queue.
- Owner-only installment approval, rejection, and follow-up workflow.
- Installment review audit logging and metadata persistence for reviewer, timestamp, approved term, down payment, and review note.
- Installment rejection transition to failed payment status while approval/follow-up remains pending for schedule setup.
- Installment plan and schedule tables.
- Idempotent installment schedule creation service for approved payment attempts.
- Installment schedule metadata persisted onto payment-attempt metadata.
- Order timeline event for installment schedule creation.

## Remaining implementation phases

### Phase P3 — Installment/credit purchase workflow

Continue installment as an approval workflow first, then leave provider integration behind a future adapter.

Remaining deliverables:
- Wire approved installment review into schedule creation/admin flow.
- Customer-facing approval and schedule status.
- Installment collection/payment tracking against schedule entries.
- Optional future provider adapter boundary.

### Phase P4 — Cash/pay-on-delivery workflow

Implement COD as a fulfillment-linked collection workflow.

Deliverables:
- COD selected-method state on orders.
- Delivery collection status: pending, collected, failed, waived.
- Staff controls for collection confirmation.
- Settlement/reconciliation fields for delivery collections.
- Rules to prevent fulfillment completion without required collection state.

### Phase P5 — Gateway adapter expansion

Keep the current provider config, but make gateway selection method-aware.

Deliverables:
- Method-specific gateway adapter mapping.
- Iranian IPG/ZarinPal production readiness evidence fields.
- Provider reference persistence per method.
- Return/webhook mapping back to selected method key.
- Gateway fallback/disable behavior when a method is turned off.

### Phase P6 — Refunds and reversals per method

Make refund behavior method-aware across all payment lanes.

Deliverables:
- Gateway refund/void adapter boundary.
- Manual-transfer refund tracking.
- Installment cancellation/refund workflow.
- COD adjustment workflow.
- Admin refund/reversal status timeline.

### Phase P7 — Settlement and reconciliation dashboards

Unify settlement views across all DigiKala-style methods.

Deliverables:
- Method-level settlement summary.
- Manual transfer received/pending totals.
- Wallet liability balance.
- COD collection totals.
- Installment receivables summary.
- Exportable reconciliation CSVs.

### Phase P8 — Customer communication and receipts

Add customer-facing status and notifications for each method.

Deliverables:
- Method-specific order confirmation copy.
- Manual-transfer instructions in order detail and emails.
- Wallet debit/refund receipts.
- Installment approval/rejection messages.
- COD collection reminders.
- Notification persistence and retry evidence.

### Phase P9 — Production readiness gates

Extend existing payment production gates to cover all configured methods.

Deliverables:
- Readiness gate per payment method.
- Admin warning when enabled methods lack required operational evidence.
- Smoke-test checklist per method.
- Launch checklist updates.
- CI/source guards for method-specific production safety.

## Recommended next slice

Continue **Phase P3 — wire installment approval into schedule creation/admin flow**. Schedule tables and creation helpers now exist, but approval needs a staff-safe path to create and expose the schedule before customer-facing status and receivables can be completed.
