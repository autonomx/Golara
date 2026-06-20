import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { buildScheduledReportStagingSmokeHarness } from '../../lib/analytics/admin-analytics-scheduled-report-staging-smoke';

const HARNESS_PATH = new URL('../../lib/analytics/admin-analytics-scheduled-report-staging-smoke.ts', import.meta.url);

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

const READY_OUTBOX = {
  destinationKey: 'owner-destination',
  sourceLabel: 'scheduled-report-staging',
  credentialRef: 'secret/ref',
  runtimeEnabled: true
} as const;

export async function runScheduledReportStagingSmokeTests() {
  const defaults = buildScheduledReportStagingSmokeHarness();
  assert.equal(defaults.status, 'staging_smoke_blocked');
  assert.equal(defaults.ownerOnly, true);
  assert.equal(defaults.liveDeliveryAttempted, false);
  assert.equal(defaults.automaticRunRegistered, false);
  assert.equal(defaults.runtimeStatus, 'fail_closed');
  assert.equal(defaults.clockPlanStatus, 'registration_blocked');
  assert.equal(defaults.outboxStatus, 'owner_outbox_invalid');
  assert.ok(defaults.blockers.length > 0);

  const ready = buildScheduledReportStagingSmokeHarness({
    evidence: READY_EVIDENCE,
    flags: READY_FLAGS,
    ownerOutbox: READY_OUTBOX
  });
  assert.equal(ready.status, 'staging_smoke_ready');
  assert.equal(ready.liveDeliveryAttempted, false);
  assert.equal(ready.automaticRunRegistered, false);
  assert.equal(ready.blockers.length, 0);
  assert.ok(ready.checklist.every((item) => item.ready));

  const unsafe = buildScheduledReportStagingSmokeHarness({
    evidence: READY_EVIDENCE,
    flags: { ...READY_FLAGS, manualRun: true },
    ownerOutbox: READY_OUTBOX
  });
  assert.equal(unsafe.status, 'staging_smoke_blocked');
  assert.ok(unsafe.blockers.some((blocker) => blocker.includes('manual-send staging must not enable queued runs')));
  assert.equal(unsafe.liveDeliveryAttempted, false);
  assert.equal(unsafe.automaticRunRegistered, false);

  const source = await readFile(HARNESS_PATH, 'utf8');
  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /setInterval|setTimeout|cron/i);
  assert.doesNotMatch(source, /fetch\(|sendMail|createTransport|nodemailer|smtp/i);
  assert.doesNotMatch(source, /await import\('@\/lib\/prisma'\)/);
  assert.doesNotMatch(source, /\.findMany\(|\.update\(|\.create\(/);

  console.log('scheduled-report-staging-smoke.test.ts passed');
}
