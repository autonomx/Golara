import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const selection = readFileSync('lib/checkout/payment-method-checkout-selection.ts', 'utf8');
const checkoutAction = readFileSync('app/cart/checkout/actions.ts', 'utf8');
const roadmap = readFileSync('docs/digikala-style-payment-remaining-phases.md', 'utf8');
const pkg = readFileSync('package.json', 'utf8');

for (const fragment of [
  "COD_COLLECTION_STATUSES = ['pending', 'collected', 'failed', 'waived']",
  'export function codSelectedMethodMetadata(selection: CheckoutPaymentMethodSelection)',
  "if (selection.methodType !== 'cod') return {};",
  'codPaymentSelected: true',
  "codCollectionStatus: 'pending'",
  'codCollectionProviderKey: selection.providerKey',
  'codSettlementMode: selection.settlementMode',
  'codRequiresDeliveryCollection: true'
]) {
  assert.ok(selection.includes(fragment), `Expected COD selected-method metadata fragment: ${fragment}`);
}

for (const fragment of [
  'codSelectedMethodMetadata',
  '...codSelectedMethodMetadata(paymentMethodSelection.selection)',
  '...checkoutPaymentMethodMetadata(paymentMethodSelection.selection)'
]) {
  assert.ok(checkoutAction.includes(fragment), `Expected checkout action COD metadata fragment: ${fragment}`);
}

for (const fragment of [
  'COD selected-method state persisted on checkout payment attempts with pending delivery collection metadata.',
  'Delivery collection status: pending, collected, failed, waived.',
  'Start **Phase P4 — delivery collection status read model**'
]) {
  assert.ok(roadmap.includes(fragment), `Expected COD roadmap fragment: ${fragment}`);
}

assert.ok(
  pkg.includes('check:cod-selected-method-state'),
  'Expected package.json to expose COD selected-method source guard',
);

console.log('cod-selected-method-state-source.test.ts passed');
