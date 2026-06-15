# DigiKala-Style Payment System — Remaining Phases

Status: updated after wallet/store-credit checkout capture merged.

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

## Remaining implementation phases

### Phase P2 — Wallet/store-credit refunds and customer history

Complete customer/admin wallet visibility and wallet reversal behavior.

Deliverables:
- Refund-to-wallet support.
- Customer account wallet history page.
- Admin/customer timeline visibility for wallet debits, credits, and reversals.
- Wallet refund receipt metadata.
- Wallet refund idempotency and reversal guards.

### Phase P3 — Installment/credit purchase workflow

Implement installment as an approval workflow first, then leave provider integration behind a future adapter.

Deliverables:
- Installment request capture at checkout.
- Admin approval/rejection workflow.
- Payment/order state machine for pending credit approval.
- Due-date/installment schedule model.
- Customer-facing approval status.
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
- Wallet refund ledger entries.
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

Start with **Phase P2 — Wallet/store-credit customer history or refund-to-wallet support**. Wallet checkout can now capture funds safely; the next useful capability is either customer-visible wallet history or method-aware refund entries back into the wallet ledger.
