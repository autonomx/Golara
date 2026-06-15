# DigiKala-Style Payment System — Remaining Phases

Status: updated after the manual-transfer checkout slice merged.

## Completed foundations

- Configurable payment method registry with database-backed settings and default enabled methods.
- Admin visibility page for payment methods.
- Admin controls to enable/disable methods, choose defaults, set manual-review requirements, and order methods.
- Checkout method selection driven by enabled payment methods.
- Admin order visibility for selected payment method, provider, and manual-review state.
- Bank-transfer/card-to-card checkout instructions with optional customer reference/proof-link capture.

## Remaining implementation phases

### Phase P1 — Manual transfer verification workflow

Add staff-side verification for card-to-card/bank-transfer payments.

Deliverables:
- Admin payment review queue filtered by manual-transfer attempts.
- Mark transfer as received, rejected, or needs follow-up.
- Store verification actor, timestamp, note, and received amount.
- Move order/payment state forward only after staff verification.
- Add audit logs and guards for verification actions.

### Phase P2 — Wallet/store-credit ledger

Implement internal wallet behavior without pretending external wallet execution exists.

Deliverables:
- Customer wallet balance table and immutable ledger entries.
- Admin credit/debit controls with owner-only guard.
- Checkout wallet debit reservation/capture flow.
- Refund-to-wallet support.
- Customer account wallet history page.
- Overspend, double-spend, and concurrent-checkout guards.

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

Make refund behavior method-aware.

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

Start with **Phase P1 — Manual transfer verification workflow** because manual transfer is already visible in checkout and now captures optional reference/proof metadata. Staff verification is the next required step before these payments can safely move orders forward.
