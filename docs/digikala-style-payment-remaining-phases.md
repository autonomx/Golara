# DigiKala-style payment remaining phases

This roadmap tracks the remaining production work for method-specific payment operations after the completed checkout/payment foundations.

## Current focus

Phase P7 — Settlement and reconciliation dashboards.

## Completed phases

### Phase P1 — Method configuration foundation

Payment method configuration, normalization, visibility controls, and admin method metadata are complete.

### Phase P2 — Customer-facing payment method selection

Checkout method selection, customer-facing payment copy, and method-specific instructions are complete.

### Phase P3 — Wallet and manual-transfer foundations

Wallet ledger, wallet checkout capture, manual-transfer upload/review, and related admin workflows are complete.

### Phase P4 — Installments and COD foundations

Installment review/schedule/collection and COD collection/readiness foundations are complete.

### Phase P5 — Gateway production readiness

Gateway method mapping, readiness evidence, provider-reference persistence, return/event selected-method mapping, and disabled-method fallback are complete.

### Phase P6 — Refunds and reversals per method

Make refund behavior method-aware across all payment lanes.

Deliverables:
- Done for this phase; refund/reversal status is now classified in the admin order activity timeline, and dashboard totals move to P7.

### Phase P7 — Settlement and reconciliation dashboards

Unify settlement views across all DigiKala-style methods.

Deliverables:
- Method-level settlement summary boundary is complete.
- Manual-transfer settlement totals are complete.
- Wallet liability balance summary is complete.
- COD collection totals are complete.
- Installment receivables summary is complete.
- Exportable reconciliation CSV formatter emits method-level, manual-transfer, wallet, COD, and installment receivables summaries.
- Admin reconciliation CSV route is owner-only and uses the reconciliation formatter with existing P7 read models.
- Dashboard panels for settlement summaries.

Completed checkpoints:
- Completed checkpoint: Start **Phase P7 — method-level settlement summary** is now complete.
- Completed checkpoint: Start **Phase P7 — manual-transfer received/pending totals** is now complete.
- Completed checkpoint: Start **Phase P7 — wallet liability balance** is now complete.
- Completed checkpoint: Start **Phase P7 — COD collection totals** is now complete.
- Completed checkpoint: Start **Phase P7 — installment receivables summary** is now complete.
- Completed checkpoint: Start **Phase P7 — exportable reconciliation CSVs** is now complete.
- Completed checkpoint: Start **Phase P7 — admin reconciliation CSV route wiring** is now complete.

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

Start **Phase P7 — dashboard panels for settlement summaries**. Keep it narrow: add a read-only admin page/panel that renders the existing P7 settlement summaries before adding additional filters or charts.
