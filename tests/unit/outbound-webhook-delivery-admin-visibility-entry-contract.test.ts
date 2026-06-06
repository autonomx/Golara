import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { buildOutboundWebhookDeliveryAdminVisibilityEntryContract } from '../../lib/settings/outbound-webhook-delivery-admin-visibility-entry-contract';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runOutboundWebhookDeliveryAdminVisibilityEntryContractTests() {
  const contract = buildOutboundWebhookDeliveryAdminVisibilityEntryContract();
  const helper = source('lib/settings/outbound-webhook-delivery-admin-visibility-entry-contract.ts');
  const doc = source('docs/production-roadmap-phase36-admin-visibility-entry-contract.md');
  const readContract = source('lib/settings/outbound-webhook-delivery-read-repository-contract.ts');

  assert.equal(contract.visibilityEntriesImplemented, false);
  assert.equal(contract.adminPagesImplemented, false);
  assert.equal(contract.storageReadyForRuntime, false);
  assert.equal(contract.listEntryKey, 'outbound_webhook_delivery_list');
  assert.equal(contract.detailEntryKey, 'outbound_webhook_delivery_detail');
  assert.equal(contract.futureReadOnly, true);
  assert.equal(contract.mutationsEnabled, false);

  assert.deepEqual(contract.requiredReadOperations, ['list_deliveries', 'get_delivery_detail', 'count_deliveries']);
  assert.deepEqual(contract.redactedFields, ['rawPayload', 'signingSecret', 'receiverResponseBody', 'requestHeaders']);
  assert.ok(contract.capabilities.includes('read_contract_required'));
  assert.ok(contract.capabilities.includes('redaction_required'));
  assert.ok(contract.capabilities.includes('operator_actions_deferred'));
  assert.ok(contract.capabilities.includes('runtime_delivery_deferred'));
  assert.ok(contract.auditLabels.includes('visibility-entries:disabled'));
  assert.ok(contract.auditLabels.includes('admin-pages:disabled'));
  assert.ok(contract.auditLabels.includes('mutations:disabled'));
  assert.ok(contract.auditLabels.includes('operator-actions:disabled'));
  assert.ok(contract.auditLabels.includes('runtime-delivery:disabled'));

  assert.ok(readContract.includes('buildOutboundWebhookDeliveryReadRepositoryContract'));
  assert.ok(doc.includes('pure admin visibility entry contract helper'));
  assert.ok(doc.includes('without implementing admin pages or route behavior'));
  assert.ok(doc.includes('operator mutations disabled'));
  assert.ok(doc.includes('admin page implementation'));
  assert.ok(doc.includes('route handler implementation'));
  assert.ok(doc.includes('database reads'));
  assert.ok(doc.includes('database writes'));
  assert.ok(doc.includes('outbound HTTP delivery'));

  assert.equal(helper.includes('@prisma/client'), false);
  assert.equal(helper.includes('prisma.'), false);
  assert.equal(helper.includes('fetch('), false);
  assert.equal(helper.includes('UPDATE '), false);
  assert.equal(helper.includes('INSERT '), false);
  assert.equal(helper.includes('DELETE '), false);

  console.log('outbound-webhook-delivery-admin-visibility-entry-contract.test.ts passed');
}
