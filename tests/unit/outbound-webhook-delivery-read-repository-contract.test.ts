import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { buildOutboundWebhookDeliveryReadRepositoryContract } from '../../lib/settings/outbound-webhook-delivery-read-repository-contract';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runOutboundWebhookDeliveryReadRepositoryContractTests() {
  const contract = buildOutboundWebhookDeliveryReadRepositoryContract();
  const helper = source('lib/settings/outbound-webhook-delivery-read-repository-contract.ts');
  const doc = source('docs/production-roadmap-phase36-read-repository-contract.md');
  const migration = source('prisma/migrations/20260605190500_add_outbound_webhook_delivery/migration.sql');

  assert.equal(contract.tableName, 'OutboundWebhookDelivery');
  assert.equal(contract.storageReadyForRuntime, false);
  assert.equal(contract.readRepositoryImplemented, false);
  assert.equal(contract.writeRepositoryImplemented, false);
  assert.deepEqual(contract.allowedOperations, ['list_deliveries', 'get_delivery_detail', 'count_deliveries']);

  for (const field of [
    'id',
    'configurationKey',
    'eventType',
    'eventRef',
    'payloadDigest',
    'idempotencyKey',
    'status',
    'attemptCount',
    'lastOutcomeCategory',
    'nextEligibleAttemptAt',
    'lastResponseCode',
    'deadLetterSummary',
    'createdAt',
    'updatedAt'
  ]) {
    assert.ok(contract.selectedFields.includes(field as never), `expected selected field ${field}`);
    assert.ok(migration.includes(`"${field}"`), `migration should include ${field}`);
  }

  assert.deepEqual(contract.redactedFields, ['rawPayload', 'signingSecret', 'receiverResponseBody', 'requestHeaders']);
  assert.ok(contract.deferredCapabilities.includes('repository_implementation'));
  assert.ok(contract.deferredCapabilities.includes('route_handlers'));
  assert.ok(contract.deferredCapabilities.includes('dispatcher_execution'));
  assert.ok(contract.deferredCapabilities.includes('signing_runtime'));
  assert.ok(contract.deferredCapabilities.includes('live_delivery'));
  assert.ok(contract.auditLabels.includes('repository-reads:pending'));
  assert.ok(contract.auditLabels.includes('repository-writes:disabled'));
  assert.ok(contract.auditLabels.includes('external-calls:disabled'));

  assert.ok(doc.includes('pure read-repository contract helper'));
  assert.ok(doc.includes('without implementing a repository adapter'));
  assert.ok(doc.includes('does not access Prisma Client'));
  assert.ok(doc.includes('database reads'));
  assert.ok(doc.includes('database writes'));
  assert.ok(doc.includes('route handlers'));
  assert.ok(doc.includes('outbound HTTP delivery'));
  assert.ok(doc.includes('live delivery'));

  assert.equal(helper.includes('@prisma/client'), false);
  assert.equal(helper.includes('prisma.'), false);
  assert.equal(helper.includes('fetch('), false);
  assert.equal(helper.includes('UPDATE '), false);
  assert.equal(helper.includes('INSERT '), false);
  assert.equal(helper.includes('DELETE '), false);

  console.log('outbound-webhook-delivery-read-repository-contract.test.ts passed');
}
