import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildScheduledReportReadEndpointRuntimeState,
  isScheduledReportReadEndpointRuntimeEnabled,
  loadScheduledReportReadEndpointPreview,
  shouldAttachScheduledReportReadDelegate,
  type AdminAnalyticsScheduledReportReadEndpointEnv
} from '../../lib/analytics/admin-analytics-scheduled-report-read-endpoint';
import type {
  AdminAnalyticsScheduledReportGeneratedClientReadDelegate,
  AdminAnalyticsScheduledReportRepositoryReadArgs
} from '../../lib/analytics/admin-analytics-scheduled-report-repository';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function enabledEnv(): AdminAnalyticsScheduledReportReadEndpointEnv {
  return {
    ADMIN_ANALYTICS_SCHEDULED_REPORT_READ_ENDPOINT_ENABLED: 'true',
    ADMIN_ANALYTICS_SCHEDULED_REPORT_READER_FACTORY_RUNTIME_ENABLED: 'true',
    ADMIN_ANALYTICS_SCHEDULED_REPORT_GENERATED_CLIENT_RUNTIME_ACCESS_ENABLED: 'true',
    ADMIN_ANALYTICS_SCHEDULED_REPORT_REPOSITORY_READS_ENABLED: 'true',
    ADMIN_ANALYTICS_SCHEDULED_REPORT_GLOBAL_KILL_SWITCH_VALIDATED: 'true',
    ADMIN_ANALYTICS_SCHEDULED_REPORT_OWNER_APPROVAL_POLICY_VALIDATED: 'true',
    ADMIN_ANALYTICS_SCHEDULED_REPORT_DRY_RUN_EVIDENCE_VALIDATED: 'true'
  };
}

function validRow() {
  return {
    id: 'report_1',
    reportKey: 'weekly-owner-analytics-config',
    label: 'Weekly owner analytics configuration',
    description: 'Owner report schedule',
    cadence: 'weekly',
    rangeMode: 'custom',
    rangeQuery: 'start=2026-06-01&end=2026-06-15',
    reportTypes: ['business', 'site'],
    ownerApproved: true,
    isActive: true,
    deliveryEnabled: false,
    lastDryRunSummary: { checkedAt: '2026-06-15T00:00:00.000Z' },
    createdAt: new Date('2026-06-15T00:00:00.000Z'),
    updatedAt: new Date('2026-06-15T00:00:00.000Z')
  };
}

export async function runScheduledReportReadEndpointTests() {
  const disabled = await loadScheduledReportReadEndpointPreview({ isOwner: true, env: {} });
  assert.equal(disabled.status, 'read_endpoint_owner_only_runtime_gated');
  assert.equal(disabled.routePath, '/admin/analytics/scheduled-reports/read');
  assert.equal(disabled.pagePath, '/admin/analytics/scheduled-reports');
  assert.equal(disabled.ownerOnly, true);
  assert.equal(disabled.ownerAuthorized, true);
  assert.equal(disabled.readEndpointAvailable, true);
  assert.equal(disabled.readEndpointRuntimeEnabled, false);
  assert.equal(disabled.preview.repositoryReadsEnabled, false);
  assert.equal(disabled.preview.deliveryExecutionEnabled, false);
  assert.equal(disabled.rows.length, 0);
  assert.ok(disabled.blockers.includes('reader factory runtime disabled'));

  const staff = await loadScheduledReportReadEndpointPreview({ isOwner: false, env: enabledEnv() });
  assert.equal(staff.ownerAuthorized, false);
  assert.equal(staff.rows.length, 0);
  assert.ok(staff.blockers.includes('owner admin role required'));

  const state = buildScheduledReportReadEndpointRuntimeState(enabledEnv());
  assert.equal(state.readerFactoryRuntimeEnabled, true);
  assert.equal(state.generatedClientRuntimeAccessEnabled, true);
  assert.equal(state.repositoryReadsEnabled, true);
  assert.equal(state.repositoryWritesEnabled, false);
  assert.equal(state.deliveryExecutionEnabled, false);
  assert.equal(state.schedulerEnabled, false);
  assert.equal(isScheduledReportReadEndpointRuntimeEnabled(enabledEnv()), true);
  assert.equal(shouldAttachScheduledReportReadDelegate(enabledEnv()), true);
  assert.equal(shouldAttachScheduledReportReadDelegate({}), false);

  const delegate: AdminAnalyticsScheduledReportGeneratedClientReadDelegate = {
    findMany: async (args: AdminAnalyticsScheduledReportRepositoryReadArgs) => {
      assert.deepEqual(args.where, { ownerApproved: true, isActive: true, deliveryEnabled: false });
      assert.deepEqual(args.orderBy, [{ cadence: 'asc' }, { reportKey: 'asc' }]);
      assert.ok(args.take <= 25);
      return [validRow()];
    }
  };

  const enabled = await loadScheduledReportReadEndpointPreview({ isOwner: true, env: enabledEnv(), delegate });
  assert.equal(enabled.preview.repositoryReadsEnabled, true);
  assert.equal(enabled.preview.deliveryExecutionEnabled, false);
  assert.equal(enabled.rows.length, 1);
  assert.equal(enabled.rows[0]?.activeForOperators, false);
  assert.equal(enabled.rows[0]?.deliveryReady, false);
  assert.equal(enabled.rows[0]?.deliveryEnabled, false);

  const routeSource = source('app/admin/analytics/scheduled-reports/read/route.ts');
  assert.match(routeSource, /export async function GET/);
  assert.match(routeSource, /assertAdminRole\('owner'\)/);
  assert.match(routeSource, /NextResponse\.json/);
  assert.match(routeSource, /shouldAttachScheduledReportReadDelegate/);
  assert.match(routeSource, /await import\('@\/lib\/prisma'\)/);
  assert.doesNotMatch(routeSource, /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)/);
  assert.doesNotMatch(routeSource, /\.create\(|\.update\(|\.upsert\(|\.delete\(|sendMail|transport|setInterval|setTimeout|cron|schedule\.create/i);

  const pageSource = source('app/admin/analytics/scheduled-reports/page.tsx');
  assert.match(pageSource, /loadScheduledReportReadEndpointPreview/);
  assert.match(pageSource, /Rows appear here only when/);
  assert.doesNotMatch(pageSource, /<form\b/i);
  assert.doesNotMatch(pageSource, /\baction=/i);
  assert.doesNotMatch(pageSource, /\bmethod=/i);
  assert.doesNotMatch(pageSource, /\.create\(|\.update\(|\.upsert\(|\.delete\(|sendMail|transport|setInterval|setTimeout|cron|schedule\.create/i);

  console.log('scheduled-report-read-endpoint.test.ts passed');
}
