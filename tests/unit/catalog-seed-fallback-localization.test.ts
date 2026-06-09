import assert from 'node:assert/strict';
import { localizeSeedProducts } from '../../lib/localization/catalog-seed-fallback';
import { seedCategories, seedProducts } from '../../lib/seed-data';

export async function runCatalogSeedFallbackLocalizationTests() {
  const localized = localizeSeedProducts(seedProducts, 'fa-IR', seedCategories);
  const bySlug = new Map(localized.map((product) => [product.slug, product]));

  assert.equal(bySlug.get('imperium-pink')?.title, 'باکس صورتی امپریوم');
  assert.equal(bySlug.get('dark-blue-design')?.title, 'چیدمان آبی تیره');
  assert.equal(bySlug.get('cream-pink-design')?.title, 'چیدمان کرم و صورتی');
  assert.equal(bySlug.get('autumn-design-2')?.title, 'چیدمان پاییزی ۲');
  assert.match(bySlug.get('imperium-pink')?.description ?? '', /باکس صورتی امپریوم/);
  assert.equal(bySlug.get('imperium-pink')?.categoryTitle, 'باکس استاندارد');

  const english = localizeSeedProducts(seedProducts, 'en-CA', seedCategories);
  const englishBySlug = new Map(english.map((product) => [product.slug, product]));
  assert.equal(englishBySlug.get('imperium-pink')?.title, 'Imperium - Pink');

  console.log('catalog-seed-fallback-localization.test.ts passed');
}
