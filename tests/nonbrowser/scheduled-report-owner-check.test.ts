import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { buildScheduledReportPilotReadiness } from '../../lib/analytics/admin-analytics-scheduled-report-pilot-readiness';
import type { AdminAnalyticsScheduledReportTransportPayload } from '../../lib/analytics/admin-analytics-scheduled-report-transport';

const CHECK_PATH = new URL('../../lib/analytics/admin-analytics-scheduled-report-pilot-readiness.ts', import.meta.url);

const READY_FLAGS = {
  readPreview: true,
  recordingWrites: true,
  dryRunPreview: true,
  payloadPreview: true,
  workerEvaluation: true,
  scheduleRuntime: true,
  clockRegistration: true,
  queuedRunRegistration: true,
  transportConfigured: true
} as const;

const READY_EVIDENCE = {
  reportConfigExists: true,
  ownerApprovalExists: true,
  dryRunEvidenceExists: true,
  payloadMaterializes: true,
  manualOwnerRunGatesPass: true
} as const;

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

export async function runScheduledReportOwnerCheckTests() {
  const blocked = buildScheduledReportPilotReadiness({
    isOwner: false,
    reportId: null,
    payload: payload(),
    outbox: { channelKey: null, destinationKey: null, credentialRef: null, payloadSigningRef: null }
  });
  assert.equal(blocked.status, 'pilot_blocked');
  assert.equal(blocked.liveActionStarted, false);
  assert.equal(blocked.automaticRunRegistered, false);
  assert.equal(blocked.retryLoopStarted, false);

  const ready = buildScheduledReportPilotReadiness({
    isOwner: true,
    reportId: 'sched_1',
    payload: payload(),
    evidence: READY_EVIDENCE,
    flags: READY_FLAGS,
    outbox: {
      channelKey: 'primary',
      destinationKey: 'owner',
      credentialRef: 'secret/ref',
      payloadSigningRef: 'signing/ref',
      runtimeEnabled: true,
      operatorApproved: true
    },
    history: []
  });
  assert.equal(ready.status, 'pilot_ready');
  assert.equal(ready.blockers.length, 0);

  const source = await readFile(CHECK_PATH, 'utf8');
  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /setInterval|setTimeout|cron/i);
  assert.doesNotMatch(source, /await import\('@\/lib\/prisma'\)/);
  assert.doesNotMatch(source, /\.findMany\(|\.update\(|\.create\(/);

  console.log('scheduled-report-owner-check.test.ts passed');
}
