import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import {
  customerOrderDateLocale,
  customerOrderItemCountLabel,
  customerOrderManualTransferInstructions,
  customerOrderMethodConfirmation,
  customerOrderMoreItemLabel,
  customerOrderPaymentSummary,
  getCustomerOrderCopy,
  getCustomerOrderMethodConfirmationCopy,
  type CustomerOrderCopyKey,
  type CustomerOrderMethodConfirmationKey
} from '@/lib/localization/customer-order-copy';

const source = readFileSync('app/account/orders/page.tsx', 'utf8');
const copySource = readFileSync('lib/localization/customer-order-copy.ts', 'utf8');

function has(fragment: string) {
  assert.ok(source.includes(fragment), `Expected order history route source to include: ${fragment}`);
}

function copyHas(fragment: string) {
  assert.ok(copySource.includes(fragment), `Expected customer order copy source to include: ${fragment}`);
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

for (const key of [
  'gateway',
  'wallet',
  'manualTransfer',
  'installment',
  'cod'
] as const satisfies readonly CustomerOrderMethodConfirmationKey[]) {
  assert.ok(getCustomerOrderMethodConfirmationCopy(key, 'en').title, `Expected English method confirmation title for ${key}`);
  assert.ok(getCustomerOrderMethodConfirmationCopy(key, 'fa').body, `Expected Persian method confirmation body for ${key}`);
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
  'customerOrderMethodConfirmation(metadata, locale)',
  'customerOrderManualTransferInstructions(metadata, order.orderNumber, locale)',
  'methodConfirmation.methodLabel ?? methodConfirmation.title',
  'methodConfirmation.body',
  'manualTransferInstructions.referenceLabel',
  'manualTransferInstructions.proofUrlLabel',
  'manualTransferInstructions.emailSubject',
  'manualTransferInstructions.emailBody',
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

for (const fragment of [
  'CustomerOrderManualTransferInstructions',
  'manualPaymentReference',
  'manualPaymentProofUrl',
  'manualPaymentInstructionsAcknowledged',
  'emailSubject',
  'emailBody',
  'Manual-transfer instructions',
  'راهنمای انتقال بانکی'
]) {
  copyHas(fragment);
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
assert.equal(customerOrderMethodConfirmation({ paymentMethodType: 'gateway', paymentMethodLabel: 'Online card payment / Iranian IPG' }, 'en')?.key, 'gateway');
assert.equal(customerOrderMethodConfirmation({ paymentMethodKey: 'wallet-credit' }, 'en')?.title, getCustomerOrderMethodConfirmationCopy('wallet', 'en').title);
assert.equal(customerOrderMethodConfirmation({ paymentMethodType: 'manual_transfer' }, 'en')?.key, 'manualTransfer');
assert.equal(customerOrderMethodConfirmation({ paymentMethodType: 'installment' }, 'fa')?.key, 'installment');
assert.equal(customerOrderMethodConfirmation({ paymentMethodKey: 'cash-on-delivery' }, 'en')?.key, 'cod');
assert.equal(customerOrderMethodConfirmation({ paymentMethodType: 'unknown' }, 'en'), null);

const manualInstructions = customerOrderManualTransferInstructions({
  paymentMethodType: 'manual_transfer',
  manualPaymentReference: 'ABC-123',
  manualPaymentProofUrl: 'https://example.test/proof'
}, 'GOL-1001', 'en');
assert.equal(manualInstructions?.reference, 'ABC-123');
assert.equal(manualInstructions?.proofUrl, 'https://example.test/proof');
assert.ok(manualInstructions?.emailSubject.includes('GOL-1001'));
assert.ok(manualInstructions?.emailBody.includes('ABC-123'));
assert.ok(customerOrderManualTransferInstructions({ paymentMethodType: 'wallet' }, 'GOL-1002', 'en') === null);
assert.ok(customerOrderManualTransferInstructions({ paymentMethodKey: 'bank-transfer' }, 'GOL-1003', 'fa')?.emailSubject.includes('GOL-1003'));

console.log('storefront order history route copy guard passed');
