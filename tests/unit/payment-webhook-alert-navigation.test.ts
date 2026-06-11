import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function assertAdminCopyKey(adminCopy: string, key: string) {
  assert.ok(adminCopy.includes(`'${key}':`), `${key} should be present in admin localization copy`);
}

export async function runPaymentWebhookAlertNavigationTests() {
  const adminConsole = source('app/admin/AdminConsolePage.tsx');
  const alertPage = source('app/admin/payments/alerts/page.tsx');
  const adminCopy = source('lib/localization/admin-copy.ts');
  const routeCopyKeys = [
    'Admin / Payments',
    'Webhook alerts',
    'Review payment webhook events that need operator attention, retries, or provider dashboard follow-up.',
    'Settlement',
    'Back to orders',
    'Signed in as',
    'Admin authentication is required to view webhook alerts.',
    'Admin authentication is not configured yet.'
  ];

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
  assert.ok(alertPage.includes('resolveStorefrontLocale'));
  assert.ok(alertPage.includes('createAdminTranslator(locale)'));
  assert.ok(alertPage.includes('locale={locale}'));

  for (const key of routeCopyKeys) {
    assert.ok(alertPage.includes(`t('${key}')`), `${key} should be translated through the admin route translator`);
    assertAdminCopyKey(adminCopy, key);
  }

  assert.ok(!alertPage.includes('>Webhook alerts<'), 'route heading should not be hard-coded as JSX text');
  assert.ok(!alertPage.includes('>Settlement<'), 'settlement link should not be hard-coded as JSX text');
  assert.ok(!alertPage.includes('>Back to orders<'), 'orders link should not be hard-coded as JSX text');

  console.log('payment-webhook-alert-navigation.test.ts passed');
}
