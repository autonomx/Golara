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
      return existsSync(migrationPath) ? ([[migrationPath, source(migrationPath)] as const]) : [];
    });
}

export async function runOutboundWebhookDeliveryPlanTests() {
  const helper = source('lib/settings/outbound-webhook-delivery-plan.ts');
  const tracker = source('docs/production-roadmap-phase35-durable-outbound-webhook-worker.md');
  const migrationNote = source('docs/production-roadmap-phase35-outbound-delivery-migration.md');
  const modelAlignmentNote = source('docs/production-roadmap-phase35-prisma-model-alignment.md');
  const schema = source('prisma/schema.prisma');
  const migrations = migrationFiles();
  const outboundDeliveryMigration = migrations.find(([path, content]) =>
    path.includes('add_outbound_webhook_delivery') && content.includes('OutboundWebhookDelivery')
  );

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

  assert.match(tracker, /## Authenticity contract planning/);
  assert.match(tracker, /Future canonical payload expectations/);
  assert.match(tracker, /Future header contract/);
  assert.match(tracker, /X-Golara-Timestamp/);
  assert.match(tracker, /X-Golara-Payload-Digest/);
  assert.match(tracker, /X-Golara-Signature/);
  assert.match(tracker, /Future verification contract/);
  assert.match(tracker, /Secret and rotation boundaries/);
  assert.match(tracker, /Runtime deferral gates/);
  assert.match(tracker, /without adding runtime signing/);

  assert.match(tracker, /## Retry\/backoff policy planning/);
  assert.match(tracker, /maximum attempt count/);
  assert.match(tracker, /initial delay/);
  assert.match(tracker, /backoff multiplier/);
  assert.match(tracker, /maximum delay cap/);
  assert.match(tracker, /jitter strategy/);
  assert.match(tracker, /retryable outcome categories/);
  assert.match(tracker, /terminal outcome categories/);
  assert.match(tracker, /nextEligibleAttemptAt/);
  assert.match(tracker, /attemptCount/);
  assert.match(tracker, /Idempotency must be preserved across retries/);
  assert.match(tracker, /Dead-letter records should be visible/);
  assert.match(tracker, /Manual recovery remains deferred/);
  assert.match(tracker, /No retry execution is added here/);
  assert.match(tracker, /The dispatcher remains deferred/);

  assert.ok(outboundDeliveryMigration);
  assert.match(outboundDeliveryMigration[1], /CREATE TABLE IF NOT EXISTS "OutboundWebhookDelivery"/);
  assert.match(outboundDeliveryMigration[1], /"configurationKey" TEXT NOT NULL/);
  assert.match(outboundDeliveryMigration[1], /"eventType" TEXT NOT NULL/);
  assert.match(outboundDeliveryMigration[1], /"eventRef" TEXT NOT NULL/);
  assert.match(outboundDeliveryMigration[1], /"payloadDigest" TEXT NOT NULL/);
  assert.match(outboundDeliveryMigration[1], /"idempotencyKey" TEXT NOT NULL/);
  assert.match(outboundDeliveryMigration[1], /"attemptCount" INTEGER NOT NULL DEFAULT 0/);
  assert.match(outboundDeliveryMigration[1], /"nextEligibleAttemptAt" TIMESTAMP\(3\)/);
  assert.match(outboundDeliveryMigration[1], /"deadLetterSummary" TEXT/);
  assert.match(outboundDeliveryMigration[1], /OutboundWebhookDelivery_idempotencyKey_key/);
  assert.match(outboundDeliveryMigration[1], /OutboundWebhookDelivery_status_nextEligibleAttemptAt_idx/);
  assert.match(outboundDeliveryMigration[1], /OutboundWebhookDelivery_attemptCount_nonnegative_check/);
  assert.match(outboundDeliveryMigration[1], /OutboundWebhookDelivery_status_check/);

  assert.match(migrationNote, /additive migration slice/);
  assert.match(migrationNote, /repository\/service write path/);
  assert.match(migrationNote, /does not make outbound delivery operational/);

  assert.match(modelAlignmentNote, /Prisma Model Alignment/);
  assert.match(modelAlignmentNote, /connector-write blocker documentation only/);
  assert.match(modelAlignmentNote, /Expected Prisma model shape/);
  assert.match(modelAlignmentNote, /passive client mapping only/);
  assert.match(modelAlignmentNote, /`idempotencyKey` \| `String` \| Required and unique/);
  assert.match(modelAlignmentNote, /`nextEligibleAttemptAt` \| `DateTime\?`/);
  assert.match(modelAlignmentNote, /`deadLetterSummary` \| `String\?`/);
  assert.match(modelAlignmentNote, /`attemptCount` \| `Int`/);
  assert.match(modelAlignmentNote, /@@unique\(\[idempotencyKey\]\)/);
  assert.match(modelAlignmentNote, /@@index\(\[configurationKey, status\]\)/);
  assert.match(modelAlignmentNote, /@@index\(\[eventType, eventRef\]\)/);
  assert.match(modelAlignmentNote, /@@index\(\[status, nextEligibleAttemptAt\]\)/);
  assert.match(modelAlignmentNote, /@@index\(\[createdAt\]\)/);
  assert.match(modelAlignmentNote, /Generated-client validation must run on the exact PR head/);
  assert.match(modelAlignmentNote, /## Canonical passive model snippet/);
  assert.match(modelAlignmentNote, /model OutboundWebhookDelivery \{/);
  assert.match(modelAlignmentNote, /id\s+String\s+@id @default\(cuid\(\)\)/);
  assert.match(modelAlignmentNote, /idempotencyKey\s+String\s+@unique/);
  assert.match(modelAlignmentNote, /status\s+String\s+@default\("planned"\)/);
  assert.match(modelAlignmentNote, /attemptCount\s+Int\s+@default\(0\)/);
  assert.match(modelAlignmentNote, /nextEligibleAttemptAt DateTime\?/);
  assert.match(modelAlignmentNote, /updatedAt\s+DateTime\s+@updatedAt/);
  assert.match(modelAlignmentNote, /## Schema update preflight/);
  assert.match(modelAlignmentNote, /Record the source schema blob SHA before editing/);
  assert.match(modelAlignmentNote, /Read the entire file in ordered chunks/);
  assert.match(modelAlignmentNote, /Preserve all existing models/);
  assert.match(modelAlignmentNote, /Insert only one `model OutboundWebhookDelivery` block/);
  assert.match(modelAlignmentNote, /Treat any truncated schema read as a blocker/);
  assert.match(modelAlignmentNote, /schema diff contains only the intended additive model block/);
  assert.match(modelAlignmentNote, /## Connector write blocker/);
  assert.match(modelAlignmentNote, /5bf481b801ef73f28ea0c0eee98e26e7abb731be/);
  assert.match(modelAlignmentNote, /final `AdminAuditLog` model/);
  assert.match(modelAlignmentNote, /does not yet contain `model OutboundWebhookDelivery`/);
  assert.match(modelAlignmentNote, /replaces a complete file/);
  assert.match(modelAlignmentNote, /safe line-range edit/);
  assert.match(modelAlignmentNote, /verified full-file schema source or a patch-capable write path/);
  assert.match(modelAlignmentNote, /Source guard expectations/);
  assert.match(modelAlignmentNote, /Add `model OutboundWebhookDelivery` to `prisma\/schema\.prisma`/);
  assert.match(modelAlignmentNote, /service write paths/);
  assert.match(modelAlignmentNote, /does not make outbound delivery operational/);

  assert.match(schema, /model AdminAuditLog \{/);
  assert.equal(schema.includes('model OutboundWebhookDelivery'), false);

  console.log('outbound-webhook-delivery-plan.test.ts passed');
}
