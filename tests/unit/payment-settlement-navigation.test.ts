import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentSettlementNavigationTests() {
  const adminConsole = source('app/admin/AdminConsolePage.tsx');
  const settlementPage = source('app/admin/payments/settlement/page.tsx');

  assert.match(adminConsole, /CreditCard/);
  assert.match(adminConsole, /href: '\/admin\/payments\/settlement'/);
  assert.match(adminConsole, /key: 'payment-settlement'/);
  assert.match(adminConsole, /'payment-settlement': 'Payment settlement'/);
  assert.match(adminConsole, /'payment-settlement': 'تسویه پرداخت'/);
  assert.match(adminConsole, /Admin \/ Payments/);
  assert.match(adminConsole, /مدیریت \/ پرداخت/);
  assert.match(settlementPage, /AdminPaymentSettlementSummaryPanel/);
  assert.match(settlementPage, /paymentSettlementService\.summary\(50\)/);

  console.log('payment-settlement-navigation.test.ts passed');
}
