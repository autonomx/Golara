import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getAdminCopy } from '@/lib/localization/admin-copy';

const repoRoot = process.cwd();
const pageSource = readFileSync(join(repoRoot, 'app/admin/payments/settlement/page.tsx'), 'utf8');
const copySource = readFileSync(join(repoRoot, 'lib/localization/admin-copy.ts'), 'utf8');

function assertAdminCopyKey(key: string) {
  assert.ok(
    copySource.includes(`${JSON.stringify(key)}:`) || copySource.includes(`'${key.replace(/'/g, "\\'")}':`),
    `${key} must have Persian admin-copy coverage`
  );
  assert.notEqual(getAdminCopy(key, 'fa'), key, `${key} must resolve to Persian admin copy`);
}

const routeCopyKeys = [
  'Admin / Payments',
  'Payment settlement',
  'Review recent payment webhook events and compare provider-reported settlement data against checkout orders.',
  'Payment operations',
  'Provider readiness',
  'Operation history',
  'Preview operations',
  'Back to orders',
  'Signed in as',
  'Admin authentication is required to view settlement data.',
  'Admin authentication is not configured yet.',
  'Refund and void operation pages are read-only Phase 33 diagnostics. They do not execute provider adapters, submit refunds or voids, mutate orders/payments, or release inventory/capacity.'
];

for (const key of routeCopyKeys) {
  assert.ok(pageSource.includes(`t(${JSON.stringify(key)})`) || pageSource.includes(`t('${key}`), `${key} must stay wrapped with the admin translator`);
  assertAdminCopyKey(key);
}

assert.ok(pageSource.includes('resolveStorefrontLocale()'), 'payment settlement page must resolve the storefront locale');
assert.ok(pageSource.includes('createAdminTranslator(locale)'), 'payment settlement page must create the admin translator from the resolved locale');
assert.ok(pageSource.includes('locale={locale}'), 'payment settlement page must pass the resolved locale into AdminPageShell');
assert.ok(pageSource.includes('activeNavKey="payment-settlement"'), 'payment settlement page must keep the localized admin shell nav selection stable');
assert.ok(pageSource.includes('<AdminPaymentSettlementSummaryPanel summary={summary} />'), 'payment settlement page should delegate settlement-table copy to the summary panel');

const forbiddenRawJsx = [
  '>Admin / Payments<',
  '>Payment settlement<',
  '>Payment operations<',
  '>Provider readiness<',
  '>Operation history<',
  '>Preview operations<',
  '>Back to orders<',
  '>Admin authentication is not configured yet.<'
];

for (const fragment of forbiddenRawJsx) {
  assert.ok(!pageSource.includes(fragment), `payment settlement page must not render raw copy fragment ${fragment}`);
}

console.log('admin payment settlement page copy guard passed');
