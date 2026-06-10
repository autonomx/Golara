import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createAdminHomeTranslator, getAdminHomeCopy } from '../../lib/localization/admin-home-copy';

export async function runAdminHomeCopyTests() {
  const fa = createAdminHomeTranslator('fa-IR');

  assert.equal(fa('occasionsLabel'), 'مناسبت‌های نمایش‌داده‌شده');
  assert.equal(fa('occasionsTitle'), 'کاشی‌های مناسبت صفحه اصلی');
  assert.equal(fa('showing'), 'نمایش');
  assert.equal(fa('of'), 'از');
  assert.equal(fa('featuredLabel'), 'انتخاب‌های ویژه');
  assert.equal(fa('featuredTitle'), 'محصولات ویژه صفحه اصلی');
  assert.equal(fa('page'), 'صفحه');
  assert.equal(fa('previous'), 'قبلی');
  assert.equal(fa('next'), 'بعدی');
  assert.equal(getAdminHomeCopy('next', 'en-CA'), 'Next');

  const helperSource = readFileSync('lib/localization/admin-home-copy.ts', 'utf8');
  assert.match(helperSource, /adminLocaleKey/);
  assert.match(helperSource, /occasionsLabel/);
  assert.match(helperSource, /featuredTitle/);

  const pageSource = readFileSync('app/admin/homepage/page.tsx', 'utf8');
  assert.match(pageSource, /createAdminHomeTranslator/);
  assert.match(pageSource, /locale=\{locale\}/);
  assert.match(pageSource, /copy\('occasionsLabel'\)/);
  assert.match(pageSource, /copy\('featuredTitle'\)/);
  assert.match(pageSource, /copy\('showing'\)/);
  assert.match(pageSource, /copy\('previous'\)/);
  assert.match(pageSource, /copy\('next'\)/);

  console.log('admin-home-copy.test.ts passed');
}
