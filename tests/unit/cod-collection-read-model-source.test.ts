import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const catalog = readFileSync('lib/catalog.ts', 'utf8');
const repository = readFileSync('lib/checkout/admin-order-repository.ts', 'utf8');
const panel = readFileSync('components/admin/AdminOrderPanel.tsx', 'utf8');
const csvRoute = readFileSync('app/admin/orders/csv/route.ts', 'utf8');
const roadmap = readFileSync('docs/digikala-style-payment-remaining-phases.md', 'utf8');
const pkg = readFileSync('package.json', 'utf8');

for (const fragment of [
  'latestCodCollectionStatus?: string;',
  'latestCodCollectionProviderKey?: string;',
  'latestCodSettlementMode?: string;',
  'latestCodRequiresDeliveryCollection?: boolean;'
]) {
  assert.ok(catalog.includes(fragment), `Expected checkout order summary COD field: ${fragment}`);
}

for (const fragment of [
  'latestCodCollectionStatus: textMetadataValue(paymentMetadata.codCollectionStatus)',
  'latestCodCollectionProviderKey: textMetadataValue(paymentMetadata.codCollectionProviderKey)',
  'latestCodSettlementMode: textMetadataValue(paymentMetadata.codSettlementMode)',
  'latestCodRequiresDeliveryCollection: booleanMetadataValue(paymentMetadata.codRequiresDeliveryCollection)'
]) {
  assert.ok(repository.includes(fragment), `Expected admin order repository COD mapping: ${fragment}`);
}

for (const fragment of [
  'function hasCodCollectionMetadata(order: CheckoutOrderSummary)',
  'function CodCollectionSummary({ order, labels }: { order: CheckoutOrderSummary; labels: AdminOrderPanelCopy })',
  '<CodCollectionSummary order={order} labels={labels} />',
  'codCollection: \'COD collection\'',
  'codCollectionStatus: \'Collection status\''
]) {
  assert.ok(panel.includes(fragment), `Expected admin order panel COD read-model fragment: ${fragment}`);
}

for (const fragment of [
  'COD collection status',
  'COD collection provider',
  'COD settlement mode',
  "order.latestCodCollectionStatus || ''",
  "order.latestCodCollectionProviderKey || ''",
  "order.latestCodSettlementMode || ''"
]) {
  assert.ok(csvRoute.includes(fragment), `Expected COD CSV export fragment: ${fragment}`);
}

for (const fragment of [
  'COD delivery collection status read model surfaced in admin order summaries and CSV exports.',
  'Staff controls for collection confirmation.',
  'Start **Phase P4 — COD staff collection controls**'
]) {
  assert.ok(roadmap.includes(fragment), `Expected roadmap COD read-model fragment: ${fragment}`);
}

assert.ok(
  pkg.includes('check:cod-collection-read-model'),
  'Expected package.json to expose COD collection read-model source guard',
);

console.log('cod-collection-read-model-source.test.ts passed');
