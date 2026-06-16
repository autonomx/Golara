import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const webhookSource = readFileSync('lib/checkout/payment-webhook-service.ts', 'utf8');

for (const fragment of [
  'metadata: unknown;',
  'function selectedMethodWebhookMetadata(value: unknown): Record<string, string>',
  "const methodKey = typeof metadata.paymentMethodKey === 'string' ? metadata.paymentMethodKey : undefined;",
  'paymentWebhookMethodKey: methodKey',
  'paymentWebhookMethodType:',
  'paymentWebhookProviderKey:',
  'paymentWebhookProvider:',
  'paymentWebhookProviderRoutingKind:',
  'metadata: true,',
  '...selectedMethodWebhookMetadata(paymentAttempt.metadata)',
]) {
  assert.ok(webhookSource.includes(fragment), `Expected webhook selected-method metadata fragment: ${fragment}`);
}

const roadmap = readFileSync('docs/digikala-style-payment-remaining-phases.md', 'utf8');
assert.ok(
  roadmap.includes('Gateway webhook handling maps trusted payment events back to the selected method key.'),
  'Roadmap should record webhook selected-method mapping completion.'
);
assert.ok(
  roadmap.includes('Gateway fallback/disable behavior when a method is turned off.'),
  'Roadmap should leave fallback/disable behavior as the next P5 deliverable.'
);
assert.ok(
  roadmap.includes('Start **Phase P5 — gateway fallback/disable behavior**'),
  'Roadmap should recommend gateway fallback/disable behavior next.'
);

console.log('gateway-webhook-method-key-source.test.ts passed');
