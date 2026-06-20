import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { buildScheduledReportClockActivationReadiness } from '../../lib/analytics/admin-analytics-scheduled-report-clock-activation';

const CLOCK_PATH = new URL('../../lib/analytics/admin-analytics-scheduled-report-clock-activation.ts', import.meta.url);

const READY_FLAGS = {
  readPreview: true,
  recordingWrites: true,
  dryRunPreview: true,
  payloadPreview: true,
  workerEvaluation: true,
  scheduleRuntime: true,
  clockRegistration: true,
  queuedRunRegistration: true
} as const;

export async function runScheduledReportClockActivationTests() {
  const blocked = buildScheduledReportClockActivationReadiness({
    isOwner: false,
    flags: {},
    policy: {
      lockKey: null,
      maxConcurrentRuns: 2,
      staleLockTimeoutMinutes: 1,
      maxRunsPerHour: 0
    }
  });
  assert.equal(blocked.status, 'clock_activation_blocked');
  assert.equal(blocked.ownerOnly, true);
  assert.equal(blocked.timerCreated, false);
  assert.equal(blocked.backgroundLoopStarted, false);
  assert.equal(blocked.queuedRunCreated, false);
  assert.ok(blocked.blockers.includes('owner session is required'));
  assert.ok(blocked.blockers.includes('max concurrent runs must be exactly one'));

  const ready = buildScheduledReportClockActivationReadiness({
    isOwner: true,
    flags: READY_FLAGS,
    policy: {
      operatorApproved: true,
      lockKey: 'scheduled-report-clock',
      maxConcurrentRuns: 1,
      staleLockTimeoutMinutes: 10,
      maxRunsPerHour: 2
    }
  });
  assert.equal(ready.status, 'clock_activation_ready');
  assert.equal(ready.timerCreated, false);
  assert.equal(ready.backgroundLoopStarted, false);
  assert.equal(ready.queuedRunCreated, false);
  assert.equal(ready.lockRequired, true);
  assert.equal(ready.concurrencyLimit, 1);
  assert.equal(ready.blockers.length, 0);

  const source = await readFile(CLOCK_PATH, 'utf8');
  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /setInterval|setTimeout|cron/i);
  assert.doesNotMatch(source, /fetch\(|sendMail|createTransport|nodemailer|smtp/i);
  assert.doesNotMatch(source, /await import\('@\/lib\/prisma'\)/);
  assert.doesNotMatch(source, /\.findMany\(|\.update\(|\.create\(/);

  console.log('scheduled-report-clock-activation.test.ts passed');
}
