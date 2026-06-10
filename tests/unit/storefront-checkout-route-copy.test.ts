import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { customerCopy } from '@/lib/localization/customer-copy';
import { checkoutFlowCopy } from '@/lib/localization/checkout-flow-copy';

const source = readFileSync('app/cart/checkout/page.tsx', 'utf8');

function has(fragment: string) {
  assert.ok(source.includes(fragment), `Expected checkout route source to include: ${fragment}`);
}

function hasCustomerCopy(key: keyof typeof customerCopy.en) {
  assert.ok(customerCopy.en[key], `Expected English customer copy for ${key}`);
  assert.ok(customerCopy.fa[key], `Expected Persian customer copy for ${key}`);
}

for (const key of [
  'checkout.eyebrow',
  'checkout.title',
  'checkout.subtitle',
  'checkout.backToCart',
  'checkout.prefillWithAddressNotice',
  'checkout.prefillNotice',
  'checkout.unavailableTitle',
  'checkout.unavailableBody',
  'checkout.recipientDetails',
  'checkout.recipientName',
  'common.phone',
  'checkout.emailOptional',
  'checkout.city',
  'checkout.addressLine1',
  'checkout.addressLine2Optional',
  'checkout.deliveryDateOptional',
  'checkout.deliveryWindowOptional',
  'checkout.deliveryWindowPlaceholder',
  'checkout.deliveryNotesOptional',
  'checkout.customerNoteOptional',
  'checkout.createOrderAndPay',
  'checkout.orderSummary',
  'checkout.finalizedNote',
  'checkout.manageAddresses',
  'cart.emptyTitle',
  'cart.emptyBody',
  'cart.shopProducts'
] as const) {
  hasCustomerCopy(key);
}

for (const flowKey of ['missing', 'empty', 'databaseRequired', 'failed'] as const) {
  assert.ok(checkoutFlowCopy.en[flowKey], `Expected English checkout flow copy for ${flowKey}`);
  assert.ok(checkoutFlowCopy.fa[flowKey], `Expected Persian checkout flow copy for ${flowKey}`);
}

for (const fragment of [
  'getCustomerCopyDirection(locale)',
  "const copy = (key: Parameters<typeof getCustomerCopy>[0]) => getCustomerCopy(key, locale)",
  'getCheckoutFlowCopy(checkout, locale)',
  "copy('checkout.eyebrow')",
  "copy('checkout.title')",
  "copy('checkout.subtitle')",
  "copy('checkout.backToCart')",
  "copy('checkout.prefillWithAddressNotice')",
  "copy('checkout.prefillNotice')",
  "copy('checkout.unavailableTitle')",
  "copy('checkout.unavailableBody')",
  "copy('cart.emptyTitle')",
  "copy('cart.emptyBody')",
  "copy('cart.shopProducts')",
  "copy('checkout.recipientDetails')",
  "copy('checkout.recipientName')",
  "copy('common.phone')",
  "copy('checkout.emailOptional')",
  "copy('checkout.city')",
  "copy('checkout.addressLine1')",
  "copy('checkout.addressLine2Optional')",
  "copy('checkout.deliveryDateOptional')",
  "copy('checkout.deliveryWindowOptional')",
  "placeholder={copy('checkout.deliveryWindowPlaceholder')}",
  "copy('checkout.deliveryNotesOptional')",
  "copy('checkout.customerNoteOptional')",
  "copy('checkout.createOrderAndPay')",
  "copy('checkout.orderSummary')",
  "copy('checkout.finalizedNote')",
  "copy('checkout.manageAddresses')"
]) {
  has(fragment);
}

console.log('storefront checkout route copy guard passed');
