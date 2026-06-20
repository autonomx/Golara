import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  SCHEDULED_REPORT_RETRY_MAX_ATTEMPTS,
  buildScheduledReportRetryPlan,
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

  const source = await readFile(RETRY_PATH, 'utf8');
  assert.doesNotMatch(source, LIVE_EXECUTION_PATTERN);
  assert.doesNotMatch(source, /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/);
  assert.doesNotMatch(source, /await import\('@\/lib\/prisma'\)/);
  assert.doesNotMatch(source, /\.findMany\(|\.update\(|\.create\(/);

  console.log('scheduled-report-retry-policy.test.ts passed');
}
