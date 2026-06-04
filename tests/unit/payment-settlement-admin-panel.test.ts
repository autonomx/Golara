import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentSettlementAdminPanelTests() {
  const panel = source('components/admin/AdminPaymentSettlementSummaryPanel.tsx');
  const page = source('app/admin/payments/settlement/page.tsx');
  const service = source('lib/checkout/payment-settlement-service.ts');

  assert.match(service, /export const paymentSettlementService/);
  assert.match(panel, /export function AdminPaymentSettlementSummaryPanel/);
  assert.match(panel, /Settlement reconciliation/);
  assert.match(panel, /function sourceLabel/);
  assert.match(panel, /function sourceDescription/);
  assert.match(panel, /Durable settlement records/);
  assert.match(panel, /Payment event fallback/);
  assert.match(panel, /Settlement data unavailable/);
  assert.match(panel, /PaymentSettlementReconciliation rows/);
  assert.match(panel, /CheckoutPaymentEvent rows/);
  assert.match(panel, /summary\.source/);
  assert.match(panel, /summary\.settled/);
  assert.match(panel, /summary\.amountMismatch/);
  assert.match(panel, /summary\.currencyMismatch/);
  assert.match(panel, /summary\.needsAttention/);
  assert.match(panel, /No payment webhook events have been recorded yet/);
  assert.match(panel, /providerReference/);

  assert.match(page, /export const dynamic = 'force-dynamic'/);
  assert.match(page, /isAdminAuthenticated/);
  assert.match(page, /paymentSettlementService\.summary\(50\)/);
  assert.match(page, /AdminPaymentSettlementSummaryPanel/);
  assert.match(page, /Admin authentication is required to view settlement data/);
  assert.match(page, /href="\/admin\/orders"/);

  console.log('payment-settlement-admin-panel.test.ts passed');
}
