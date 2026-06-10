import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { storefrontCopy } from '@/lib/localization/storefront-copy';

const source = readFileSync('app/page.tsx', 'utf8');
const allowlist = readFileSync('tests/fixtures/localization-source-audit-allowlist.txt', 'utf8');

function has(fragment: string) {
  assert.ok(source.includes(fragment), `Expected homepage route source to include: ${fragment}`);
}

function lacks(fragment: string) {
  assert.ok(!source.includes(fragment), `Expected homepage route source not to include: ${fragment}`);
}

function hasStorefrontCopy(key: keyof typeof storefrontCopy.en) {
  assert.ok(storefrontCopy.en[key], `Expected English storefront copy for ${key}`);
  assert.ok(storefrontCopy.fa[key], `Expected Persian storefront copy for ${key}`);
}

for (const key of [
  'brand.name',
  'home.collectionsEyebrow',
  'home.collectionsTitle',
  'home.collectionsBody',
  'home.collectionsCtaLabel',
  'home.footerBody',
  'home.footerShopTitle',
  'home.footerServiceTitle',
  'home.footerAllProducts',
  'home.footerOccasions',
  'home.footerBestSellers',
  'home.footerServiceBody'
] as const) {
  hasStorefrontCopy(key);
}

assert.equal(storefrontCopy.en['brand.name'], 'Golara');
assert.equal(storefrontCopy.fa['brand.name'], 'گلارا');
assert.ok(!allowlist.includes('app/page.tsx'), 'homepage route should not be source-audit allowlisted');

for (const fragment of [
  'resolveStorefrontLocale',
  'const copy = (key: Parameters<typeof getStorefrontCopy>[0]) => getStorefrontCopy(key, locale);',
  "const brandName = copy('brand.name');",
  'title: `${firstNonEmpty(homepage.title, brandName)} | ${brandName}`',
  "description: firstNonEmpty(homepage.body, copy('home.footerBody'))",
  '<SiteHeader returnTo="/" locale={locale} />',
  "copy('home.collectionsEyebrow')",
  "copy('home.collectionsTitle')",
  "copy('home.collectionsBody')",
  "copy('home.collectionsCtaLabel')",
  "copy('brand.name')",
  "copy('home.footerBody')",
  "copy('home.footerShopTitle')",
  "copy('home.footerAllProducts')",
  "copy('home.footerOccasions')",
  "copy('home.footerBestSellers')",
  "copy('home.footerServiceTitle')",
  "copy('home.footerServiceBody')"
]) {
  has(fragment);
}

lacks("'Golara'");
lacks('>Golara<');

console.log('storefront homepage route copy guard passed');
