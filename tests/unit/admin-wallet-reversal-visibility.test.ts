import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const catalogSource = readFileSync('lib/catalog.ts', 'utf8');
const repositorySource = readFileSync('lib/checkout/admin-order-repository.ts', 'utf8');
const panelSource = readFileSync('components/admin/AdminOrderPanel.tsx', 'utf8');
const csvSource = readFileSync('app/admin/orders/csv/route.ts', 'utf8');

for (const field of [
  'latestWalletRefundEntryId?: string;',
  'latestWalletRefundIdempotencyKey?: string;',
  'latestWalletRefundedAt?: string;',
  'latestWalletRefundTotalCents?: number;',
  'latestWalletRefundCurrency?: string;'
]) {
  assert.ok(catalogSource.includes(field), `CheckoutOrderSummary must expose ${field}`);
}

for (const mapping of [
  'latestWalletRefundEntryId: textMetadataValue(paymentMetadata.walletRefundEntryId)',
  'latestWalletRefundIdempotencyKey: textMetadataValue(paymentMetadata.walletRefundIdempotencyKey)',
  'latestWalletRefundedAt: textMetadataValue(paymentMetadata.walletRefundedAt)',
  'latestWalletRefundTotalCents: numberMetadataValue(paymentMetadata.walletRefundTotalCents)',
  'latestWalletRefundCurrency: textMetadataValue(paymentMetadata.walletRefundCurrency)'
]) {
  assert.ok(repositorySource.includes(mapping), `Admin order repository must map wallet refund metadata: ${mapping}`);
}

for (const fragment of [
  'function WalletRefundSummary',
  'hasWalletRefundMetadata(order)',
  'labels.walletRefundReceipt',
  'latestWalletRefundEntryId',
  'latestWalletRefundIdempotencyKey',
  'latestWalletRefundTotalCents',
  '<WalletRefundSummary order={order} labels={labels} locale={activeLocale} />'
]) {
  assert.ok(panelSource.includes(fragment), `Admin order panel must show wallet reversal metadata: ${fragment}`);
}

for (const column of [
  'Wallet refund total',
  'Wallet refund currency',
  'Wallet refund entry',
  'Wallet refund idempotency',
  'Wallet refunded at',
  'order.latestWalletRefundTotalCents',
  'order.latestWalletRefundEntryId',
  'order.latestWalletRefundIdempotencyKey',
  'order.latestWalletRefundedAt'
]) {
  assert.ok(csvSource.includes(column), `Admin order CSV must export wallet refund metadata: ${column}`);
}

console.log('admin-wallet-reversal-visibility.test.ts passed');
