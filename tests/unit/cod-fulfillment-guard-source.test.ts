import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const statusService = readFileSync('lib/checkout/checkout-status-service.ts', 'utf8');
const orderDetailPage = readFileSync('app/admin/orders/[orderId]/page.tsx', 'utf8');
const roadmap = readFileSync('docs/digikala-style-payment-remaining-phases.md', 'utf8');

for (const fragment of [
  'COD_COLLECTION_READY_FOR_DELIVERY_STATUSES',
  "new Set<string>(['collected', 'waived'])",
  "if (input.to === 'delivered')",
  'tx.checkoutPaymentAttempt.findMany',
  'isCodPaymentMetadata(metadataObject(attempt.metadata))',
  'codCollectionStatus(metadata)',
  'Unknown checkout fulfillment status: COD collection must be collected or waived before fulfillment can be marked delivered',
  'COD collection must be collected or waived before fulfillment can be marked delivered'
]) {
  assert.ok(statusService.includes(fragment), `Expected COD fulfillment guard fragment: ${fragment}`);
}

for (const fragment of [
  "import { AdminPageShell } from '@/components/admin/AdminPageShell';",
  'activeNavKey="orders"',
  'Cash-on-delivery checkpoint',
  'record cash collection as collected or waived before selecting Delivered',
  'status === \'fulfillment-status-invalid\'',
  'Delivered was not saved. For cash-on-delivery orders',
  'aria-describedby="cash-delivery-checkpoint"'
]) {
  assert.ok(orderDetailPage.includes(fragment), `Expected order detail fulfillment warning fragment: ${fragment}`);
}

for (const forbidden of [
  "import { SiteHeader } from '@/components/SiteHeader';",
  '<SiteHeader />',
  '<main id="main-content" tabIndex={-1}>',
  'href="/admin#orders"'
]) {
  assert.ok(!orderDetailPage.includes(forbidden), `Expected order detail to avoid legacy shell fragment: ${forbidden}`);
}

for (const fragment of [
  'COD fulfillment completion guard prevents delivered fulfillment unless COD collection is collected or waived.',
  'Settlement/reconciliation fields for delivery collections.',
  'Start **Phase P4 — COD settlement/reconciliation fields**'
]) {
  assert.ok(roadmap.includes(fragment), `Expected roadmap COD fulfillment guard fragment: ${fragment}`);
}

console.log('cod-fulfillment-guard-source.test.ts passed');
