import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  SCHEDULED_REPORT_RETRY_MAX_ATTEMPTS,
  SCHEDULED_REPORT_RETRY_MAX_BATCH_SIZE,
  buildScheduledReportRetryPlan,
  executeScheduledReportRetryBatch,
  type AdminAnalyticsScheduledReportFailureRecordForRetry
} from '../../lib/analytics/admin-analytics-scheduled-report-retry-policy';

const RETRY_PATH = new URL('../../lib/analytics/admin-analytics-scheduled-report-retry-policy.ts', import.meta.url);
const LIVE_PATTERNS = ['send' + 'Mail', 'create' + 'Transport', 'nodemailer', 'smtp', 'fetch\\(', 'setInterval', 'setTimeout', 'cron', 'while\\s*\\('];
const LIVE_EXECUTION_PATTERN = new RegExp(LIVE_PATTERNS.join('|'), 'i');

function record(overrides: Partial<AdminAnalyticsScheduledReportFailureRecordForRetry> = {}): AdminAnalyticsScheduledReportFailureRecordForRetry {
  return {
    reportId: 'sched_1',
    label: 'Weekly owner report',
    status: 'failed',
    failedAt: '2026-01-04T00:00:00.000Z',
    attemptCount: 1,
    lastReason: 'transport disabled',
    ...overrides
  };
}

export async function runScheduledReportRetryPolicyTests() {
  assert.equal(SCHEDULED_REPORT_RETRY_MAX_ATTEMPTS, 3);
  assert.equal(SCHEDULED_REPORT_RETRY_MAX_BATCH_SIZE, 5);

  const eligible = buildScheduledReportRetryPlan({
    failures: [record()],
    now: new Date('2026-01-04T01:00:00.000Z')
  });
  assert.equal(eligible.status, 'retry_plan_only');
  assert.equal(eligible.ownerOnly, true);
  assert.equal(eligible.retryExecutionEnabled, false);
  assert.equal(eligible.automaticLoopEnabled, false);
  assert.equal(eligible.eligibleCount, 1);
  assert.equal(eligible.items[0]?.status, 'retry_eligible');
  assert.equal(eligible.items[0]?.nextRetryAt, '2026-01-04T01:00:00.000Z');
  assert.equal(eligible.items[0]?.ownerVisible, true);

  const capped = buildScheduledReportRetryPlan({ failures: [record({ attemptCount: 3 })] });
  assert.equal(capped.eligibleCount, 0);
  assert.equal(capped.items[0]?.status, 'retry_locked');
  assert.ok(capped.items[0]?.blockers.includes('retry attempt cap reached'));

  const notFailed = buildScheduledReportRetryPlan({ failures: [record({ status: 'delivered' })] });
  assert.equal(notFailed.items[0]?.status, 'not_failed');
  assert.equal(notFailed.items[0]?.nextRetryAt, null);
  assert.ok(notFailed.items[0]?.blockers.includes('delivery record is not failed'));

  const missingReason = buildScheduledReportRetryPlan({ failures: [record({ lastReason: '' })] });
  assert.equal(missingReason.items[0]?.status, 'retry_locked');
  assert.ok(missingReason.items[0]?.blockers.includes('failure reason is required before retry planning'));

  const blockedExecution = await executeScheduledReportRetryBatch({ plan: eligible });
  assert.equal(blockedExecution.status, 'retry_execution_blocked');
  assert.equal(blockedExecution.retryExecutionEnabled, false);
  assert.equal(blockedExecution.automaticLoopEnabled, false);
  assert.equal(blockedExecution.attemptedCount, 0);
  assert.ok(blockedExecution.blockers.includes('retry execution flag is disabled'));
  assert.ok(blockedExecution.blockers.includes('retry runner is not configured'));
  assert.equal(blockedExecution.items[0]?.attempted, false);

  const calls: string[] = [];
  const completedExecution = await executeScheduledReportRetryBatch({
    plan: buildScheduledReportRetryPlan({
      failures: [record({ reportId: 'sched_1' }), record({ reportId: 'sched_2', attemptCount: 2 })]
    }),
    retryExecutionEnabled: true,
    runner: async (item) => {
      calls.push(item.reportId);
      return item.reportId === 'sched_1'
        ? { status: 'delivered', providerMessageId: 'msg_retry_1' }
        : { status: 'failed', reason: 'provider rejected retry' };
    }
  });
  assert.equal(completedExecution.status, 'retry_execution_completed');
  assert.equal(completedExecution.retryExecutionEnabled, true);
  assert.equal(completedExecution.automaticLoopEnabled, false);
  assert.equal(completedExecution.attemptedCount, 2);
  assert.equal(completedExecution.deliveredCount, 1);
  assert.equal(completedExecution.failedCount, 1);
  assert.deepEqual(calls, ['sched_1', 'sched_2']);
  assert.equal(completedExecution.items[0]?.status, 'retry_delivered');
  assert.equal(completedExecution.items[0]?.providerMessageId, 'msg_retry_1');
  assert.equal(completedExecution.items[1]?.status, 'retry_failed');
  assert.equal(completedExecution.items[1]?.reason, 'provider rejected retry');

  const cappedBatch = await executeScheduledReportRetryBatch({
    plan: buildScheduledReportRetryPlan({
      failures: [
        record({ reportId: 'sched_1' }),
        record({ reportId: 'sched_2' }),
        record({ reportId: 'sched_3' })
      ]
    }),
    retryExecutionEnabled: true,
    maxBatchSize: 2,
    runner: async (item) => ({ status: 'delivered', providerMessageId: `msg_${item.reportId}` })
  });
  assert.equal(cappedBatch.maxBatchSize, 2);
  assert.equal(cappedBatch.attemptedCount, 2);
  assert.equal(cappedBatch.items.filter((item) => item.attempted).length, 2);

  const source = await readFile(RETRY_PATH, 'utf8');
  assert.match(source, /ADMIN_ANALYTICS_SCHEDULED_REPORT_RETRY_EXECUTION_ENABLED/);
  assert.doesNotMatch(source, LIVE_EXECUTION_PATTERN);
  assert.doesNotMatch(source, /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/);
  assert.doesNotMatch(source, /await import\('@\/lib\/prisma'\)/);
  assert.doesNotMatch(source, /\.findMany\(|\.update\(|\.create\(/);

  console.log('scheduled-report-retry-policy.test.ts passed');
}
