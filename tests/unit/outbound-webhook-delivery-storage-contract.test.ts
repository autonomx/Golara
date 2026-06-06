import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { buildOutboundWebhookDeliveryStorageBoundary } from '../../lib/settings/outbound-webhook-delivery-storage-contract';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runOutboundWebhookDeliveryStorageContractTests() {
  const helper = source('lib/settings/outbound-webhook-delivery-storage-contract.ts');
  const doc = source('docs/production-roadmap-phase36-outbound-storage-boundary.md');
  const migration = source('prisma/migrations/20260605190500_add_outbound_webhook_delivery/migration.sql');
  const schema = source('prisma/schema.prisma');

  const boundary = buildOutboundWebhookDeliveryStorageBoundary();
  assert.equal(boundary.migrationTableName, 'OutboundWebhookDelivery');
  assert.equal(boundary.storageReadyForRuntime, false);
  assert.equal(boundary.prismaModelEnabled, false);
  assert.equal(boundary.repositoryReadsEnabled, false);
  assert.equal(boundary.repositoryWritesEnabled, false);
  assert.equal(boundary.dispatcherEnabled, false);
  assert.equal(boundary.signingRuntimeEnabled, false);
  assert.equal(boundary.recoveryControlsEnabled, false);
  assert.deepEqual(boundary.capabilities, [
    'migration_exists',
    'schema_model_pending',
    'read_repository_pending',
    'write_repository_pending',
    'dispatcher_pending',
    'signing_runtime_pending',
    'recovery_controls_pending'
  ]);
  assert.ok(boundary.auditLabels.includes('repository-reads:disabled'));
  assert.ok(boundary.auditLabels.includes('repository-writes:disabled'));
  assert.ok(boundary.auditLabels.includes('dispatcher:disabled'));

  const withModel = buildOutboundWebhookDeliveryStorageBoundary({ prismaModelEnabled: true });
  assert.equal(withModel.storageReadyForRuntime, false);
  assert.equal(withModel.prismaModelEnabled, true);
  assert.equal(withModel.repositoryReadsEnabled, false);
  assert.equal(withModel.repositoryWritesEnabled, false);
  assert.equal(withModel.capabilities.includes('schema_model_pending'), false);

  assert.ok(migration.includes('CREATE TABLE IF NOT EXISTS "OutboundWebhookDelivery"'));
  assert.equal(schema.includes('model OutboundWebhookDelivery'), false);

  assert.ok(doc.includes('pure storage-boundary helper'));
  assert.ok(doc.includes('Prisma model alignment'));
  assert.ok(doc.includes('repository reads are disabled'));
  assert.ok(doc.includes('repository writes are disabled'));
  assert.ok(doc.includes('dispatcher behavior is disabled'));
  assert.ok(doc.includes('signing runtime is disabled'));
  assert.ok(doc.includes('recovery controls are disabled'));
  assert.ok(doc.includes('does not add'));
  assert.ok(doc.includes('database reads'));
  assert.ok(doc.includes('database writes'));
  assert.ok(doc.includes('outbound HTTP delivery'));

  assert.equal(helper.includes('fetch('), false);
  assert.equal(helper.includes('@prisma/client'), false);
  assert.equal(helper.includes('prisma.'), false);

  console.log('outbound-webhook-delivery-storage-contract.test.ts passed');
}
