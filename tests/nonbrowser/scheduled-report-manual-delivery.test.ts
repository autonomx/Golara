import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { executeScheduledReportManualDelivery } from '../../lib/analytics/admin-analytics-scheduled-report-manual-delivery';
import { createTestScheduledReportTransportAdapter, type AdminAnalyticsScheduledReportTransportPayload } from '../../lib/analytics/admin-analytics-scheduled-report-transport';

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
      ownerSession: true,
      manualRunEnabled: true,
      scheduleRuntimeEnabled: true,
      queuedRunRegistrationEnabled: true,
      ownerApproved: true,
      dryRunEvidenceRecorded: true,
      globalKillSwitchPermitsDelivery: true,
      activeSchedule: true,
      deliveryPayloadMaterialized: true,
      deliveryExecutionEnabled: true,
      deliveryTransportConfigured: true
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
    gates: {
      ownerSession: true,
      manualRunEnabled: true,
      ownerApproved: true,
      dryRunEvidenceRecorded: true,
      globalKillSwitchPermitsDelivery: true,
      activeSchedule: true,
      deliveryPayloadMaterialized: true,
      deliveryExecutionEnabled: true,
      deliveryTransportConfigured: true
    },
    adapter: createTestScheduledReportTransportAdapter(),
    now: new Date('2026-01-04T00:00:00.000Z')
  });
  assert.equal(delivered.status, 'delivered');
  assert.equal(delivered.sent, true);
  assert.equal(delivered.manualBlockers.length, 0);

  const source = await readFile(MANUAL_DELIVERY_PATH, 'utf8');
  assert.doesNotMatch(source, /setInterval|setTimeout|cron/i);
  assert.doesNotMatch(source, /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/);
  assert.doesNotMatch(source, /await import\('@\/lib\/prisma'\)/);
  assert.doesNotMatch(source, /\.findMany\(|\.update\(|\.create\(/);

  console.log('scheduled-report-manual-delivery.test.ts passed');
}
