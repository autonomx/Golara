import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getAdminCopy } from '@/lib/localization/admin-copy';

const repoRoot = process.cwd();
const pageSource = readFileSync(join(repoRoot, 'app/admin/payments/operations/preview/page.tsx'), 'utf8');
const copySource = readFileSync(join(repoRoot, 'lib/localization/admin-copy.ts'), 'utf8');

const requiredKeys = [
  'Admin / Payments',
  'Payment operation preview',
  'Payment operations',
  'Back to settlement',
  'Signed in as',
  'Admin authentication is required to view payment operation previews.',
  'Admin authentication is not configured yet.',
  'Preview sample validation failed'
];

for (const key of requiredKeys) {
  assert.ok(pageSource.includes(`t(${JSON.stringify(key)})`), `${key} must stay wrapped with the admin translator`);
  assert.ok(copySource.includes(`${JSON.stringify(key)}:`) || copySource.includes(`'${key.replace(/'/g, "\\'")}':`), `${key} must have Persian admin-copy coverage`);
  assert.notEqual(getAdminCopy(key, 'fa'), key, `${key} must resolve to Persian admin copy`);
}

assert.ok(pageSource.includes('resolveStorefrontLocale()'), 'payment preview page must resolve the storefront locale');
assert.ok(pageSource.includes('createAdminTranslator(locale)'), 'payment preview page must create the admin translator from the resolved locale');
assert.ok(pageSource.includes('dir={getStorefrontCopyDirection(locale)}'), 'payment preview page must set document direction from the locale');

const wrappedFragments = [
  'Read-only Phase 33 preview entry point for refund and void planning.'
];

for (const fragment of wrappedFragments) {
  assert.ok(pageSource.includes(`t('${fragment}`), `payment preview page diagnostic copy fragment must stay wrapped: ${fragment}`);
}

const forbiddenRawJsx = [
  '>Admin / Payments<',
  '>Payment operation preview<',
  '>Payment operations<',
  '>Back to settlement<',
  '>Preview sample validation failed<',
  '>Admin authentication is not configured yet.<'
];

for (const fragment of forbiddenRawJsx) {
  assert.ok(!pageSource.includes(fragment), `payment preview page must not render raw copy fragment ${fragment}`);
}

console.log('admin payment preview page copy guard passed');
