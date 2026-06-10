import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { storefrontCopy } from '@/lib/localization/storefront-copy';

const source = readFileSync('components/ProductCard.tsx', 'utf8');

function assertIncludes(fragment: string) {
  assert.ok(source.includes(fragment), `Expected ProductCard source to include: ${fragment}`);
}

function assertCopyKey(key: keyof typeof storefrontCopy.en) {
  assert.ok(storefrontCopy.en[key], `Expected English storefront copy for ${key}`);
  assert.ok(storefrontCopy.fa[key], `Expected Persian storefront copy for ${key}`);
}

const guardedKeys = [
  'product.viewLabel',
  'product.bestSeller',
  'product.availableToday',
  'product.orderByWhatsApp',
  'product.addToCart'
] as const;

assertIncludes("import { formatStorefrontCopy, getStorefrontCopy } from '@/lib/localization/storefront-copy';");
assertIncludes("const copy = (key: Parameters<typeof getStorefrontCopy>[0]) => getStorefrontCopy(key, locale);");
assertIncludes("aria-label={formatStorefrontCopy('product.viewLabel', locale, { title: product.title })}");

for (const key of guardedKeys) {
  assertCopyKey(key);
}

for (const rawLabel of ['Best seller', 'Available today', 'Order by WhatsApp', 'Add to cart']) {
  assert.ok(!source.includes(`>${rawLabel}<`), `Expected ${rawLabel} to stay routed through storefront copy`);
}

console.log('storefront product card copy guard passed');
