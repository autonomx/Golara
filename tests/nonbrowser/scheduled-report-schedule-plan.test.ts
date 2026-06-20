import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildScheduledReportSchedulePlanPreview,
  calculateNextScheduledReportRun,
  type AdminAnalyticsScheduledReportSchedulePlanRow
} from '../../lib/analytics/admin-analytics-scheduled-report-schedule-plan';

const PLAN_PATH = new URL('../../lib/analytics/admin-analytics-scheduled-report-schedule-plan.ts', import.meta.url);
const PAGE_PATH = new URL('../../app/admin/analytics/scheduled-reports/page.tsx', import.meta.url);
const LIVE_EXECUTION_PATTERN = /sendMail|createTransport|transport\.(send|deliver)|setInterval|setTimeout|cron|schedule\.create|enqueue/i;

function baseRow(overrides: Partial<AdminAnalyticsScheduledReportSchedulePlanRow> = {}): AdminAnalyticsScheduledReportSchedulePlanRow {
  return {
    id: 'sched_1',
    label: 'Weekly owner report',
    cadence: 'weekly',
    isActive: true,
    ownerApproved: true,
    deliveryEnabled: false,
    hasDryRunEvidence: true,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-02T10:00:00.000Z',
    metadata: {
      activation: {
        activatedAt: '2026-01-03T10:00:00.000Z'
      }
    },
    ...overrides
  };
}

export async function runScheduledReportSchedulePlanTests() {
  const weekly = calculateNextScheduledReportRun({
    cadence: 'weekly',
    anchor: new Date('2026-01-01T10:00:00.000Z'),
    now: new Date('2026-01-10T09:00:00.000Z')
  });
  assert.equal(weekly.toISOString(), '2026-01-15T10:00:00.000Z');

  const monthly = calculateNextScheduledReportRun({
    cadence: 'monthly',
    anchor: new Date('2026-01-31T10:00:00.000Z'),
    now: new Date('2026-02-01T00:00:00.000Z')
  });
  assert.equal(monthly.toISOString(), '2026-02-28T10:00:00.000Z');

  const preview = buildScheduledReportSchedulePlanPreview({
    isOwner: true,
    rows: [baseRow()],
    now: new Date('2026-01-10T09:00:00.000Z')
  });
  assert.equal(preview.status, 'schedule_plan_disabled_preview');
  assert.equal(preview.ownerOnly, true);
  assert.equal(preview.visibleToOwner, true);
  assert.equal(preview.schedulerRuntimeEnabled, false);
  assert.equal(preview.timerRegistrationEnabled, false);
  assert.equal(preview.backgroundJobRegistrationEnabled, false);
  assert.equal(preview.deliveryExecutionEnabled, false);
  assert.equal(preview.deterministicPlanningOnly, true);
  assert.equal(preview.rowsDueNow, 0);
  assert.equal(preview.rowsPlanned, 1);
  assert.equal(preview.items[0]?.nextRunAt, '2026-01-10T10:00:00.000Z');
  assert.equal(preview.items[0]?.deliveryEnabled, false);

  const locked = buildScheduledReportSchedulePlanPreview({
    isOwner: true,
    rows: [baseRow({ isActive: false, ownerApproved: false, hasDryRunEvidence: false, deliveryEnabled: true })],
    now: new Date('2026-01-10T09:00:00.000Z')
  });
  assert.equal(locked.items[0]?.nextRunAt, null);
  assert.ok(locked.items[0]?.blockers.includes('scheduled report is not active'));
  assert.ok(locked.items[0]?.blockers.includes('owner approval evidence not recorded'));
  assert.ok(locked.items[0]?.blockers.includes('dry-run evidence not recorded'));
  assert.ok(locked.items[0]?.blockers.includes('delivery must remain disabled while planning'));

  const staffPreview = buildScheduledReportSchedulePlanPreview({
    isOwner: false,
    rows: [baseRow()],
    now: new Date('2026-01-10T09:00:00.000Z')
  });
  assert.equal(staffPreview.visibleToOwner, false);
  assert.ok(staffPreview.blockers.includes('owner admin role required'));
  assert.ok(staffPreview.items[0]?.blockers.includes('owner admin role required'));
  assert.equal(staffPreview.items[0]?.nextRunAt, null);

  const source = await readFile(PLAN_PATH, 'utf8');
  assert.doesNotMatch(source, LIVE_EXECUTION_PATTERN);
  assert.doesNotMatch(source, /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/);
  assert.doesNotMatch(source, /await import\('@\/lib\/prisma'\)/);
  assert.doesNotMatch(source, /\.findMany\(|\.update\(|\.create\(/);

  const pageSource = await readFile(PAGE_PATH, 'utf8');
  assert.match(pageSource, /buildScheduledReportSchedulePlanPreview/);
  assert.match(pageSource, /Schedule plan/);
  assert.doesNotMatch(pageSource, /\/admin\/analytics\/scheduled-reports\/(delivery|transport|retry|worker)/i);
  assert.doesNotMatch(pageSource, LIVE_EXECUTION_PATTERN);

  console.log('scheduled-report-schedule-plan.test.ts passed');
}
