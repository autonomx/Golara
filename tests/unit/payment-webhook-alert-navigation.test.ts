import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentWebhookAlertNavigationTests() {
  const adminConsole = source('app/admin/AdminConsolePage.tsx');
  const alertPage = source('app/admin/payments/alerts/page.tsx');

  assert.match(adminConsole, /Bell/);
  assert.ok(adminConsole.includes("href: '/admin/payments/alerts'"));
  assert.ok(adminConsole.includes("key: 'payment-alerts'"));
  assert.ok(adminConsole.includes("'payment-alerts': 'Payment alerts'"));
  assert.ok(adminConsole.includes("'payment-alerts': 'هشدارهای پرداخت'"));
  assert.match(adminConsole, /Payment webhook alerts/);
  assert.match(adminConsole, /هشدارهای وبهوک پرداخت/);
  assert.ok(alertPage.includes('AdminPageShell'));
  assert.ok(alertPage.includes('activeNavKey="payment-alerts"'));
  assert.match(alertPage, /AdminPaymentWebhookAlertsPanel/);
  assert.match(alertPage, /paymentWebhookAlertService\.summary\(50\)/);
  assert.match(alertPage, /href="\/admin\/payments\/settlement"/);

  console.log('payment-webhook-alert-navigation.test.ts passed');
}
