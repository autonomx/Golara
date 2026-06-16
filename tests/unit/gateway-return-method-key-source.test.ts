import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const resultHandlerSource = readFileSync('lib/checkout/payment-result-handler.ts', 'utf8');

for (const fragment of [
  'function selectedMethodReturnMetadata(value: unknown): CheckoutResultMetadata',
  "const methodKey = typeof metadata.paymentMethodKey === 'string' ? metadata.paymentMethodKey : undefined;",
  'paymentResultMethodKey: methodKey',
  'paymentResultMethodType:',
  'paymentResultProviderKey:',
  'paymentResultProvider:',
  'paymentResultProviderRoutingKind:',
  'const selectedMethodMetadata = selectedMethodReturnMetadata(latestAttempt?.metadata);',
  '...selectedMethodMetadata,'
]) {
  assert.ok(resultHandlerSource.includes(fragment), `Expected return selected-method metadata fragment: ${fragment}`);
}

const roadmap = readFileSync('docs/digikala-style-payment-remaining-phases.md', 'utf8');
assert.ok(
  roadmap.includes('Gateway return handling maps payment results back to the selected method key.'),
  'Roadmap should record return selected-method mapping completion.'
);
assert.ok(
  roadmap.includes('Webhook mapping back to selected method key.'),
  'Roadmap should leave webhook selected-method mapping as the next P5 deliverable.'
);
assert.ok(
  roadmap.includes('Start **Phase P5 — webhook mapping back to selected method key**'),
  'Roadmap should recommend webhook selected-method mapping next.'
);

console.log('gateway-return-method-key-source.test.ts passed');
