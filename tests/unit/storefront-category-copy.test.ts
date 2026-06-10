import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { storefrontCopy } from '@/lib/localization/storefront-copy';

const listingSource = readFileSync('app/categories/page.tsx', 'utf8');
const detailSource = readFileSync('app/categories/[slug]/page.tsx', 'utf8');

function has(source: string, fragment: string) {
  assert.ok(source.includes(fragment), `Expected source to include: ${fragment}`);
}

function hasCopy(key: keyof typeof storefrontCopy.en) {
  assert.ok(storefrontCopy.en[key], `Expected English storefront copy for ${key}`);
  assert.ok(storefrontCopy.fa[key], `Expected Persian storefront copy for ${key}`);
}

for (const key of [
  'categories.title',
  'categories.body',
  'categories.eyebrow',
  'category.exploreEyebrow',
  'category.subcategoriesTitle',
  'category.productsEyebrow',
  'category.allInCollection',
  'category.empty',
  'common.home'
] as const) {
  hasCopy(key);
}

for (const fragment of [
  'resolveStorefrontLocale()',
  'getStorefrontCopyDirection(locale)',
  "getStorefrontCopy('categories.eyebrow', locale)",
  "getStorefrontCopy('categories.title', locale)",
  "getStorefrontCopy('categories.body', locale)",
  'locale={locale}'
]) {
  has(listingSource, fragment);
}

for (const fragment of [
  'resolveStorefrontLocale()',
  'getStorefrontCopyDirection(locale)',
  "getStorefrontCopy('common.home', locale)",
  "getStorefrontCopy('category.exploreEyebrow', locale)",
  "getStorefrontCopy('category.subcategoriesTitle', locale)",
  "getStorefrontCopy('category.productsEyebrow', locale)",
  "getStorefrontCopy('category.allInCollection', locale)",
  "getStorefrontCopy('category.empty', locale)",
  'locale={locale}'
]) {
  has(detailSource, fragment);
}

console.log('storefront category copy guard passed');
