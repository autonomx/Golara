import assert from 'node:assert/strict';

import { createDisabledScheduledReportWorkerShell } from '../../lib/analytics/admin-analytics-scheduled-report-worker-shell';

export async function runScheduledReportWorkerShellTests() {
  const shell = createDisabledScheduledReportWorkerShell();
  assert.equal(shell.enabled, false);
  console.log('scheduled-report-worker-shell.test.ts passed');
}
