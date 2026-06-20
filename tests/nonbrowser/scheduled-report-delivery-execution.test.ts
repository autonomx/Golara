import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  executeScheduledReportDelivery,
  type AdminAnalyticsScheduledReportDeliveryGateState
} from '../../lib/analytics/admin-analytics-scheduled-report-delivery-execution';
import {
  createDisabledScheduledReportTransportAdapter,
  createTestScheduledReportTransportAdapter,
  type AdminAnalyticsScheduledReportTransportPayload
} from '../../lib/analytics/admin-analytics-scheduled-report-transport';

const DELIVERY_PATH = new URL('../../lib/analytics/admin-analytics-scheduled-report-delivery-execution.ts', import.meta.url);
const LIVE_PATTERNS = ['send' + 'Mail', 'create' + 'Transport', 'nodemailer', 'smtp', 'fetch\\(', 'setInterval', 'setTimeout', 'cron'];
const LIVE_EXECUTION_PATTERN = new RegExp(LIVE_PATTERNS.join('|'), 'i');

function payload(): AdminAnalyticsScheduledReportTransportPayload {
  return {
    reportId: 'sched_1',
    reportKey: 'weekly-owner',
    label: 'Weekly owner report',
    generatedAt: '2026-01-04T00:00:00.000Z',
    recipientCount: 1,
    assets: [{ filename: 'business.csv', contentType: 'text/csv', byteLength: 42, rowCount: 2 }]
  };
}

function allGates(): AdminAnalyticsScheduledReportDeliveryGateState {
  return {
    ownerApproved: true,
    dryRunEvidenceRecorded: true,
    globalKillSwitchPermitsDelivery: true,
    activeSchedule: true,
    deliveryPayloadMaterialized: true,
    deliveryExecutionEnabled: true,
    deliveryTransportConfigured: true,
    retryExecutionEnabled: false
  };
}

export async function runScheduledReportDeliveryExecutionTests() {
  const blocked = await executeScheduledReportDelivery({
    payload: payload(),
    now: new Date('2026-01-04T00:00:00.000Z')
  });
  assert.equal(blocked.status, 'blocked');
  assert.equal(blocked.sent, false);
  assert.equal(blocked.transportResult, null);
  assert.equal(blocked.failureRecord, null);
  assert.equal(blocked.auditRecord.event, 'delivery_blocked');
  assert.ok(blocked.auditRecord.blockers.includes('owner approval evidence not recorded'));
  assert.ok(blocked.auditRecord.blockers.includes('delivery execution flag is disabled'));

  const disabledTransport = await executeScheduledReportDelivery({
    payload: payload(),
    gates: allGates(),
    adapter: createDisabledScheduledReportTransportAdapter(),
    now: new Date('2026-01-04T00:00:00.000Z')
  });
  assert.equal(disabledTransport.status, 'failed');
  assert.equal(disabledTransport.sent, false);
  assert.equal(disabledTransport.auditRecord.event, 'delivery_failed');
  assert.equal(disabledTransport.failureRecord?.retryEligible, false);

  const delivered = await executeScheduledReportDelivery({
    payload: payload(),
    gates: allGates(),
    adapter: createTestScheduledReportTransportAdapter(),
    now: new Date('2026-01-04T00:00:00.000Z')
  });
  assert.equal(delivered.status, 'delivered');
  assert.equal(delivered.sent, true);
  assert.equal(delivered.auditRecord.event, 'delivery_dispatched');
  assert.equal(delivered.failureRecord, null);
  assert.equal(delivered.transportResult?.provider, 'test');

  const retryBlocked = await executeScheduledReportDelivery({
    payload: payload(),
    gates: { ...allGates(), retryExecutionEnabled: true },
    adapter: createTestScheduledReportTransportAdapter(),
    now: new Date('2026-01-04T00:00:00.000Z')
  });
  assert.equal(retryBlocked.status, 'blocked');
  assert.equal(retryBlocked.sent, false);
  assert.ok(retryBlocked.auditRecord.blockers.includes('retry execution must remain disabled in delivery execution slice'));

  const source = await readFile(DELIVERY_PATH, 'utf8');
  assert.doesNotMatch(source, LIVE_EXECUTION_PATTERN);
  assert.doesNotMatch(source, /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/);
  assert.doesNotMatch(source, /await import\('@\/lib\/prisma'\)/);
  assert.doesNotMatch(source, /\.findMany\(|\.update\(|\.create\(/);

  console.log('scheduled-report-delivery-execution.test.ts passed');
}
