import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { customerCopy } from '@/lib/localization/customer-copy';

const source = readFileSync('app/cart/page.tsx', 'utf8');

function has(fragment: string) {
  assert.ok(source.includes(fragment), `Expected cart route source to include: ${fragment}`);
}

function hasCustomerCopy(key: keyof typeof customerCopy.en) {
  assert.ok(customerCopy.en[key], `Expected English customer copy for ${key}`);
  assert.ok(customerCopy.fa[key], `Expected Persian customer copy for ${key}`);
}

for (const key of [
  'cart.eyebrow',
  'cart.title',
  'cart.subtitle',
  'cart.emptyTitle',
  'cart.emptyBody',
  'cart.unavailableTitle',
  'cart.unavailableBody',
  'cart.shopProducts',
  'cart.each',
  'cart.quantity',
  'cart.update',
  'cart.remove',
  'cart.summary',
  'cart.total',
  'cart.items',
  'cart.subtotal',
  'cart.finalTotalsNote',
  'cart.checkout',
  'cart.clear',
  'cart.status.added',
  'cart.status.updated',
  'cart.status.removed',
  'cart.status.cleared',
  'cart.status.missing',
  'cart.status.databaseRequired',
  'cart.status.failed',
  'common.continueShopping'
] as const) {
  hasCustomerCopy(key);
}

for (const fragment of [
  'resolveStorefrontLocale()',
  'getCustomerCopyDirection(locale)',
  "const copy = (key: Parameters<typeof getCustomerCopy>[0]) => getCustomerCopy(key, locale)",
  '<SiteHeader locale={locale} />',
  "statusMessageKey(cartStatus)",
  "copy('cart.eyebrow')",
  "copy('cart.title')",
  "copy('cart.subtitle')",
  "copy('common.continueShopping')",
  "copy('cart.unavailableTitle')",
  "copy('cart.unavailableBody')",
  "copy('cart.emptyTitle')",
  "copy('cart.emptyBody')",
  "copy('cart.shopProducts')",
  "copy('cart.each')",
  "copy('cart.quantity')",
  "copy('cart.update')",
  "copy('cart.remove')",
  "copy('cart.summary')",
  "copy('cart.total')",
  "copy('cart.items')",
  "copy('cart.subtotal')",
  "copy('cart.finalTotalsNote')",
  "copy('cart.checkout')",
  "copy('cart.clear')"
]) {
  has(fragment);
}

console.log('storefront cart route copy guard passed');
