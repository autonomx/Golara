import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { resolveAdminAnalyticsRange } from '../../lib/analytics/admin-analytics-range';
import {
  adminAnalyticsScheduledReportExportPath,
  buildAdminAnalyticsScheduledReportPreview
} from '../../lib/analytics/admin-analytics-scheduled-reports';

export async function runAdminAnalyticsScheduledReportsTests() {
  const now = new Date(Date.UTC(2026, 5, 19, 12));
  const range = resolveAdminAnalyticsRange(now, {
    start: '2026-06-01',
    end: '2026-06-15'
  });
  const preview = buildAdminAnalyticsScheduledReportPreview(range);

  assert.equal(preview.status, 'preview_only');
  assert.equal(preview.enabled, false);
  assert.equal(preview.ownerOnly, true);
  assert.equal(preview.deliveryEnabled, false);
  assert.equal(preview.persistenceEnabled, false);
  assert.equal(preview.rangeMode, 'custom');
  assert.equal(preview.rangeLabel, '2026-06-01 to 2026-06-15');
  assert.equal(preview.rangeQuery, 'start=2026-06-01&end=2026-06-15');
  assert.equal(preview.businessCsvPath, '/admin/analytics/export?start=2026-06-01&end=2026-06-15&report=business');
  assert.equal(preview.siteCsvPath, '/admin/analytics/export?start=2026-06-01&end=2026-06-15&report=site');
  assert.equal(preview.plans.length, 2);
  assert.deepEqual(preview.plans.map((plan) => plan.cadence), ['weekly', 'monthly']);
  assert.ok(preview.plans.every((plan) => plan.deliveryEnabled === false));
  assert.ok(preview.plans.every((plan) => plan.persistenceEnabled === false));
  assert.ok(preview.plans.every((plan) => plan.reports.includes('business') && plan.reports.includes('site')));
  assert.ok(preview.blockers.includes('schedule persistence not configured'));
  assert.ok(preview.blockers.includes('delivery channel not configured'));
  assert.ok(preview.blockers.includes('owner confirmation not recorded'));

  assert.equal(
    adminAnalyticsScheduledReportExportPath('business', range),
    preview.businessCsvPath
  );

  const helperSource = readFileSync('lib/analytics/admin-analytics-scheduled-reports.ts', 'utf8');
  assert.match(helperSource, /preview_only/);
  assert.match(helperSource, /deliveryEnabled: false/);
  assert.match(helperSource, /persistenceEnabled: false/);
  assert.match(helperSource, /adminAnalyticsRangeQueryString/);
  assert.doesNotMatch(helperSource, /sendMail|transport|cron|schedule\.create|setInterval|setTimeout/);

  console.log('admin-analytics-scheduled-reports.test.ts passed');
}
