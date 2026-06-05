import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { buildOutboundWebhookDeliveryPlan } from '../../lib/settings/outbound-webhook-delivery-plan';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function migrationFiles(root = 'prisma/migrations') {
  if (!existsSync(root)) return [];

  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const migrationPath = join(root, entry.name, 'migration.sql');
      return existsSync(migrationPath) ? [migrationPath] : [];
    });
}

export async function runOutboundWebhookDeliveryPlanTests() {
  const helper = source('lib/settings/outbound-webhook-delivery-plan.ts');
  const tracker = source('docs/production-roadmap-phase35-durable-outbound-webhook-worker.md');
  const schema = source('prisma/schema.prisma');
  const migrations = migrationFiles().map((path) => [path, source(path)] as const);

  assert.match(helper, /buildOutboundWebhookDeliveryPlan/);
  assert.match(helper, /dispatcherEnabled: false/);
  assert.match(helper, /dispatcher_must_remain_disabled_in_phase35_planning/);

  const plannedDelivery = buildOutboundWebhookDeliveryPlan({
    configurationKey: 'default-webhook-configuration',
    eventType: 'order.created',
    eventRef: 'order_123',
    payloadDigest: 'sha256:abc',
    targetReady: true
  });
  assert.equal(plannedDelivery.status, 'planned');
  assert.equal(plannedDelivery.readyForFutureDispatch, true);
  assert.equal(plannedDelivery.dispatcherEnabled, false);
  assert.equal(plannedDelivery.attemptCount, 0);
  assert.deepEqual(plannedDelivery.blockers, []);
  assert.equal(plannedDelivery.idempotencyKey, 'default-webhook-configuration:order.created:order_123:sha256:abc');
  assert.ok(plannedDelivery.auditLabels.includes('status:planned'));

  const blockedDelivery = buildOutboundWebhookDeliveryPlan({
    configurationKey: '',
    eventType: '',
    eventRef: '',
    payloadDigest: '',
    targetReady: false,
    dispatcherEnabled: true
  });
  assert.equal(blockedDelivery.status, 'planned');
  assert.equal(blockedDelivery.readyForFutureDispatch, false);
  assert.equal(blockedDelivery.dispatcherEnabled, false);
  assert.deepEqual(blockedDelivery.blockers, [
    'configuration_key_missing',
    'event_type_missing',
    'event_ref_missing',
    'payload_digest_missing',
    'webhook_target_not_ready',
    'dispatcher_must_remain_disabled_in_phase35_planning'
  ]);

  const retryWaitDelivery = buildOutboundWebhookDeliveryPlan({
    configurationKey: 'default-webhook-configuration',
    eventType: 'order.updated',
    eventRef: 'order_123',
    payloadDigest: 'sha256:def',
    idempotencyKey: 'custom-key',
    targetReady: true,
    attemptCount: 2,
    lastOutcomeCategory: 'timeout'
  });
  assert.equal(retryWaitDelivery.status, 'retry_wait');
  assert.equal(retryWaitDelivery.idempotencyKey, 'custom-key');
  assert.equal(retryWaitDelivery.readyForFutureDispatch, false);
  assert.ok(retryWaitDelivery.auditLabels.includes('outcome:timeout'));

  const acceptedDelivery = buildOutboundWebhookDeliveryPlan({
    configurationKey: 'default-webhook-configuration',
    eventType: 'order.updated',
    eventRef: 'order_123',
    payloadDigest: 'sha256:ghi',
    targetReady: true,
    attemptCount: 1,
    lastOutcomeCategory: 'accepted'
  });
  assert.equal(acceptedDelivery.status, 'accepted');
  assert.equal(acceptedDelivery.readyForFutureDispatch, false);

  assert.match(tracker, /outbound-webhook-delivery-plan\.ts/);
  assert.match(tracker, /## Persistence planning/);
  assert.match(tracker, /no database migration/);
  assert.match(tracker, /payload digest/i);
  assert.match(tracker, /idempotency/i);
  assert.match(tracker, /configuration\/status lookups/);
  assert.match(tracker, /nextEligibleAttemptAt/);
  assert.match(tracker, /Do not store signing secrets/);
  assert.match(tracker, /Do not store raw sensitive response bodies/);
  assert.match(tracker, /Migration contract reviewed/);
  assert.match(tracker, /Dispatcher remains deferred/);
  assert.match(tracker, /Admin retry\/cancel controls should remain deferred/);

  assert.match(tracker, /## Migration contract planning/);
  assert.match(tracker, /Future table contract/);
  assert.match(tracker, /Future constraint\/index contract/);
  assert.match(tracker, /Unique index on `idempotencyKey`/);
  assert.match(tracker, /Polling index on `status` plus `nextEligibleAttemptAt`/);
  assert.match(tracker, /Rollback and rollout expectations/);
  assert.match(tracker, /This migration contract plan is not a database migration/);
  assert.match(tracker, /No migration directory, SQL file, schema model, generated client change, or persistence write path belongs in this slice/);

  assert.equal(schema.includes('model OutboundWebhookDelivery'), false);
  assert.equal(
    migrations.some(([path, content]) => /outbound[-_ ]?webhook[-_ ]?delivery/i.test(path) || /OutboundWebhookDelivery/.test(content)),
    false
  );
  assert.equal(migrations.some(([, content]) => /CREATE TABLE[^;]+OutboundWebhookDelivery/s.test(content)), false);

  console.log('outbound-webhook-delivery-plan.test.ts passed');
}
