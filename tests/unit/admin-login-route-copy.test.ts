import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getAdminCopy } from '@/lib/localization/admin-copy';

const repoRoot = process.cwd();
const pageSource = readFileSync(join(repoRoot, 'app/admin/login/page.tsx'), 'utf8');
const copySource = readFileSync(join(repoRoot, 'lib/localization/admin-copy.ts'), 'utf8');

function assertAdminCopyKey(key: string) {
  assert.ok(
    copySource.includes(`${JSON.stringify(key)}:`) || copySource.includes(`'${key.replace(/'/g, "\\'")}':`),
    `${key} must have Persian admin-copy coverage`
  );
  assert.notEqual(getAdminCopy(key, 'fa'), key, `${key} must resolve to Persian admin copy`);
}

const routeCopyKeys = [
  'Admin login',
  'Sign in to edit the CMS.',
  'The admin dashboard is protected by an environment-based password gate. Full multi-user roles can be added later when customer accounts are introduced.',
  'Admin auth is not configured. Set',
  'and',
  'in',
  'before using CMS writes.',
  'Admin password',
  'Sign in'
];

for (const key of routeCopyKeys) {
  assert.ok(pageSource.includes(`t(${JSON.stringify(key)})`) || pageSource.includes(`t('${key}`), `${key} must stay wrapped with the admin translator`);
  assertAdminCopyKey(key);
}

assert.ok(pageSource.includes('resolveStorefrontLocale()'), 'admin login page must resolve the storefront locale');
assert.ok(pageSource.includes('createAdminTranslator(locale)'), 'admin login page must create the admin translator from the resolved locale');
assert.ok(pageSource.includes('dir={getStorefrontCopyDirection(locale)}'), 'admin login route shell must set document direction from the locale');
assert.ok(pageSource.includes('isAdminAuthenticated()'), 'admin login page must keep authenticated users redirected before rendering login copy');
assert.ok(pageSource.includes('isAdminAuthConfigured()'), 'admin login page must keep auth configuration warnings gated');

const forbiddenRawJsx = [
  '>Admin login<',
  '>Sign in to edit the CMS.<',
  '>Admin password<',
  '>Sign in<',
  '>Admin auth is not configured. Set<',
  '>before using CMS writes.<'
];

for (const fragment of forbiddenRawJsx) {
  assert.ok(!pageSource.includes(fragment), `admin login route must not render raw copy fragment ${fragment}`);
}

console.log('admin-login-route-copy.test.ts passed');
