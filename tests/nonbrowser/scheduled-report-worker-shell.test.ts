import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  createDisabledScheduledReportWorkerShell,
  evaluateScheduledReportWorkerShell,
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

  const source = await readFile(WORKER_PATH, 'utf8');
  assert.doesNotMatch(source, LIVE_EXECUTION_PATTERN);
  assert.doesNotMatch(source, /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/);
  assert.doesNotMatch(source, /await import\('@\/lib\/prisma'\)/);
  assert.doesNotMatch(source, /\.findMany\(|\.update\(|\.create\(/);

  console.log('scheduled-report-worker-shell.test.ts passed');
}
