import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getAdminCopy } from '@/lib/localization/admin-copy';

const repoRoot = process.cwd();
const pageSource = readFileSync(join(repoRoot, 'app/admin/payments/operations/history/page.tsx'), 'utf8');
const copySource = readFileSync(join(repoRoot, 'lib/localization/admin-copy.ts'), 'utf8');

const requiredKeys = [
  'Admin / Payments',
  'Payment operation history',
  'Read-only Phase 33 operation history entry point for persisted refund and void records. Provide an orderId query parameter to review migration-gated operation records without creating records, calling providers, or mutating orders/payments.',
  'Payment operations',
  'Preview operations',
  'Back to settlement',
  'Signed in as',
  'Admin authentication is required to view payment operation history.',
  'Admin authentication is not configured yet.',
  'History request validation failed',
  'Payment operation records unavailable',
  'Migration confirmation required',
  'Flag',
  'Migration'
];

for (const key of requiredKeys) {
  assert.match(pageSource, new RegExp(`t\\(${JSON.stringify(key).replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\)`), `${key} must stay wrapped with the admin translator`);
  assert.ok(copySource.includes(`${JSON.stringify(key)}:`) || copySource.includes(`'${key.replace(/'/g, "\\'")}':`), `${key} must have Persian admin-copy coverage`);
  assert.notEqual(getAdminCopy(key, 'fa'), key, `${key} must resolve to Persian admin copy`);
}

assert.match(pageSource, /resolveStorefrontLocale\(\)/, 'history route must resolve the storefront locale');
assert.match(pageSource, /createAdminTranslator\(locale\)/, 'history route must create the admin translator from the resolved locale');
assert.match(pageSource, /getStorefrontCopyDirection\(locale\)/, 'history route shell must use locale direction');

const forbiddenRawJsx = [
  />Payment operation history</,
  />Payment operations</,
  />Preview operations</,
  />Back to settlement</,
  />History request validation failed</,
  />Payment operation records unavailable</,
  />Migration confirmation required</,
  />Flag</,
  />Migration</
];

for (const fragment of forbiddenRawJsx) {
  assert.ok(!pageSource.includes(fragment), `history route must not render raw copy fragment ${fragment}`);
}

console.log('admin payment history page copy guard passed');
