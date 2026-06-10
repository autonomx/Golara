import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createAdminPageShellTranslator, getAdminPageShellCopy } from '../../lib/localization/admin-page-shell-copy';

export async function runAdminPageShellCopyTests() {
  const fa = createAdminPageShellTranslator('fa-IR');
  assert.equal(fa('Operations console'), 'کنسول عملیات');
  assert.equal(fa('Admin workspaces'), 'بخش‌های مدیریت');
  assert.equal(fa('Products, categories, subcategories, and media.'), 'محصولات، دسته‌بندی‌ها، زیرمجموعه‌ها و رسانه‌ها.');
  assert.equal(fa('Payment settlement'), 'تسویه پرداخت');
  assert.equal(fa('Staff access'), 'دسترسی تیم');
  assert.equal(fa('products'), 'محصول');
  assert.equal(fa('categories'), 'دسته‌بندی');
  assert.equal(fa('Unmapped shell key'), 'Unmapped shell key');
  assert.equal(getAdminPageShellCopy('Sign in', 'en-CA'), 'Sign in');

  const helperSource = readFileSync('lib/localization/admin-page-shell-copy.ts', 'utf8');
  assert.match(helperSource, /createAdminPageShellTranslator/);
  assert.match(helperSource, /Operations console/);
  assert.match(helperSource, /Payment settlement/);
  assert.match(helperSource, /Store configuration, staff access, and providers\./);

  console.log('admin-page-shell-copy.test.ts passed');
}
