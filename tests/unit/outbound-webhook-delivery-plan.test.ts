import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { buildOutboundWebhookDeliveryPlan } from '../../lib/settings/outbound-webhook-delivery-plan';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function assertNoRuntimeDeliverySurface(pageSource: string) {
  assert.equal(pageSource.includes('fetch('), false);
  assert.equal(pageSource.includes('setInterval('), false);
  assert.equal(pageSource.includes('setTimeout('), false);
  assert.equal(pageSource.includes('retryWebhookDeliveryAction'), false);
  assert.equal(pageSource.includes('cancelWebhookDeliveryAction'), false);
}

export async function runOutboundWebhookDeliveryPlanTests() {
  const helper = source('lib/settings/outbound-webhook-delivery-plan.ts');
  const tracker = source('docs/production-roadmap-phase35-durable-outbound-webhook-worker.md');

  assert.match(helper, /buildOutboundWebhookDeliveryPlan/);
  assert.match(helper, /dispatcherEnabled: false/);
  assert.match(helper, /dispatcher_must_remain_disabled_in_phase35_planning/);
  assertNoRuntimeDeliverySurface(helper);

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

  assert.match(tracker, /Add an inert outbound delivery planning helper/);

  console.log('outbound-webhook-delivery-plan.test.ts passed');
}
