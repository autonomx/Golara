import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildNotificationDeliveryPersistenceMatrix,
  NOTIFICATION_DELIVERY_ATTEMPT_FIELDS,
  NOTIFICATION_DELIVERY_ATTEMPT_STATUSES,
  NOTIFICATION_DELIVERY_IDEMPOTENCY_COMPONENTS,
  summarizeNotificationDeliveryPersistenceReadiness
} from '../../lib/notifications/notification-delivery-persistence-matrix';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function assertNoLiveDeliverySurface(contents: string) {
  assert.equal(contents.includes('fetch('), false);
  assert.equal(contents.includes('https://api.'), false);
  assert.equal(contents.includes('https://graph.facebook.com'), false);
  assert.equal(contents.includes('https://api.twilio.com'), false);
  assert.equal(contents.includes('https://api.sendgrid.com'), false);
  assert.equal(contents.includes('https://api.resend.com'), false);
  assert.equal(contents.includes('PrismaClient'), false);
  assert.equal(contents.includes('prisma.'), false);
  assert.equal(contents.includes('process.env'), false);
  assert.equal(contents.includes('<button'), false);
  assert.equal(contents.includes('onClick='), false);
}

export async function runNotificationDeliveryPersistenceMatrixTests() {
  const matrixSource = source('lib/notifications/notification-delivery-persistence-matrix.ts');
  const planningDoc = source('docs/production-roadmap-phase34-delivery-attempt-persistence-planning.md');

  assertNoLiveDeliverySurface(matrixSource);

  for (const field of [
    'id',
    'channel',
    'scenario',
    'recipientKind',
    'recipientRef',
    'providerMode',
    'providerName',
    'templateKey',
    'idempotencyKey',
    'status',
    'attemptCount',
    'lastOutcomeCategory',
    'nextEligibleAttemptAt',
    'lastProviderReference',
    'createdAt',
    'updatedAt'
  ] as const) {
    assert.ok(NOTIFICATION_DELIVERY_ATTEMPT_FIELDS.includes(field));
    assert.ok(planningDoc.includes(field));
  }

  for (const status of [
    'planned',
    'skipped',
    'manual_required',
    'logged',
    'queued',
    'sending',
    'accepted',
    'rejected',
    'rate_limited',
    'unavailable',
    'failed',
    'suppressed'
  ] as const) {
    assert.ok(NOTIFICATION_DELIVERY_ATTEMPT_STATUSES.includes(status));
    assert.ok(planningDoc.includes(status));
  }

  for (const component of [
    'channel',
    'scenario',
    'businessObjectType',
    'businessObjectId',
    'recipientKind',
    'recipientRef',
    'templateKey',
    'environmentName'
  ] as const) {
    assert.ok(NOTIFICATION_DELIVERY_IDEMPOTENCY_COMPONENTS.includes(component));
  }

  const matrix = buildNotificationDeliveryPersistenceMatrix();
  assert.equal(matrix.length, 4);
  assert.deepEqual(
    matrix.map((entry) => entry.id),
    [
      'notification-attempt-record-shape',
      'notification-idempotency-contract',
      'notification-worker-boundary',
      'notification-suppression-retention-boundary'
    ]
  );

  for (const entry of matrix) {
    assert.equal(entry.liveDeliveryEnabled, false);
    assert.ok(entry.requiredFields.length > 0);
    assert.ok(entry.statuses.length > 0);
    assert.ok(entry.privacyControls.length > 0);
    assert.ok(entry.evidenceRequired.length > 0);
  }

  const idempotency = matrix.find((entry) => entry.id === 'notification-idempotency-contract');
  assert.ok(idempotency);
  assert.ok(idempotency.requiredFields.includes('idempotencyKey'));
  assert.ok(idempotency.privacyControls.includes('deterministic_key_without_secret_values'));
  assert.ok(idempotency.evidenceRequired.includes('duplicate_send_prevention_test'));

  const workerBoundary = matrix.find((entry) => entry.id === 'notification-worker-boundary');
  assert.ok(workerBoundary);
  assert.ok(workerBoundary.privacyControls.includes('no_worker_without_live_enablement_gate'));
  assert.ok(workerBoundary.evidenceRequired.includes('dead_letter_visibility_review'));

  const summary = summarizeNotificationDeliveryPersistenceReadiness();
  assert.equal(summary.liveDeliveryEnabled, false);
  assert.equal(summary.requirementCount, 4);
  assert.equal(summary.requiredFieldCount, 16);
  assert.equal(summary.statusCount, 12);
  assert.equal(summary.idempotencyComponentCount, 8);
  assert.deepEqual(summary.blockerReasons, [
    'delivery_attempt_migration_not_applied',
    'provider_evidence_not_confirmed',
    'notification_smoke_tests_not_confirmed',
    'delivery_persistence_not_confirmed'
  ]);

  console.log('notification-delivery-persistence-matrix.test.ts passed');
}
