import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { resolveAdminAnalyticsRange } from '../../lib/analytics/admin-analytics-range';
import {
  buildScheduledReportDeliveryPayloadPreview,
  isScheduledReportDeliveryPayloadPreviewRuntimeEnabled,
  loadScheduledReportDeliveryPayloadPreviewEndpointPreview
} from '../../lib/analytics/admin-analytics-scheduled-report-delivery-payload';

const PAYLOAD_PREVIEW_ROUTE = new URL(
  '../../app/admin/analytics/scheduled-reports/payload-preview/route.ts',
  import.meta.url
);
const PAYLOAD_PREVIEW_HELPER = new URL(
  '../../lib/analytics/admin-analytics-scheduled-report-delivery-payload.ts',
  import.meta.url
);
const LIVE_EXECUTION_PATTERN = /sendMail|createTransport|transport\.(send|deliver)|setInterval|setTimeout|cron|schedule\.create/i;

const AGGREGATE_CSV = [
  '"report","section","metric","label","value","currency","notes"',
  '"business","summary","total_orders","Total orders","12","",""'
].join('\n');

export async function runScheduledReportDeliveryPayloadTests() {
  assert.equal(isScheduledReportDeliveryPayloadPreviewRuntimeEnabled({}), false);
  assert.equal(
    isScheduledReportDeliveryPayloadPreviewRuntimeEnabled({
      ADMIN_ANALYTICS_SCHEDULED_REPORT_DELIVERY_PAYLOAD_PREVIEW_ENABLED: 'true'
    }),
    true
  );

  const endpointPreview = loadScheduledReportDeliveryPayloadPreviewEndpointPreview({ isOwner: true, env: {} });
  assert.equal(endpointPreview.ownerOnly, true);
  assert.equal(endpointPreview.runtimeEnabled, false);
  assert.equal(endpointPreview.payloadScope, 'aggregate-only');
  assert.equal(endpointPreview.deliveryExecutionEnabled, false);
  assert.equal(endpointPreview.schedulerEnabled, false);
  assert.equal(endpointPreview.backgroundJobEnabled, false);
  assert.equal(endpointPreview.transportExecutionEnabled, false);

  const range = resolveAdminAnalyticsRange(new Date('2026-01-31T00:00:00.000Z'), { range: '7' });
  const preview = buildScheduledReportDeliveryPayloadPreview({
    isOwner: true,
    reportId: 'sched_1',
    cadence: 'weekly',
    range,
    businessCsv: AGGREGATE_CSV,
    siteCsv: AGGREGATE_CSV.replace('business', 'site'),
    generatedAt: new Date('2026-02-01T00:00:00.000Z'),
    env: { ADMIN_ANALYTICS_SCHEDULED_REPORT_DELIVERY_PAYLOAD_PREVIEW_ENABLED: 'true' }
  });
  assert.equal(preview.status, 'delivery_payload_preview_materialized');
  assert.equal(preview.canMaterialize, true);
  assert.equal(preview.aggregateOnly, true);
  assert.equal(preview.perCustomerRowsIncluded, false);
  assert.equal(preview.deliveryExecutionEnabled, false);
  assert.equal(preview.schedulerEnabled, false);
  assert.equal(preview.backgroundJobEnabled, false);
  assert.equal(preview.transportExecutionEnabled, false);
  assert.ok(preview.payload);
  assert.equal(preview.payload?.mode, 'owner-preview-only');
  assert.equal(preview.payload?.payloadScope, 'aggregate-only');
  assert.equal(preview.payload?.perCustomerRowsIncluded, false);
  assert.equal(preview.payload?.deliveryExecutionEnabled, false);
  assert.equal(preview.payload?.assets.length, 2);
  assert.equal(preview.payload?.assets[0]?.report, 'business');
  assert.equal(preview.payload?.assets[0]?.filename, 'golara-analytics-business-7d.csv');
  assert.equal(preview.payload?.assets[0]?.exportPath, '/admin/analytics/export?range=7&report=business');
  assert.equal(preview.payload?.assets[0]?.aggregateOnly, true);
  assert.equal(preview.payload?.assets[1]?.report, 'site');
  assert.equal(preview.payload?.assets[1]?.exportPath, '/admin/analytics/export?range=7&report=site');
  assert.equal(preview.payload?.assets[1]?.aggregateOnly, true);

  const blocked = buildScheduledReportDeliveryPayloadPreview({
    isOwner: false,
    range,
    businessCsv: AGGREGATE_CSV,
    siteCsv: AGGREGATE_CSV,
    env: { ADMIN_ANALYTICS_SCHEDULED_REPORT_DELIVERY_PAYLOAD_PREVIEW_ENABLED: 'true' }
  });
  assert.equal(blocked.canMaterialize, false);
  assert.equal(blocked.payload, null);
  assert.ok(blocked.blockers.includes('owner admin role required'));
  assert.ok(blocked.blockers.includes('scheduled-report id required'));

  const piiBlocked = buildScheduledReportDeliveryPayloadPreview({
    isOwner: true,
    reportId: 'sched_1',
    range,
    businessCsv: '"report","section","metric","label","value","currency","notes"\n"business","row","customer_email","jane@example.com","1","",""',
    siteCsv: AGGREGATE_CSV,
    env: { ADMIN_ANALYTICS_SCHEDULED_REPORT_DELIVERY_PAYLOAD_PREVIEW_ENABLED: 'true' }
  });
  assert.equal(piiBlocked.canMaterialize, false);
  assert.equal(piiBlocked.payload, null);
  assert.ok(piiBlocked.blockers.some((blocker) => blocker.includes('forbidden per-customer field')));

  const routeSource = await readFile(PAYLOAD_PREVIEW_ROUTE, 'utf8');
  assert.match(routeSource, /export async function POST/);
  assert.match(routeSource, /assertAdminRole\('owner'\)/);
  assert.match(routeSource, /isScheduledReportDeliveryPayloadPreviewRuntimeEnabled/);
  assert.match(routeSource, /buildBusinessAnalyticsCsv/);
  assert.match(routeSource, /buildSiteAnalyticsCsv/);
  assert.doesNotMatch(routeSource, /recordScheduledReportEndpointRequest/);
  assert.doesNotMatch(routeSource, /await import\('@\/lib\/prisma'\)|PrismaClient|\.update\(|\.findMany\(/);
  assert.doesNotMatch(routeSource, /export\s+async\s+function\s+(GET|PUT|PATCH|DELETE)/);
  assert.doesNotMatch(routeSource, LIVE_EXECUTION_PATTERN);
  assert.doesNotMatch(routeSource, /deliveryExecutionEnabled:\s*true|schedulerEnabled:\s*true|backgroundJobEnabled:\s*true/i);

  const helperSource = await readFile(PAYLOAD_PREVIEW_HELPER, 'utf8');
  assert.doesNotMatch(helperSource, /PrismaClient|\.update\(|\.findMany\(|await import\('@\/lib\/prisma'\)/);
  assert.doesNotMatch(helperSource, LIVE_EXECUTION_PATTERN);
  assert.match(helperSource, /perCustomerRowsIncluded:\s*false/);
  assert.match(helperSource, /aggregateOnly:\s*true/);
  assert.match(helperSource, /payloadScope:\s*'aggregate-only'/);

  console.log('scheduled-report-delivery-payload.test.ts passed');
}
