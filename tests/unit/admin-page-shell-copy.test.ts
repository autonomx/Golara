import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createAdminPageShellTranslator, getAdminPageShellCopy } from '../../lib/localization/admin-page-shell-copy';

export async function runAdminPageShellCopyTests() {
  const fa = createAdminPageShellTranslator('fa-IR');
  assert.equal(fa('Operations console'), 'کنسول عملیات');
  assert.equal(fa('Admin navigation'), 'ناوبری مدیریت');
  assert.equal(fa('Admin workspaces'), 'بخش‌های مدیریت');
  assert.equal(fa('Store'), 'فروشگاه');
  assert.equal(fa('Customer Ops'), 'عملیات مشتری');
  assert.equal(fa('System'), 'سیستم');
  assert.equal(fa('Products, categories, subcategories, and media.'), 'محصولات، دسته‌بندی‌ها، زیرمجموعه‌ها و رسانه‌ها.');
  assert.equal(fa('Payment settlement'), 'تسویه پرداخت');
  assert.equal(fa('Staff access'), 'دسترسی تیم');
  assert.equal(fa('products'), 'محصول');
  assert.equal(fa('category'), 'دسته‌بندی');
  assert.equal(fa('categories'), 'دسته‌بندی');
  assert.equal(fa('Unmapped shell key'), 'Unmapped shell key');
  assert.equal(getAdminPageShellCopy('Sign in', 'en-CA'), 'Sign in');

  const helperSource = readFileSync('lib/localization/admin-page-shell-copy.ts', 'utf8');
  assert.match(helperSource, /createAdminPageShellTranslator/);
  assert.match(helperSource, /Operations console/);
  assert.match(helperSource, /Payment settlement/);
  assert.match(helperSource, /Store configuration, staff access, and providers\./);

  const shellSource = readFileSync('components/admin/AdminPageShell.tsx', 'utf8');
  assert.match(shellSource, /createAdminPageShellTranslator\(locale\)/);
  assert.match(shellSource, /t\('Operations console'\)/);
  assert.match(shellSource, /t\('Admin navigation'\)/);
  assert.match(shellSource, /t\('Admin workspaces'\)/);
  assert.match(shellSource, /t\(section\.label\)/);
  assert.match(shellSource, /t\(navLabels\[item\.key\]\)/);
  assert.match(shellSource, /t\(current\.label\)/);
  assert.match(shellSource, /t\(current\.description\)/);
  assert.match(shellSource, /productCount === 1 \? 'product' : 'products'/);
  assert.doesNotMatch(shellSource, /const copy = \{/);

  console.log('admin-page-shell-copy.test.ts passed');
}
