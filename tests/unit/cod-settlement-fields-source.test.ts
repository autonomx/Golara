import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const selection = readFileSync('lib/checkout/payment-method-checkout-selection.ts', 'utf8');
const service = readFileSync('lib/checkout/cod-collection-service.ts', 'utf8');
const page = readFileSync('app/admin/payments/cod-collections/page.tsx', 'utf8');
const roadmap = readFileSync('docs/digikala-style-payment-remaining-phases.md', 'utf8');

for (const fragment of [
  'COD_SETTLEMENT_STATUSES',
  "['pending', 'settled', 'disputed']",
  "codSettlementStatus: 'pending'",
  'codSettlementMode: selection.settlementMode'
]) {
  assert.ok(selection.includes(fragment), `Expected COD settlement selection fragment: ${fragment}`);
}

for (const fragment of [
  'assertCodSettlementStatus',
  'codSettlementReference',
  'codSettlementSettledAt',
  'codSettlementUpdatedAt',
  'fromSettlementStatus',
  'toSettlementStatus',
  'settlementReferenceAdded',
  'settlementSettledAtAdded'
]) {
  assert.ok(service.includes(fragment), `Expected COD settlement service fragment: ${fragment}`);
}

for (const fragment of [
  'COD_SETTLEMENT_STATUSES',
  'cod-settlement-invalid',
  'Settlement status',
  'Settlement reference',
  'previousSettlementStatus',
  'settlementStatus: result.toSettlementStatus'
]) {
  assert.ok(page.includes(fragment), `Expected COD settlement admin page fragment: ${fragment}`);
}

for (const fragment of [
  'COD settlement/reconciliation fields persist settlement status and evidence on delivery collections.',
  'Start **Phase P5 — Gateway adapter expansion**'
]) {
  assert.ok(roadmap.includes(fragment), `Expected COD settlement roadmap fragment: ${fragment}`);
}

console.log('cod-settlement-fields-source.test.ts passed');
