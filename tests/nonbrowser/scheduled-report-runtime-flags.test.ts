import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  SCHEDULED_REPORT_RUNTIME_FLAG_DEFINITIONS,
  buildScheduledReportRuntimeFlagMatrix
} from '../../lib/analytics/admin-analytics-scheduled-report-runtime-flags';

const FLAGS_PATH = new URL('../../lib/analytics/admin-analytics-scheduled-report-runtime-flags.ts', import.meta.url);

export async function runScheduledReportRuntimeFlagTests() {
  const defaults = buildScheduledReportRuntimeFlagMatrix();
  assert.equal(defaults.status, 'fail_closed');
  assert.equal(defaults.ownerOnly, true);
  assert.equal(defaults.productionDefaultsLocked, true);
  assert.equal(defaults.scheduledRunEnabled, false);
  assert.equal(defaults.sendEnabled, false);
  assert.equal(defaults.unsafeCombinationDetected, false);
  assert.equal(defaults.rows.length, SCHEDULED_REPORT_RUNTIME_FLAG_DEFINITIONS.length);
  assert.ok(defaults.rows.every((row) => row.defaultEnabled === false));

  const preview = buildScheduledReportRuntimeFlagMatrix({
    flags: {
      readPreview: true,
      recordingWrites: true,
      dryRunPreview: true,
      payloadPreview: true
    }
  });
  assert.equal(preview.status, 'ready_for_staging');
  assert.equal(preview.unsafeCombinationDetected, false);
  assert.equal(preview.scheduledRunEnabled, false);
  assert.equal(preview.sendEnabled, false);

  const unsafeSend = buildScheduledReportRuntimeFlagMatrix({ flags: { sendExecution: true } });
  assert.equal(unsafeSend.status, 'fail_closed');
  assert.equal(unsafeSend.sendEnabled, true);
  assert.equal(unsafeSend.unsafeCombinationDetected, true);
  assert.ok(unsafeSend.blockers.some((blocker) => blocker.includes('sendExecution requires manualRun')));

  const unsafeQueued = buildScheduledReportRuntimeFlagMatrix({
    flags: {
      readPreview: true,
      recordingWrites: true,
      dryRunPreview: true,
      payloadPreview: true,
      workerEvaluation: true,
      scheduleRuntime: true,
      clockRegistration: true,
      queuedRunRegistration: true,
      transportConfigured: true,
      manualRun: true
    }
  });
  assert.equal(unsafeQueued.status, 'fail_closed');
  assert.equal(unsafeQueued.scheduledRunEnabled, true);
  assert.equal(unsafeQueued.unsafeCombinationDetected, true);
  assert.ok(unsafeQueued.blockers.includes('manual-send staging must not enable queued runs'));

  const flagsSource = await readFile(FLAGS_PATH, 'utf8');
  assert.doesNotMatch(flagsSource, /process\.env/);
  assert.doesNotMatch(flagsSource, /setInterval|setTimeout|cron/i);
  assert.doesNotMatch(flagsSource, /fetch\(|sendMail|createTransport|nodemailer|smtp/i);
  assert.doesNotMatch(flagsSource, /await import\('@\/lib\/prisma'\)/);
  assert.doesNotMatch(flagsSource, /\.findMany\(|\.update\(|\.create\(/);

  console.log('scheduled-report-runtime-flags.test.ts passed');
}
