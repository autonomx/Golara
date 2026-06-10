import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createAdminRouteLoadingTranslator, getAdminRouteLoadingCopy } from '../../lib/localization/admin-route-loading-copy';

export async function runAdminRouteLoadCopyTests() {
  const fa = createAdminRouteLoadingTranslator('fa-IR');
  assert.equal(fa('Admin'), 'مدیریت');
  assert.equal(fa('Operations console'), 'کنسول عملیات');
  assert.equal(fa('Loading module'), 'در حال بارگیری بخش');
  assert.equal(fa('Loading catalog'), 'در حال بارگیری کاتالوگ');
  assert.equal(fa('Loading sales'), 'در حال بارگیری فروش');
  assert.equal(fa('Unknown load key'), 'Unknown load key');
  assert.equal(getAdminRouteLoadingCopy('Loading admin', 'en-CA'), 'Loading admin');

  const helperSource = readFileSync('lib/localization/admin-route-loading-copy.ts', 'utf8');
  assert.match(helperSource, /createAdminRouteLoadingTranslator/);
  assert.match(helperSource, /'Loading module'/);
  assert.match(helperSource, /'Loading catalog'/);
  assert.match(helperSource, /'Loading sales'/);

  const componentSource = readFileSync('components/admin/AdminRouteLoading.tsx', 'utf8');
  assert.match(componentSource, /createAdminRouteLoadingTranslator\(locale\)/);
  assert.match(componentSource, /useMemo\(\(\) => createAdminRouteLoadingTranslator\(locale\), \[locale\]\)/);
  assert.match(componentSource, /title = 'Admin'/);
  assert.match(componentSource, /eyebrow = 'Loading module'/);
  assert.match(componentSource, /t\('Operations console'\)/);
  assert.match(componentSource, /t\(eyebrow\)/);
  assert.match(componentSource, /t\(title\)/);

  console.log('admin-route-load-copy.test.ts passed');
}
