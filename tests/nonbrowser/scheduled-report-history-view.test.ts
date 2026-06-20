import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildScheduledReportHistoryView,
  type AdminAnalyticsScheduledReportHistoryRecord
} from '../../lib/analytics/admin-analytics-scheduled-report-history-view';

const HISTORY_PATH = new URL('../../lib/analytics/admin-analytics-scheduled-report-history-view.ts', import.meta.url);

const RECORDS: AdminAnalyticsScheduledReportHistoryRecord[] = [
  {
    id: 'hist_1',
    reportId: 'sched_1',
    reportLabel: 'Weekly owner report',
    attemptedAt: '2026-01-05T10:00:00.000Z',
    status: 'failed',
    mode: 'owner_run',
    assetCount: 2,
    recipientCount: 1,
    blockers: ['channel unavailable']
  },
  {
    id: 'hist_2',
    reportId: 'sched_1',
    reportLabel: 'Weekly owner report',
    attemptedAt: '2026-01-06T10:00:00.000Z',
    status: 'completed',
    mode: 'owner_run',
    assetCount: 2,
    recipientCount: 1,
    blockers: []
  },
  {
    id: 'hist_3',
    reportId: 'sched_2',
    reportLabel: 'Monthly owner report',
    attemptedAt: '2026-01-04T10:00:00.000Z',
    status: 'blocked',
    mode: 'preview',
    assetCount: 0,
    recipientCount: 0,
    blockers: ['owner approval is required']
  }
];

export async function runScheduledReportHistoryViewTests() {
  const staff = buildScheduledReportHistoryView({ isOwner: false, records: RECORDS });
  assert.equal(staff.ownerOnly, true);
  assert.equal(staff.readonly, true);
  assert.equal(staff.repositoryWritesEnabled, false);
  assert.equal(staff.liveActionEnabled, false);
  assert.equal(staff.totalRecords, 0);
  assert.deepEqual(staff.records, []);

  const owner = buildScheduledReportHistoryView({ isOwner: true, records: RECORDS });
  assert.equal(owner.totalRecords, 3);
  assert.equal(owner.completedCount, 1);
  assert.equal(owner.failedCount, 1);
  assert.equal(owner.blockedCount, 1);
  assert.equal(owner.latestAttemptAt, '2026-01-06T10:00:00.000Z');
  assert.deepEqual(owner.records.map((record) => record.id), ['hist_2', 'hist_1', 'hist_3']);
  assert.equal(owner.repositoryWritesEnabled, false);
  assert.equal(owner.liveActionEnabled, false);

  const source = await readFile(HISTORY_PATH, 'utf8');
  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /setInterval|setTimeout|cron/i);
  assert.doesNotMatch(source, /fetch\(|sendMail|createTransport|nodemailer|smtp/i);
  assert.doesNotMatch(source, /await import\('@\/lib\/prisma'\)/);
  assert.doesNotMatch(source, /\.findMany\(|\.update\(|\.create\(/);

  console.log('scheduled-report-history-view.test.ts passed');
}
