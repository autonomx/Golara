# DigiKala-Style Payment System — Remaining Phases

Status: updated after customer-facing installment status, staff collection tracking, the P3 cancellation/refund deferral decision, COD selected-method state, the COD delivery collection read model, COD staff collection controls, the COD fulfillment completion guard, COD settlement/reconciliation fields, method-specific gateway adapter mapping, gateway production readiness evidence fields, provider reference persistence per method, gateway return method-key mapping, gateway webhook method-key mapping, gateway fallback/disable behavior, the P6 gateway refund/void adapter boundary, the P6 manual-transfer refund tracking metadata boundary, the P6 manual-transfer refund action persistence, the P6 installment cancellation/refund metadata boundary, the P6 installment reversal plan/schedule persistence boundary, the P6 installment cancellation/refund owner admin action, the P6 COD adjustment/refund metadata boundary, the P6 COD adjustment owner/admin action, the P6 admin refund/reversal status timeline, the P7 method-level settlement summary, the P7 manual-transfer settlement totals, the P7 wallet liability balance, the P7 COD collection totals, the P7 installment receivables summary, and the P7 exportable reconciliation CSV formatter.

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
- Installment approval flow creates the plan/schedule from the admin review path.
- Installment approval form supports optional first due date.
- Installment approval audit metadata records schedule plan ID and entry count.
- Customer-facing installment approval and schedule status on account orders.
- Customer-scoped installment schedule read model with upcoming schedule entries.
- Installment collection/payment tracking service for scheduled entries.
- Staff-facing installment collection controls for paid, failed, and waived schedule entries.
- Installment collection metadata, plan status updates, order timeline entries, and admin audit logs.
- Installment cancellation/refunds are intentionally deferred to Phase P6 after customer status and staff collection tracking.
- COD selected-method state persisted on checkout payment attempts with pending delivery collection metadata.
- COD delivery collection status read model surfaced in admin order summaries and CSV exports.
- COD staff collection controls for pending, collected, failed, and waived outcomes with timeline and audit evidence.
- COD fulfillment completion guard prevents delivered fulfillment unless COD collection is collected or waived.
- COD settlement/reconciliation fields persist settlement status and evidence on delivery collections.
- Method-specific gateway adapter mapping is now explicit in checkout provider resolution.
- Gateway production readiness evidence fields persist method/provider evidence for Iranian IPG and ZarinPal checkout attempts.
- Provider reference persistence per method stores selected method/provider reference evidence on checkout payment attempts.
- Gateway return handling maps payment results back to the selected method key.
- Gateway webhook handling maps trusted payment events back to the selected method key.
- Gateway fallback/disable behavior rejects disabled selected methods before provider routing.
- Gateway refund/void adapter boundary maps selected method metadata to the existing refund/void provider adapters.
- Manual-transfer refund tracking metadata boundary normalizes refund/void evidence before wiring admin persistence.
- Manual-transfer refund action persistence stores refund/void tracking metadata on owner refund and void transitions.
- Completed checkpoint: Start **Phase P6 — wire manual-transfer refund tracking into admin actions** is now complete.
- Installment cancellation/refund metadata boundary normalizes cancellation and refund evidence before wiring plan and schedule persistence.
- Installment cancellation/refund plan and schedule persistence stores reversal metadata on installment plans, eligible schedule entries, and order timelines.
- Installment cancellation/refund owner admin action records owner-triggered cancellation/refund reversals from the installment operations page.
- COD adjustment/refund metadata boundary normalizes adjustment, refund, and void evidence before owner action persistence.
- Completed checkpoint: Start **Phase P6 — COD adjustment workflow** is now complete.
- COD adjustment owner/admin action records owner-triggered adjustment, refund, and void evidence on COD payment attempts and order timelines.
- Completed checkpoint: Start **Phase P6 — wire COD adjustment metadata into owner/admin actions** is now complete.
- Admin refund/reversal status timeline classifies refund, void, cancellation, and adjustment events across payment lanes.
- Completed checkpoint: Start **Phase P6 — admin refund/reversal status timeline** is now complete.
- Method-level settlement summary groups orders by selected payment method, provider, currency, status, COD collection evidence, and timeline evidence.
- Completed checkpoint: Start **Phase P7 — method-level settlement summary** is now complete.
- Manual-transfer settlement totals summarize received, pending-review, needs-follow-up, and rejected buckets.
- Completed checkpoint: Start **Phase P7 — manual transfer received/pending totals** is now complete.
- Wallet liability balance summarizes available and reserved customer wallet balances alongside wallet-selected order capture/refund evidence.
- Completed checkpoint: Start **Phase P7 — wallet liability balance** is now complete.
- COD collection totals summarize collected, pending, failed, waived, settlement mode, and owner adjustment evidence.
- Completed checkpoint: Start **Phase P7 — COD collection totals** is now complete.
- Installment receivables summary aggregates paid, pending, failed, waived, overdue, and remaining schedule balances.
- Completed checkpoint: Start **Phase P7 — installment receivables summary** is now complete.
- Exportable reconciliation CSV formatter emits method-level, manual-transfer, wallet, COD, and installment receivables summaries.
- Completed checkpoint: Start **Phase P7 — exportable reconciliation CSVs** is now complete.

## Remaining implementation phases

### Phase P3 — Installment/credit purchase workflow

Continue installment as an approval and collection workflow first, then leave provider integration behind a future adapter.

Deferral decision: installment cancellation/refunds are intentionally deferred to Phase P6 so method-aware refund and reversal behavior can be handled consistently across wallet, gateway, manual-transfer, installment, and COD lanes. No active cancellation/refund deliverable remains in P3.

Remaining deliverables:
- Optional future provider adapter boundary.

### Phase P4 — Cash/pay-on-delivery workflow

Implement COD as a fulfillment-linked collection workflow.

Deliverables:
- Done for this phase; future COD adjustment/refund behavior is tracked in P6 and dashboard totals are tracked in P7.

### Phase P5 — Gateway adapter expansion

Keep the current provider config, but make gateway selection method-aware.

Deliverables:
- Done for this phase; future gateway refund/void behavior is tracked in P6.

### Phase P6 — Refunds and reversals per method

Make refund behavior method-aware across all payment lanes.

Deliverables:
- Done for this phase; refund/reversal status is now classified in the admin order activity timeline, and dashboard totals move to P7.

### Phase P7 — Settlement and reconciliation dashboards

Unify settlement views across all DigiKala-style methods.

Deliverables:
- Admin reconciliation CSV route wiring.
- Dashboard panels for settlement summaries.

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

Start **Phase P7 — admin reconciliation CSV route wiring**. Keep it narrow: add an owner-only admin CSV endpoint that uses the reconciliation CSV formatter and existing P7 read models before adding dashboard panels.
