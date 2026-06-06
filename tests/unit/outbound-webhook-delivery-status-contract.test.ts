import assert from 'node:assert/strict';

import { buildOutboundWebhookDeliveryStatusContract } from '../../lib/settings/outbound-webhook-delivery-status-contract';

export async function runOutboundWebhookDeliveryStatusContractTests() {
  const contract = buildOutboundWebhookDeliveryStatusContract();

  assert.equal(contract.initial, 'planned');
  assert.deepEqual(contract.active, ['pending', 'retry_wait']);
  assert.deepEqual(contract.terminal, ['delivered', 'failed', 'dead_letter']);
  assert.ok(contract.auditLabels.includes('status-contract:planned'));
  assert.ok(contract.auditLabels.includes('runtime:disabled'));
  assert.ok(contract.auditLabels.includes('external-calls:disabled'));

  console.log('outbound-webhook-delivery-status-contract.test.ts passed');
}
