import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createAdminCatalogPageTranslator, getAdminCatalogPageCopy } from '../../lib/localization/admin-catalog-page-copy';

export async function runAdminCatalogPageCopyTests() {
  const fa = createAdminCatalogPageTranslator('fa-IR');

  assert.equal(fa('catalogPagination'), 'صفحه‌بندی کاتالوگ');
  assert.equal(fa('showing'), 'نمایش');
  assert.equal(fa('of'), 'از');
  assert.equal(fa('itemLabel'), 'محصول');
  assert.equal(fa('page'), 'صفحه');
  assert.equal(fa('previous'), 'قبلی');
  assert.equal(fa('next'), 'بعدی');
  assert.equal(getAdminCatalogPageCopy('next', 'en-CA'), 'Next');

  const helperSource = readFileSync('lib/localization/admin-catalog-page-copy.ts', 'utf8');
  assert.match(helperSource, /adminLocaleKey/);
  assert.match(helperSource, /catalogPagination/);
  assert.match(helperSource, /itemLabel/);

  const pageSource = readFileSync('app/admin/products/page.tsx', 'utf8');
  assert.match(pageSource, /resolveStorefrontLocale/);
  assert.match(pageSource, /createAdminCatalogPageTranslator/);
  assert.match(pageSource, /aria-label=\{t\('catalogPagination'\)\}/);
  assert.match(pageSource, /\{t\('showing'\)\}/);
  assert.match(pageSource, /\{t\('previous'\)\}/);
  assert.match(pageSource, /\{t\('next'\)\}/);

  console.log('admin-catalog-page-copy.test.ts passed');
}
