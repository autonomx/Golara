import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const providerSource = readFileSync('lib/checkout/payment-provider.ts', 'utf8');

for (const fragment of [
  'function methodAwareProviderReferenceMetadata(result: PaymentProviderResult, metadata: PaymentMetadata): PaymentMetadata',
  "const methodKey = typeof metadata.paymentMethodKey === 'string' ? metadata.paymentMethodKey : undefined;",
  'if (!result.providerReference || !methodKey) return {};',
  'paymentProviderReference: result.providerReference',
  'paymentProviderReferenceMethodKey: methodKey',
  'paymentProviderReferenceProvider: result.provider',
  'paymentProviderReferenceStatus: result.status',
  'paymentProviderReferenceCaptured: true',
  'const finalMetadata = { ...mergedMetadata, ...methodAwareProviderReferenceMetadata(result, mergedMetadata) };',
  'metadata: finalMetadata'
]) {
  assert.ok(providerSource.includes(fragment), `Expected provider-reference metadata fragment: ${fragment}`);
}

const roadmap = readFileSync('docs/digikala-style-payment-remaining-phases.md', 'utf8');
assert.ok(
  roadmap.includes('Provider reference persistence per method stores selected method/provider reference evidence on checkout payment attempts.'),
  'Roadmap should record provider-reference persistence completion.'
);
assert.ok(
  roadmap.includes('Return/webhook mapping back to selected method key.'),
  'Roadmap should leave return/webhook mapping as the next P5 deliverable.'
);
assert.ok(
  roadmap.includes('Start **Phase P5 — return/webhook mapping back to selected method key**'),
  'Roadmap should recommend return/webhook mapping next.'
);

console.log('gateway-provider-reference-source.test.ts passed');
