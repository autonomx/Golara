import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const statusService = readFileSync('lib/checkout/checkout-status-service.ts', 'utf8');
const roadmap = readFileSync('docs/digikala-style-payment-remaining-phases.md', 'utf8');
const pkg = readFileSync('package.json', 'utf8');

for (const fragment of [
  'COD_COLLECTION_READY_FOR_DELIVERY_STATUSES',
  "new Set<string>(['collected', 'waived'])",
  "if (input.to === 'delivered')",
  'tx.checkoutPaymentAttempt.findMany',
  'isCodPaymentMetadata(metadataObject(attempt.metadata))',
  'codCollectionStatus(metadata)',
  'COD collection must be collected or waived before fulfillment can be marked delivered'
]) {
  assert.ok(statusService.includes(fragment), `Expected COD fulfillment guard fragment: ${fragment}`);
}

for (const fragment of [
  'COD fulfillment completion guard prevents delivered fulfillment unless COD collection is collected or waived.',
  'Settlement/reconciliation fields for delivery collections.',
  'Start **Phase P4 — COD settlement/reconciliation fields**'
]) {
  assert.ok(roadmap.includes(fragment), `Expected roadmap COD fulfillment guard fragment: ${fragment}`);
}

assert.ok(
  pkg.includes('check:cod-fulfillment-guard'),
  'Expected package.json to expose COD fulfillment guard source check',
);

console.log('cod-fulfillment-guard-source.test.ts passed');
