import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { storefrontCopy } from '@/lib/localization/storefront-copy';

const source = readFileSync('components/product/ProductDetail.tsx', 'utf8');

function assertIncludes(fragment: string) {
  assert.ok(source.includes(fragment), `Expected ProductDetail source to include: ${fragment}`);
}

function assertCopyKey(key: keyof typeof storefrontCopy.en) {
  assert.ok(storefrontCopy.en[key], `Expected English storefront copy for ${key}`);
  assert.ok(storefrontCopy.fa[key], `Expected Persian storefront copy for ${key}`);
}

const storefrontKeys = [
  'product.variant',
  'product.quantity',
  'product.addToCart',
  'product.orderByWhatsApp',
  'product.availableToday',
  'product.preOrderRequired',
  'product.interestedMessage'
] as const;

assertIncludes("import { formatStorefrontCopy, getStorefrontCopy } from '@/lib/localization/storefront-copy';");
assertIncludes("const copy = (key: Parameters<typeof getStorefrontCopy>[0]) => getStorefrontCopy(key, locale);");
assertIncludes("copy('product.variant')");
assertIncludes("copy('product.quantity')");
assertIncludes("copy('product.addToCart')");
assertIncludes("copy('product.orderByWhatsApp')");
assertIncludes("copy('product.availableToday')");
assertIncludes("copy('product.preOrderRequired')");
assertIncludes("formatStorefrontCopy('product.interestedMessage', locale");

for (const key of storefrontKeys) {
  assertCopyKey(key);
}

for (const rawLabel of ['Variant', 'Quantity', 'Add to cart', 'Order by WhatsApp', 'Available today', 'Pre-order required']) {
  assert.ok(!source.includes(`>${rawLabel}<`), `Expected ${rawLabel} copy to stay routed through storefront copy`);
}

console.log('storefront product detail copy guard passed');
