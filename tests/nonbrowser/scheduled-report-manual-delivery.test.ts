import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  executeScheduledReportManualDelivery,
  executeScheduledReportManualProviderDelivery
} from '../../lib/analytics/admin-analytics-scheduled-report-manual-delivery';
import {
  createTestScheduledReportTransportAdapter,
  type AdminAnalyticsScheduledReportTransportPayload
} from '../../lib/analytics/admin-analytics-scheduled-report-transport';

const MANUAL_DELIVERY_PATH = new URL('../../lib/analytics/admin-analytics-scheduled-report-manual-delivery.ts', import.meta.url);

function payload(): AdminAnalyticsScheduledReportTransportPayload {
  return {
    reportId: 'sched_1',
    reportKey: 'weekly-owner',
    label: 'Weekly owner report',
    generatedAt: '2026-01-04T00:00:00.000Z',
    recipientCount: 1,
    assets: [
      {
        filename: 'business.csv',
        contentType: 'text/csv',
        byteLength: 42,
        rowCount: 2
      }
    ]
  };
}

const deliveryGates = {
  ownerSession: true,
  manualRunEnabled: true,
  ownerApproved: true,
  dryRunEvidenceRecorded: true,
  globalKillSwitchPermitsDelivery: true,
  activeSchedule: true,
  deliveryPayloadMaterialized: true,
  deliveryExecutionEnabled: true,
  deliveryTransportConfigured: true
};

const providerOptions = {
  destinationKey: 'owner-primary',
  sourceLabel: 'scheduled-reports',
  credentialRef: 'owner-outbox-ref',
  providerKey: 'provider-ref',
  runtimeEnabled: true
};

export async function runScheduledReportManualDeliveryTests() {
  const blocked = await executeScheduledReportManualDelivery({ payload: payload(), now: new Date('2026-01-04T00:00:00.000Z') });
  assert.equal(blocked.mode, 'manual_owner_run');
  assert.equal(blocked.status, 'blocked');
  assert.equal(blocked.sent, false);
  assert.ok(blocked.manualBlockers.includes('owner session is required'));
  assert.ok(blocked.manualBlockers.includes('manual run flag is disabled'));

  const unsafeQueued = await executeScheduledReportManualDelivery({
    payload: payload(),
    gates: {
      ...deliveryGates,
      scheduleRuntimeEnabled: true,
      queuedRunRegistrationEnabled: true
    },
    adapter: createTestScheduledReportTransportAdapter(),
    now: new Date('2026-01-04T00:00:00.000Z')
  });
  assert.equal(unsafeQueued.status, 'blocked');
  assert.equal(unsafeQueued.sent, false);
  assert.ok(unsafeQueued.manualBlockers.includes('schedule runtime must remain disabled for manual delivery'));
  assert.ok(unsafeQueued.manualBlockers.includes('queued run registration must remain disabled for manual delivery'));

  const delivered = await executeScheduledReportManualDelivery({
    payload: payload(),
    gates: deliveryGates,
    adapter: createTestScheduledReportTransportAdapter(),
    now: new Date('2026-01-04T00:00:00.000Z')
  });
  assert.equal(delivered.status, 'delivered');
  assert.equal(delivered.sent, true);
  assert.equal(delivered.manualBlockers.length, 0);

  const providerMissingHandler = await executeScheduledReportManualProviderDelivery({
    payload: payload(),
    gates: deliveryGates,
    providerOptions,
    now: new Date('2026-01-04T00:00:00.000Z')
  });
  assert.equal(providerMissingHandler.status, 'failed');
  assert.equal(providerMissingHandler.sent, false);
  assert.equal(providerMissingHandler.transportResult?.provider, 'owner-provider');
  assert.ok(providerMissingHandler.manualBlockers.includes('provider dispatch handler is not configured'));

  const providerCalls: string[] = [];
  const providerDelivered = await executeScheduledReportManualProviderDelivery({
    payload: payload(),
    gates: deliveryGates,
    providerOptions,
    providerDispatch: async (transportPayload) => {
      providerCalls.push(transportPayload.reportId);
      return { providerMessageId: 'msg_1' };
    },
    now: new Date('2026-01-04T00:00:00.000Z')
  });
  assert.equal(providerDelivered.status, 'delivered');
  assert.equal(providerDelivered.sent, true);
  assert.equal(providerDelivered.transportResult?.provider, 'owner-provider');
  assert.equal(providerDelivered.transportResult?.providerMessageId, 'msg_1');
  assert.deepEqual(providerCalls, ['sched_1']);

  const source = await readFile(MANUAL_DELIVERY_PATH, 'utf8');
  assert.match(source, /executeScheduledReportManualProviderDelivery/);
  assert.match(source, /createProviderScheduledReportTransportAdapter/);
  assert.doesNotMatch(source, /setInterval|setTimeout|cron/i);
  assert.doesNotMatch(source, /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/);
  assert.doesNotMatch(source, /await import\('@\/lib\/prisma'\)/);
  assert.doesNotMatch(source, /\.findMany\(|\.update\(|\.create\(/);

  console.log('scheduled-report-manual-delivery.test.ts passed');
}
