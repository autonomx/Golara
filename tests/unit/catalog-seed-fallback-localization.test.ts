import assert from 'node:assert/strict';
import { localizeSeedProducts } from '../../lib/localization/catalog-seed-fallback';
import { seedCategories, seedProducts } from '../../lib/seed-data';

export async function runCatalogSeedFallbackLocalizationTests() {
  const activeProducts = seedProducts.filter((product) => product.isActive !== false);
  const localized = localizeSeedProducts(activeProducts, 'fa-IR', seedCategories);
  const bySlug = new Map(localized.map((product) => [product.slug, product]));

  assert.equal(localized.length, activeProducts.length);
  for (const product of activeProducts) {
    const item = bySlug.get(product.slug);
    assert.ok(item, `${product.slug} should localize`);
    assert.notEqual(item.title, product.title, `${product.slug} title should change for fa-IR`);
    assert.match(item.description, /برای نمایش و تست کاتالوگ فروشگاه/);
    assert.ok(item.categoryTitle, `${product.slug} should include localized category copy`);
  }

  assert.equal(bySlug.get('imperium-pink')?.title, 'باکس صورتی امپریوم');
  assert.equal(bySlug.get('dark-blue-design')?.title, 'چیدمان آبی تیره');
  assert.equal(bySlug.get('cream-pink-design')?.title, 'چیدمان کرم و صورتی');
  assert.equal(bySlug.get('autumn-design-2')?.title, 'چیدمان پاییزی ۲');
  assert.match(bySlug.get('imperium-pink')?.description ?? '', /باکس صورتی امپریوم/);
  assert.equal(bySlug.get('imperium-pink')?.categoryTitle, 'باکس استاندارد');

  const defaultLocale = localizeSeedProducts(activeProducts, 'en-CA', seedCategories);
  const defaultBySlug = new Map(defaultLocale.map((product) => [product.slug, product]));
  assert.equal(defaultBySlug.get('imperium-pink')?.title, 'Imperium - Pink');

  console.log('catalog-seed-fallback-localization.test.ts passed');
}
