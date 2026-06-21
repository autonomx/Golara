import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  ADMIN_ANALYTICS_SCHEDULED_REPORT_WORKER_EXECUTION_ENABLED_ENV,
  SCHEDULED_REPORT_WORKER_MAX_BATCH_SIZE,
  createDisabledScheduledReportWorkerShell,
  evaluateScheduledReportWorkerShell,
  executeScheduledReportWorkerBatch,
  type AdminAnalyticsScheduledReportWorkerCandidate,
  type AdminAnalyticsScheduledReportWorkerGateState
} from '../../lib/analytics/admin-analytics-scheduled-report-worker-shell';

const WORKER_PATH = new URL('../../lib/analytics/admin-analytics-scheduled-report-worker-shell.ts', import.meta.url);
const LIVE_PATTERNS = ['send' + 'Mail', 'create' + 'Transport', 'transport\\.(send|deliver)', 'setInterval', 'setTimeout', 'cron', 'schedule\\.create', 'enqueue'];
const LIVE_EXECUTION_PATTERN = new RegExp(LIVE_PATTERNS.join('|'), 'i');

function activeState(): AdminAnalyticsScheduledReportWorkerGateState {
  return {
    workerRuntimeEnabled: true,
    schedulerRuntimeEnabled: true,
    timerRegistrationEnabled: true,
    backgroundJobRegistrationEnabled: true,
    deliveryExecutionEnabled: false,
    deliveryTransportConfigured: false,
    ownerApprovalRequired: true,
    dryRunEvidenceRequired: true
  };
}

function candidate(overrides: Partial<AdminAnalyticsScheduledReportWorkerCandidate> = {}): AdminAnalyticsScheduledReportWorkerCandidate {
  return {
    id: 'sched_1',
    label: 'Weekly owner report',
    cadence: 'weekly',
    isActive: true,
    ownerApproved: true,
    deliveryEnabled: false,
    hasDryRunEvidence: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    nextRunAt: '2026-01-03T00:00:00.000Z',
    ...overrides
  };
}

export async function runScheduledReportWorkerShellTests() {
  assert.equal(SCHEDULED_REPORT_WORKER_MAX_BATCH_SIZE, 5);

  const disabledShell = createDisabledScheduledReportWorkerShell();
  assert.equal(disabledShell.enabled, false);
  const disabled = disabledShell.evaluate({
    candidates: [candidate()],
    now: new Date('2026-01-04T00:00:00.000Z')
  });
  assert.equal(disabled.status, 'worker_shell_disabled');
  assert.equal(disabled.workerRuntimeEnabled, false);
  assert.equal(disabled.schedulerRuntimeEnabled, false);
  assert.equal(disabled.timerRegistrationEnabled, false);
  assert.equal(disabled.backgroundJobRegistrationEnabled, false);
  assert.equal(disabled.deliveryExecutionEnabled, false);
  assert.equal(disabled.deliveryTransportConfigured, false);
  assert.equal(disabled.automaticRegistrationEnabled, false);
  assert.equal(disabled.dueCount, 0);
  assert.equal(disabled.decisions[0]?.status, 'locked');
  assert.ok(disabled.blockers.includes('worker runtime flag is disabled'));

  const gated = evaluateScheduledReportWorkerShell({
    candidates: [candidate()],
    state: activeState(),
    now: new Date('2026-01-04T00:00:00.000Z')
  });
  assert.equal(gated.status, 'worker_shell_gated_preview');
  assert.equal(gated.automaticRegistrationEnabled, false);
  assert.equal(gated.deliveryExecutionEnabled, false);
  assert.equal(gated.dueCount, 1);
  assert.equal(gated.decisions[0]?.status, 'due_for_manual_processing');

  const blockedDelivery = evaluateScheduledReportWorkerShell({
    candidates: [candidate({ deliveryEnabled: true })],
    state: activeState(),
    now: new Date('2026-01-04T00:00:00.000Z')
  });
  assert.equal(blockedDelivery.dueCount, 0);
  assert.equal(blockedDelivery.decisions[0]?.status, 'locked');
  assert.ok(blockedDelivery.decisions[0]?.blockers.includes('delivery must remain disabled before worker processing'));

  const blockedTransport = evaluateScheduledReportWorkerShell({
    candidates: [candidate()],
    state: { ...activeState(), deliveryTransportConfigured: true },
    now: new Date('2026-01-04T00:00:00.000Z')
  });
  assert.equal(blockedTransport.dueCount, 0);
  assert.ok(blockedTransport.blockers.includes('delivery transport must remain unconfigured in the worker shell'));

  const blockedExecution = await executeScheduledReportWorkerBatch({ shell: gated });
  assert.equal(blockedExecution.status, 'worker_execution_blocked');
  assert.equal(blockedExecution.automaticWorkerExecutionEnabled, false);
  assert.equal(blockedExecution.backgroundLoopStarted, false);
  assert.equal(blockedExecution.timerCreated, false);
  assert.equal(blockedExecution.attemptedCount, 0);
  assert.ok(blockedExecution.blockers.includes('automatic worker execution flag is disabled'));
  assert.ok(blockedExecution.blockers.includes('worker runner is not configured'));

  const calls: string[] = [];
  const completedExecution = await executeScheduledReportWorkerBatch({
    shell: evaluateScheduledReportWorkerShell({
      candidates: [candidate({ id: 'sched_1' }), candidate({ id: 'sched_2' })],
      state: activeState(),
      now: new Date('2026-01-04T00:00:00.000Z')
    }),
    automaticWorkerExecutionEnabled: true,
    runner: async (decision) => {
      calls.push(decision.id);
      return decision.id === 'sched_1'
        ? { status: 'completed', providerMessageId: 'msg_worker_1' }
        : { status: 'failed', reason: 'provider rejected worker send' };
    }
  });
  assert.equal(completedExecution.status, 'worker_execution_completed');
  assert.equal(completedExecution.automaticWorkerExecutionEnabled, true);
  assert.equal(completedExecution.backgroundLoopStarted, false);
  assert.equal(completedExecution.timerCreated, false);
  assert.equal(completedExecution.attemptedCount, 2);
  assert.equal(completedExecution.completedCount, 1);
  assert.equal(completedExecution.failedCount, 1);
  assert.deepEqual(calls, ['sched_1', 'sched_2']);
  assert.equal(completedExecution.items[0]?.status, 'worker_completed');
  assert.equal(completedExecution.items[0]?.providerMessageId, 'msg_worker_1');
  assert.equal(completedExecution.items[1]?.status, 'worker_failed');
  assert.equal(completedExecution.items[1]?.reason, 'provider rejected worker send');

  const cappedExecution = await executeScheduledReportWorkerBatch({
    shell: evaluateScheduledReportWorkerShell({
      candidates: [candidate({ id: 'sched_1' }), candidate({ id: 'sched_2' }), candidate({ id: 'sched_3' })],
      state: activeState(),
      now: new Date('2026-01-04T00:00:00.000Z')
    }),
    automaticWorkerExecutionEnabled: true,
    maxBatchSize: 2,
    runner: async (decision) => ({ status: 'completed', providerMessageId: `msg_${decision.id}` })
  });
  assert.equal(cappedExecution.maxBatchSize, 2);
  assert.equal(cappedExecution.attemptedCount, 2);
  assert.equal(cappedExecution.items.filter((item) => item.attempted).length, 2);

  const source = await readFile(WORKER_PATH, 'utf8');
  assert.match(source, /ADMIN_ANALYTICS_SCHEDULED_REPORT_WORKER_EXECUTION_ENABLED/);
  assert.doesNotMatch(source, LIVE_EXECUTION_PATTERN);
  assert.doesNotMatch(source, /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/);
  assert.doesNotMatch(source, /await import\('@\/lib\/prisma'\)/);
  assert.doesNotMatch(source, /\.findMany\(|\.update\(|\.create\(/);

  console.log('scheduled-report-worker-shell.test.ts passed');
}
