import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  ADMIN_ANALYTICS_SCHEDULED_REPORT_MANAGEMENT_APPROVED_POST_ENDPOINTS,
  buildAdminAnalyticsScheduledReportManagementSurfaceContract,
  buildScheduledReportManagementSurfaceContract
} from '../../lib/analytics/admin-analytics-scheduled-report-management-surface';
import {
  buildScheduledReportRecordingEndpointGateState,
  loadScheduledReportRecordingEndpointPreview,
  recordScheduledReportEndpointRequest,
  shouldAttachScheduledReportRecordingDelegate,
  type AdminAnalyticsScheduledReportRecordingEndpointEnv
} from '../../lib/analytics/admin-analytics-scheduled-report-recording-endpoint';
import type { AdminAnalyticsScheduledReportRecordingDelegate } from '../../lib/analytics/admin-analytics-scheduled-report-recording-repository';

const MANAGEMENT_SURFACE_PATH = new URL(
  '../../lib/analytics/admin-analytics-scheduled-report-management-surface.ts',
  import.meta.url
);
const PAGE_PATH = new URL('../../app/admin/analytics/scheduled-reports/page.tsx', import.meta.url);
const RECORD_DRY_RUN_ROUTE = new URL('../../app/admin/analytics/scheduled-reports/record-dry-run/route.ts', import.meta.url);
const RECORD_OWNER_APPROVAL_ROUTE = new URL('../../app/admin/analytics/scheduled-reports/record-owner-approval/route.ts', import.meta.url);
const RECORD_DISABLE_STATE_ROUTE = new URL('../../app/admin/analytics/scheduled-reports/record-disable-state/route.ts', import.meta.url);
const LIVE_EXECUTION_PATTERN = /sendMail|createTransport|transport\.(send|deliver)|setInterval|setTimeout|cron|schedule\.create/i;

function recordingEnv(): AdminAnalyticsScheduledReportRecordingEndpointEnv {
  return {
    ADMIN_ANALYTICS_SCHEDULED_REPORT_RECORDING_ENDPOINTS_ENABLED: 'true',
    ADMIN_ANALYTICS_SCHEDULED_REPORT_GENERATED_CLIENT_RUNTIME_ACCESS_ENABLED: 'true',
    ADMIN_ANALYTICS_SCHEDULED_REPORT_REPOSITORY_WRITES_ENABLED: 'true',
    ADMIN_ANALYTICS_SCHEDULED_REPORT_DRY_RUN_EVIDENCE_RECORDING_ENABLED: 'true',
    ADMIN_ANALYTICS_SCHEDULED_REPORT_OWNER_APPROVAL_RECORDING_ENABLED: 'true',
    ADMIN_ANALYTICS_SCHEDULED_REPORT_GLOBAL_DISABLE_STATE_RECORDING_ENABLED: 'true',
    ADMIN_ANALYTICS_SCHEDULED_REPORT_GLOBAL_KILL_SWITCH_VALIDATED: 'true',
    ADMIN_ANALYTICS_SCHEDULED_REPORT_OWNER_APPROVAL_POLICY_VALIDATED: 'true'
  };
}

function returnedRow() {
  return {
    id: 'sched_1',
    reportKey: 'weekly-owner',
    label: 'Weekly owner report',
    description: null,
    cadence: 'weekly',
    rangeMode: 'preset',
    rangeQuery: 'range=last_7_days',
    reportTypes: ['business', 'site'],
    ownerApproved: false,
    isActive: false,
    deliveryEnabled: false,
    deliveryChannel: null,
    lastDryRunAt: null,
    lastDryRunSummary: {},
    createdByRole: 'owner',
    createdByLabel: null,
    metadata: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z')
  };
}

async function runRecordingEndpointChecks() {
  const disabledPreview = loadScheduledReportRecordingEndpointPreview({ isOwner: true, env: {} });
  assert.equal(disabledPreview.endpointsAvailable, true);
  assert.equal(disabledPreview.runtimeEnabled, false);
  assert.equal(disabledPreview.dryRunEvidence.canRecord, false);
  assert.ok(disabledPreview.blockers.includes('repository writes not enabled'));

  const staffPreview = loadScheduledReportRecordingEndpointPreview({ isOwner: false, env: recordingEnv() });
  assert.equal(staffPreview.ownerAuthorized, false);
  assert.ok(staffPreview.blockers.includes('owner admin role required'));

  const state = buildScheduledReportRecordingEndpointGateState(recordingEnv());
  assert.equal(state.repositoryWritesEnabled, true);
  assert.equal(state.deliveryExecutionEnabled, false);
  assert.equal(state.schedulerEnabled, false);
  assert.equal(shouldAttachScheduledReportRecordingDelegate('dry-run-evidence', recordingEnv()), true);
  assert.equal(shouldAttachScheduledReportRecordingDelegate('global-disable-state', {}), false);

  const calls: unknown[] = [];
  const delegate: AdminAnalyticsScheduledReportRecordingDelegate = {
    update: async (args) => {
      calls.push(args);
      return returnedRow();
    }
  };

  const blocked = await recordScheduledReportEndpointRequest({
    target: 'dry-run-evidence',
    isOwner: true,
    payload: { id: 'sched_1', evidence: { ok: true } },
    delegate,
    env: {}
  });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.httpStatus, 423);

  const recorded = await recordScheduledReportEndpointRequest({
    target: 'dry-run-evidence',
    isOwner: true,
    payload: { id: 'sched_1', evidence: { ok: true } },
    delegate,
    env: recordingEnv(),
    now: new Date('2026-01-02T00:00:00.000Z')
  });
  assert.equal(recorded.ok, true);
  assert.equal(recorded.recordedId, 'sched_1');

  await recordScheduledReportEndpointRequest({
    target: 'owner-approval',
    isOwner: true,
    payload: { id: 'sched_1', approval: { reviewer: 'owner' } },
    delegate,
    env: recordingEnv()
  });
  await recordScheduledReportEndpointRequest({
    target: 'global-disable-state',
    isOwner: true,
    payload: { id: 'sched_1', disableState: { safeDefault: 'disabled' } },
    delegate,
    env: recordingEnv()
  });
  assert.equal(calls.length, 3);

  for (const routePath of [RECORD_DRY_RUN_ROUTE, RECORD_OWNER_APPROVAL_ROUTE, RECORD_DISABLE_STATE_ROUTE]) {
    const routeSource = await readFile(routePath, 'utf8');
    assert.match(routeSource, /export async function POST/);
    assert.match(routeSource, /assertAdminRole\('owner'\)/);
    assert.match(routeSource, /shouldAttachScheduledReportRecordingDelegate/);
    assert.match(routeSource, /await import\('@\/lib\/prisma'\)/);
    assert.doesNotMatch(routeSource, /export\s+async\s+function\s+(GET|PUT|PATCH|DELETE)/);
    assert.doesNotMatch(routeSource, /sendMail|transport|setInterval|setTimeout|cron|schedule\.create/i);
  }
}

export async function runScheduledReportManagementSurfaceTests() {
  const ownerSurface = buildAdminAnalyticsScheduledReportManagementSurfaceContract({ isOwner: true });
  assert.equal(ownerSurface.status, 'management_surface_visible_runtime_disabled');
  assert.equal(ownerSurface.routePath, '/admin/analytics/scheduled-reports');
  assert.equal(ownerSurface.visibleToOwner, true);
  assert.equal(ownerSurface.repositoryReadPathEnabled, false);
  assert.equal(ownerSurface.repositoryWritePathEnabled, false);
  assert.equal(ownerSurface.readEndpointEnabled, false);
  assert.equal(ownerSurface.writeEndpointEnabled, false);
  assert.equal(ownerSurface.managementControlsEnabled, false);
  assert.equal(ownerSurface.schedulerEnabled, false);
  assert.equal(ownerSurface.deliveryExecutionEnabled, false);
  assert.ok(ownerSurface.controls.length >= 6);
  assert.ok(ownerSurface.controls.every((control) => control.enabled === false));

  const approvedPostEndpoints = [...ADMIN_ANALYTICS_SCHEDULED_REPORT_MANAGEMENT_APPROVED_POST_ENDPOINTS].sort();
  const formControls = ownerSurface.controls.filter((control) => control.actionPath);
  assert.equal(formControls.length, 3);
  assert.deepEqual(
    formControls.map((control) => control.actionPath).sort(),
    approvedPostEndpoints
  );
  assert.ok(formControls.every((control) => control.method === 'post'));
  assert.ok(formControls.every((control) => control.enabled === false));

  const aliasSurface = buildScheduledReportManagementSurfaceContract({ isOwner: true });
  assert.deepEqual(aliasSurface, ownerSurface);

  const staffSurface = buildAdminAnalyticsScheduledReportManagementSurfaceContract({ isOwner: false });
  assert.equal(staffSurface.visibleToStaff, true);
  assert.equal(staffSurface.visibleToOwner, false);

  const managementSurfaceSource = await readFile(MANAGEMENT_SURFACE_PATH, 'utf8');
  const declaredActionPaths = [...managementSurfaceSource.matchAll(/actionPath: '([^']+)'/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(declaredActionPaths)].sort(), approvedPostEndpoints);
  assert.doesNotMatch(managementSurfaceSource, /actionPath: '\/admin\/analytics\/scheduled-reports\/(activate|delivery|run|scheduler)/i);
  assert.doesNotMatch(managementSurfaceSource, LIVE_EXECUTION_PATTERN);

  const pageSource = await readFile(PAGE_PATH, 'utf8');
  assert.match(pageSource, /buildScheduledReportManagementSurfaceContract/);
  assert.match(pageSource, /requireAdminRouteSession/);
  assert.match(pageSource, /identity\.role === 'owner'/);
  assert.match(pageSource, /<form\b/i);
  assert.match(pageSource, /action=\{control\.actionPath\}/);
  assert.match(pageSource, /method=\{control\.method\}/);
  assert.match(pageSource, /disabled=\{!control\.enabled\}/);
  assert.doesNotMatch(pageSource, /AdminAnalyticsScheduledReport/);
  assert.doesNotMatch(pageSource, /fetch\(|XMLHttpRequest|navigator\.sendBeacon/i);
  assert.doesNotMatch(pageSource, /createGatedAdminAnalyticsScheduledReportRecordingRepositoryFactory/);
  assert.doesNotMatch(pageSource, /createGatedAdminAnalyticsScheduledReportPrismaReaderFactory/);
  assert.doesNotMatch(pageSource, /PrismaClient/);
  assert.doesNotMatch(pageSource, /\.findMany\(/);
  assert.doesNotMatch(pageSource, /\.update\(/);
  assert.doesNotMatch(pageSource, /setInterval|setTimeout|cron|enqueue/i);

  await runRecordingEndpointChecks();

  console.log('scheduled-report-management-surface.test.ts passed');
}
