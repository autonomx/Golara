import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import {
  customerOrderDateLocale,
  customerOrderItemCountLabel,
  customerOrderMoreItemLabel,
  customerOrderPaymentSummary,
  getCustomerOrderCopy,
  type CustomerOrderCopyKey
} from '@/lib/localization/customer-order-copy';

const source = readFileSync('app/account/orders/page.tsx', 'utf8');

function has(fragment: string) {
  assert.ok(source.includes(fragment), `Expected order history route source to include: ${fragment}`);
}

for (const key of [
  'eyebrow',
  'title',
  'subtitle',
  'unavailableTitle',
  'unavailableBody',
  'accountOverview',
  'emptyTitle',
  'emptyBody',
  'browseProducts',
  'viewPublicStatus',
  'itemSingular',
  'itemPlural',
  'moreItemSingular',
  'moreItemPlural',
  'payment.none',
  'payment.verifiedPaid',
  'payment.redirectRequired',
  'payment.manualPending',
  'payment.failed',
  'payment.cancelled'
] as const satisfies readonly CustomerOrderCopyKey[]) {
  assert.ok(getCustomerOrderCopy(key, 'en'), `Expected English order copy for ${key}`);
  assert.ok(getCustomerOrderCopy(key, 'fa'), `Expected Persian order copy for ${key}`);
}

for (const fragment of [
  'resolveStorefrontLocale',
  'const storefrontLocale = await resolveStorefrontLocale();',
  'getCustomerCopyDirection(storefrontLocale)',
  'getCustomerOrderCopy(key, storefrontLocale)',
  '<SiteHeader locale={storefrontLocale} />',
  'const locale = session.customer.locale;',
  'getCustomerCopyDirection(locale)',
  'getCustomerOrderCopy(key, locale)',
  '<SiteHeader locale={locale} />',
  'customerOrderDateLocale(locale)',
  'customerOrderPaymentSummary(latestAttempt?.status, locale)',
  'customerOrderItemCountLabel(order.items.reduce((sum, item) => sum + item.quantity, 0), locale)',
  'customerOrderMoreItemLabel(order.items.length - 3, locale)',
  "copy('eyebrow')",
  "copy('title')",
  "copy('subtitle')",
  "copy('unavailableTitle')",
  "copy('unavailableBody')",
  "copy('accountOverview')",
  "copy('emptyTitle')",
  "copy('emptyBody')",
  "copy('browseProducts')",
  "copy('viewPublicStatus')"
]) {
  has(fragment);
}

assert.equal(customerOrderDateLocale('en'), 'en-CA');
assert.equal(customerOrderDateLocale('fa'), 'fa-IR');
assert.equal(customerOrderItemCountLabel(1, 'en'), '1 item');
assert.equal(customerOrderItemCountLabel(2, 'en'), '2 items');
assert.ok(customerOrderItemCountLabel(2, 'fa'));
assert.equal(customerOrderMoreItemLabel(1, 'en'), '1 more item');
assert.equal(customerOrderPaymentSummary('verified_paid', 'en'), getCustomerOrderCopy('payment.verifiedPaid', 'en'));
assert.equal(customerOrderPaymentSummary('redirect_required', 'fa'), getCustomerOrderCopy('payment.redirectRequired', 'fa'));
assert.equal(customerOrderPaymentSummary(null, 'en'), getCustomerOrderCopy('payment.none', 'en'));

console.log('storefront order history route copy guard passed');
