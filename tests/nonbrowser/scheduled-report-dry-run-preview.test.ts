import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { resolveAdminAnalyticsRange } from '../../lib/analytics/admin-analytics-range';
import {
  buildScheduledReportDryRunPreview,
  isScheduledReportDryRunPreviewRuntimeEnabled,
  loadScheduledReportDryRunPreviewEndpointPreview,
  validateScheduledReportDryRunPreviewAggregateOnly
} from '../../lib/analytics/admin-analytics-scheduled-report-dry-run-preview';

const DRY_RUN_PREVIEW_ROUTE = new URL(
  '../../app/admin/analytics/scheduled-reports/dry-run-preview/route.ts',
  import.meta.url
);
const DRY_RUN_PREVIEW_HELPER = new URL(
  '../../lib/analytics/admin-analytics-scheduled-report-dry-run-preview.ts',
  import.meta.url
);
const EXPORT_ROUTE = new URL('../../app/admin/analytics/export/route.ts', import.meta.url);
const EXPORT_CSV_HELPER = new URL('../../lib/analytics/admin-analytics-export-csv.ts', import.meta.url);
const LIVE_EXECUTION_PATTERN = /sendMail|createTransport|transport\.(send|deliver)|setInterval|setTimeout|cron|schedule\.create/i;

const AGGREGATE_CSV = [
  '"report","section","metric","label","value","currency","notes"',
  '"business","summary","total_orders","Total orders","12","",""'
].join('\n');

export async function runScheduledReportDryRunPreviewTests() {
  assert.equal(isScheduledReportDryRunPreviewRuntimeEnabled({}), false);
  assert.equal(
    isScheduledReportDryRunPreviewRuntimeEnabled({ ADMIN_ANALYTICS_SCHEDULED_REPORT_DRY_RUN_PREVIEW_ENABLED: 'true' }),
    true
  );

  const endpointPreview = loadScheduledReportDryRunPreviewEndpointPreview({ isOwner: true, env: {} });
  assert.equal(endpointPreview.ownerOnly, true);
  assert.equal(endpointPreview.runtimeEnabled, false);
  assert.equal(endpointPreview.deliveryExecutionEnabled, false);
  assert.equal(endpointPreview.schedulerEnabled, false);
  assert.equal(endpointPreview.transportExecutionEnabled, false);

  const range = resolveAdminAnalyticsRange(new Date('2026-01-31T00:00:00.000Z'), { range: '7' });
  const preview = buildScheduledReportDryRunPreview({
    isOwner: true,
    reportId: 'sched_1',
    cadence: 'weekly',
    range,
    businessCsv: AGGREGATE_CSV,
    siteCsv: AGGREGATE_CSV.replace('business', 'site'),
    generatedAt: new Date('2026-02-01T00:00:00.000Z'),
    env: { ADMIN_ANALYTICS_SCHEDULED_REPORT_DRY_RUN_PREVIEW_ENABLED: 'true' }
  });
  assert.equal(preview.status, 'dry_run_preview_generated');
  assert.equal(preview.canRecord, true);
  assert.equal(preview.aggregateOnly, true);
  assert.equal(preview.perCustomerRowsIncluded, false);
  assert.deepEqual(preview.reportTypes, ['business', 'site']);
  assert.equal(preview.deliveryExecutionEnabled, false);
  assert.equal(preview.schedulerEnabled, false);
  assert.equal(preview.backgroundJobEnabled, false);
  assert.equal(preview.transportExecutionEnabled, false);
  assert.equal(preview.businessCsv.aggregateOnly, true);
  assert.equal(preview.siteCsv.aggregateOnly, true);
  assert.equal(preview.evidence.payloadScope, 'aggregate-only');
  assert.equal(preview.evidence.businessCsvPath, '/admin/analytics/export?range=7&report=business');
  assert.equal(preview.evidence.siteCsvPath, '/admin/analytics/export?range=7&report=site');

  const blocked = buildScheduledReportDryRunPreview({
    isOwner: false,
    range,
    businessCsv: AGGREGATE_CSV,
    siteCsv: AGGREGATE_CSV,
    env: { ADMIN_ANALYTICS_SCHEDULED_REPORT_DRY_RUN_PREVIEW_ENABLED: 'true' }
  });
  assert.equal(blocked.canRecord, false);
  assert.ok(blocked.blockers.includes('owner admin role required'));
  assert.ok(blocked.blockers.includes('scheduled-report id required'));

  const piiValidation = validateScheduledReportDryRunPreviewAggregateOnly(
    '"report","section","metric","label","value","currency","notes"\n"business","row","customer_email","jane@example.com","1","",""',
    'business'
  );
  assert.equal(piiValidation.aggregateOnly, false);
  assert.ok(piiValidation.blockers.some((blocker) => blocker.includes('forbidden per-customer field')));

  const routeSource = await readFile(DRY_RUN_PREVIEW_ROUTE, 'utf8');
  assert.match(routeSource, /export async function POST/);
  assert.match(routeSource, /assertAdminRole\('owner'\)/);
  assert.match(routeSource, /isScheduledReportDryRunPreviewRuntimeEnabled/);
  assert.match(routeSource, /buildBusinessAnalyticsCsv/);
  assert.match(routeSource, /buildSiteAnalyticsCsv/);
  assert.match(routeSource, /recordScheduledReportEndpointRequest/);
  assert.match(routeSource, /target: 'dry-run-evidence'/);
  assert.match(routeSource, /shouldAttachScheduledReportRecordingDelegate/);
  assert.match(routeSource, /await import\('@\/lib\/prisma'\)/);
  assert.doesNotMatch(routeSource, /export\s+async\s+function\s+(GET|PUT|PATCH|DELETE)/);
  assert.doesNotMatch(routeSource, LIVE_EXECUTION_PATTERN);
  assert.doesNotMatch(routeSource, /deliveryExecutionEnabled:\s*true|schedulerEnabled:\s*true|backgroundJobEnabled:\s*true/i);

  const helperSource = await readFile(DRY_RUN_PREVIEW_HELPER, 'utf8');
  assert.doesNotMatch(helperSource, /PrismaClient|\.update\(|\.findMany\(|await import\('@\/lib\/prisma'\)/);
  assert.doesNotMatch(helperSource, LIVE_EXECUTION_PATTERN);
  assert.match(helperSource, /perCustomerRowsIncluded:\s*false/);
  assert.match(helperSource, /aggregateOnly:\s*true/);

  const exportRouteSource = await readFile(EXPORT_ROUTE, 'utf8');
  assert.match(exportRouteSource, /buildBusinessAnalyticsCsv/);
  assert.match(exportRouteSource, /buildSiteAnalyticsCsv/);
  assert.doesNotMatch(exportRouteSource, /function buildBusinessAnalyticsCsv/);
  assert.doesNotMatch(exportRouteSource, /function buildSiteAnalyticsCsv/);

  const csvHelperSource = await readFile(EXPORT_CSV_HELPER, 'utf8');
  assert.match(csvHelperSource, /export function buildBusinessAnalyticsCsv/);
  assert.match(csvHelperSource, /export function buildSiteAnalyticsCsv/);
  assert.doesNotMatch(csvHelperSource, LIVE_EXECUTION_PATTERN);

  console.log('scheduled-report-dry-run-preview.test.ts passed');
}
