import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const providerAlias = readFileSync('lib/checkout/payment-provider-alias-core.ts', 'utf8');
const selection = readFileSync('lib/checkout/payment-method-checkout-selection.ts', 'utf8');
const roadmap = readFileSync('docs/digikala-style-payment-remaining-phases.md', 'utf8');

for (const fragment of [
  'PAYMENT_METHOD_GATEWAY_ADAPTERS',
  "'iranian-ipg': 'zarinpal'",
  "'domestic-ipg': 'iranian'",
  "'international-card': 'stripe'",
  'resolvePaymentMethodGatewayAdapter',
  'methodKey?: string | null',
  'providerKey?: string | null'
]) {
  assert.ok(providerAlias.includes(fragment), `Expected gateway adapter mapping fragment: ${fragment}`);
}

for (const fragment of [
  'resolvePaymentMethodGatewayAdapter({ methodKey: method.key, providerKey: method.providerKey })',
  'paymentProvider: selection.provider',
  'paymentProviderRoutingKind: checkoutProviderRoutingKind(selection.provider)'
]) {
  assert.ok(selection.includes(fragment), `Expected checkout selection gateway mapping fragment: ${fragment}`);
}

for (const fragment of [
  'Method-specific gateway adapter mapping is now explicit in checkout provider resolution.',
  'Start **Phase P5 — gateway production readiness evidence fields**'
]) {
  assert.ok(roadmap.includes(fragment), `Expected roadmap gateway mapping fragment: ${fragment}`);
}

console.log('gateway-method-mapping-source.test.ts passed');
