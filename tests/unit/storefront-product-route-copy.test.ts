import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { storefrontCopy } from '@/lib/localization/storefront-copy';

const source = readFileSync('app/products/[slug]/page.tsx', 'utf8');

function has(fragment: string) {
  assert.ok(source.includes(fragment), `Expected product route source to include: ${fragment}`);
}

function hasCopy(key: keyof typeof storefrontCopy.en) {
  assert.ok(storefrontCopy.en[key], `Expected English storefront copy for ${key}`);
  assert.ok(storefrontCopy.fa[key], `Expected Persian storefront copy for ${key}`);
}

for (const key of ['catalog.title', 'catalog.body', 'common.home'] as const) {
  hasCopy(key);
}

for (const fragment of [
  'resolveStorefrontLocale()',
  'getStorefrontCopyDirection(locale)',
  "getStorefrontCopy('catalog.title', locale)",
  "getStorefrontCopy('catalog.body', locale)",
  "getStorefrontCopy('common.home', locale)",
  '<SiteHeader returnTo={`/products/${slug}`} locale={locale} />',
  '<ProductDetail product={product} category={category} checkoutPolicy={checkoutPolicy} locale={locale} />',
  '<ProductCheckoutForm product={product} dbReady={dbReady} checkout={checkout} checkoutPolicy={checkoutPolicy} locale={locale} />',
  '<ProductInquiryForm product={product} dbReady={dbReady} inquiry={inquiry} locale={locale} />'
]) {
  has(fragment);
}

console.log('storefront product route copy guard passed');
