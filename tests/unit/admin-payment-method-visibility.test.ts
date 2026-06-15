import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const repositorySource = readFileSync('lib/checkout/admin-order-repository.ts', 'utf8');
const catalogSource = readFileSync('lib/catalog.ts', 'utf8');
const panelSource = readFileSync('components/admin/AdminOrderPanel.tsx', 'utf8');
const csvSource = readFileSync('app/admin/orders/csv/route.ts', 'utf8');

for (const fragment of [
  'paymentAttempts: { status: string; provider: string; metadata: Prisma.JsonValue | null }[];',
  'select: { status: true, provider: true, metadata: true }',
  'latestPaymentMethodKey: textMetadataValue(paymentMetadata.paymentMethodKey)',
  'latestPaymentMethodLabel: textMetadataValue(paymentMetadata.paymentMethodLabel)',
  'latestPaymentMethodType: textMetadataValue(paymentMetadata.paymentMethodType)',
  'latestPaymentRequiresManualReview: booleanMetadataValue(paymentMetadata.paymentRequiresManualReview)'
]) {
  assert.ok(repositorySource.includes(fragment), `Expected admin order repository to expose payment method metadata fragment: ${fragment}`);
}

for (const fragment of [
  'latestPaymentProvider?: string;',
  'latestPaymentMethodKey?: string;',
  'latestPaymentMethodLabel?: string;',
  'latestPaymentMethodType?: string;',
  'latestPaymentRequiresManualReview?: boolean;'
]) {
  assert.ok(catalogSource.includes(fragment), `Expected CheckoutOrderSummary to include payment method field: ${fragment}`);
}

for (const fragment of [
  'paymentMethod: string;',
  "paymentMethod: 'Payment method'",
  'function paymentMethodName(order: CheckoutOrderSummary)',
  '{labels.paymentMethod}',
  'order.latestPaymentProvider',
  'order.latestPaymentRequiresManualReview'
]) {
  assert.ok(panelSource.includes(fragment), `Expected admin orders panel to render payment method fragment: ${fragment}`);
}

for (const fragment of [
  "'Payment method'",
  "'Payment provider'",
  "'Manual review'",
  'paymentMethodName(order)',
  'order.latestPaymentProvider ||',
  "order.latestPaymentRequiresManualReview ? 'yes' : 'no'"
]) {
  assert.ok(csvSource.includes(fragment), `Expected admin order CSV to export payment method fragment: ${fragment}`);
}

console.log('admin payment method visibility guard passed');
