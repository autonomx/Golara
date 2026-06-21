import assert from 'node:assert/strict';

import { registerScheduledReportScheduler } from '../../lib/analytics/admin-analytics-scheduled-report-scheduler-registration';

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

export async function runScheduledReportClockRegistryTests() {
  const blocked = await registerScheduledReportScheduler({
    isOwner: true,
    operatorApproved: true,
    flags: READY_FLAGS,
    lockKey: 'scheduled-report-clock',
    staleLockTimeoutMinutes: 10,
    maxRunsPerHour: 2
  });
  assert.equal(blocked.status, 'scheduler_registration_blocked');
  assert.equal(blocked.registered, false);
  assert.equal(blocked.clockRegistered, false);
  assert.equal(blocked.queuedRunRegistered, false);
  assert.equal(blocked.automaticWorkerExecutionEnabled, false);
  assert.ok(blocked.blockers.includes('scheduler registrar is not configured'));

  const calls: Array<{ lockKey: string; maxRunsPerHour: number }> = [];
  const registered = await registerScheduledReportScheduler({
    isOwner: true,
    operatorApproved: true,
    flags: READY_FLAGS,
    lockKey: 'scheduled-report-clock',
    staleLockTimeoutMinutes: 10,
    maxRunsPerHour: 2,
    registrar: async (request) => {
      calls.push({ lockKey: request.lockKey, maxRunsPerHour: request.maxRunsPerHour });
      return { registrationId: 'clock_reg_1' };
    }
  });
  assert.equal(registered.status, 'scheduler_registered');
  assert.equal(registered.registered, true);
  assert.equal(registered.clockRegistered, true);
  assert.equal(registered.queuedRunRegistered, true);
  assert.equal(registered.automaticWorkerExecutionEnabled, false);
  assert.equal(registered.registrationId, 'clock_reg_1');
  assert.deepEqual(calls, [{ lockKey: 'scheduled-report-clock', maxRunsPerHour: 2 }]);

  console.log('scheduled-report-clock-registry.test.ts passed');
}
