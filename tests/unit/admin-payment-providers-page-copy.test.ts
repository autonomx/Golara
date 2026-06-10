import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getAdminCopy } from '@/lib/localization/admin-copy';

const repoRoot = process.cwd();
const pageSource = readFileSync(join(repoRoot, 'app/admin/payments/operations/providers/page.tsx'), 'utf8');
const copySource = readFileSync(join(repoRoot, 'lib/localization/admin-copy.ts'), 'utf8');

const requiredKeys = [
  'Admin / Payments',
  'Payment provider readiness',
  'Payment operations',
  'Operation history',
  'Preview operations',
  'Back to settlement',
  'Signed in as',
  'Admin authentication is required to view payment provider readiness.',
  'Admin authentication is not configured yet.'
];

for (const key of requiredKeys) {
  assert.ok(pageSource.includes(`t(${JSON.stringify(key)})`), `${key} must stay wrapped with the admin translator`);
  assert.ok(copySource.includes(`${JSON.stringify(key)}:`) || copySource.includes(`'${key.replace(/'/g, "\\'")}':`), `${key} must have Persian admin-copy coverage`);
  assert.notEqual(getAdminCopy(key, 'fa'), key, `${key} must resolve to Persian admin copy`);
}

assert.ok(pageSource.includes('resolveStorefrontLocale()'), 'payment providers page must resolve the storefront locale');
assert.ok(pageSource.includes('createAdminTranslator(locale)'), 'payment providers page must create the admin translator from the resolved locale');
assert.ok(pageSource.includes('dir={getStorefrontCopyDirection(locale)}'), 'payment providers page must set document direction from the locale');

const wrappedFragments = [
  'Read-only Phase 33 diagnostics for refund and void provider readiness.',
  'Execution remains disabled.'
];

for (const fragment of wrappedFragments) {
  assert.ok(pageSource.includes(`t('${fragment}`), `payment providers page diagnostic copy fragment must stay wrapped: ${fragment}`);
}

const forbiddenRawJsx = [
  '>Admin / Payments<',
  '>Payment provider readiness<',
  '>Payment operations<',
  '>Operation history<',
  '>Preview operations<',
  '>Back to settlement<',
  '>Admin authentication is not configured yet.<'
];

for (const fragment of forbiddenRawJsx) {
  assert.ok(!pageSource.includes(fragment), `payment providers page must not render raw copy fragment ${fragment}`);
}

console.log('admin payment providers page copy guard passed');
