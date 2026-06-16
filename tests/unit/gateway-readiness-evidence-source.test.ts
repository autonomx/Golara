import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const selectionSource = readFileSync('lib/checkout/payment-method-checkout-selection.ts', 'utf8');

for (const fragment of [
  "GATEWAY_READINESS_EVIDENCE_VERSION = 'p5.gateway-readiness.v1'",
  "const GATEWAY_READINESS_PROVIDERS = new Set<CheckoutPaymentProviderName>(['iranian', 'zarinpal'])",
  'function gatewayProductionReadinessMetadata(selection: CheckoutPaymentMethodSelection)',
  "gatewayReadinessState: 'pending-production-evidence'",
  'gatewayReadinessMethodKey: selection.methodKey',
  'gatewayReadinessProvider: selection.provider',
  'gatewayReadinessProviderKey: selection.providerKey',
  "gatewayReadinessRequiredCurrency: 'TOMAN'",
  'gatewayReadinessRequiresMerchantId: true',
  'gatewayReadinessRequiresReturnMapping: true',
  'gatewayReadinessRequiresWebhookMapping: true',
  '...gatewayProductionReadinessMetadata(selection)'
]) {
  assert.ok(selectionSource.includes(fragment), `Expected gateway readiness evidence fragment: ${fragment}`);
}

const roadmap = readFileSync('docs/digikala-style-payment-remaining-phases.md', 'utf8');
assert.ok(
  roadmap.includes('Gateway production readiness evidence fields persist method/provider evidence for Iranian IPG and ZarinPal checkout attempts.'),
  'Roadmap should record gateway readiness evidence completion.'
);
assert.ok(
  roadmap.includes('Provider reference persistence per method.'),
  'Roadmap should leave provider-reference persistence as the next P5 deliverable.'
);
assert.ok(
  roadmap.includes('Start **Phase P5 — provider reference persistence per method**'),
  'Roadmap should recommend provider-reference persistence next.'
);

console.log('gateway-readiness-evidence-source.test.ts passed');
