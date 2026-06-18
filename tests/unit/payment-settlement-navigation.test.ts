import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentSettlementNavigationTests() {
  const adminConsole = source('app/admin/AdminConsolePage.tsx');
  const adminPageShell = source('components/admin/AdminPageShell.tsx');
  const settlementPage = source('app/admin/payments/settlement/page.tsx');

  assert.ok(adminConsole.includes('AdminPageShell, type AdminNavKey'));
  assert.ok(adminConsole.includes("'payment-settlement': '/admin/payments/settlement'"));
  assert.match(adminConsole, /Admin \/ Payments/);
  assert.match(adminConsole, /مدیریت \/ پرداخت/);
  assert.ok(adminConsole.includes('<AdminPageShell activeTab={activeTab} activeNavKey={resolvedActiveNavKey}'));

  assert.match(adminPageShell, /CreditCard/);
  assert.ok(adminPageShell.includes("href: '/admin/payments/settlement'"));
  assert.ok(adminPageShell.includes("key: 'payment-settlement'"));
  assert.ok(adminPageShell.includes("'payment-settlement': 'Payment settlement'"));

  assert.ok(settlementPage.includes('AdminPageShell'));
  assert.ok(settlementPage.includes('activeNavKey="payment-settlement"'));
  assert.match(settlementPage, /AdminPaymentSettlementSummaryPanel/);
  assert.match(settlementPage, /paymentSettlementService\.summary\(50\)/);

  console.log('payment-settlement-navigation.test.ts passed');
}
