import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildScheduledReportRecordingEndpointGateState,
  isScheduledReportRecordingEndpointRuntimeEnabledFor,
  loadScheduledReportRecordingEndpointPreview,
  recordScheduledReportEndpointRequest,
  shouldAttachScheduledReportRecordingDelegate,
  type AdminAnalyticsScheduledReportRecordingEndpointEnv
} from '../../lib/analytics/admin-analytics-scheduled-report-recording-endpoint';
import type { AdminAnalyticsScheduledReportRecordingDelegate } from '../../lib/analytics/admin-analytics-scheduled-report-recording-repository';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function enabledEnv(): AdminAnalyticsScheduledReportRecordingEndpointEnv {
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

export async function runScheduledReportRecordingEndpointTests() {
  const preview = loadScheduledReportRecordingEndpointPreview({ isOwner: true, env: {} });
  assert.equal(preview.ownerOnly, true);
  assert.equal(preview.ownerAuthorized, true);
  assert.equal(preview.endpointsAvailable, true);
  assert.equal(preview.runtimeEnabled, false);
  assert.equal(preview.dryRunEvidence.canRecord, false);
  assert.ok(preview.blockers.includes('repository writes not enabled'));

  const staffPreview = loadScheduledReportRecordingEndpointPreview({ isOwner: false, env: enabledEnv() });
  assert.equal(staffPreview.ownerAuthorized, false);
  assert.ok(staffPreview.blockers.includes('owner admin role required'));

  const state = buildScheduledReportRecordingEndpointGateState(enabledEnv());
  assert.equal(state.generatedClientRuntimeAccessEnabled, true);
  assert.equal(state.repositoryWritesEnabled, true);
  assert.equal(state.dryRunEvidenceRecordingEnabled, true);
  assert.equal(state.ownerApprovalRecordingEnabled, true);
  assert.equal(state.globalDisableStateRecordingEnabled, true);
  assert.equal(state.deliveryExecutionEnabled, false);
  assert.equal(state.schedulerEnabled, false);
  assert.equal(isScheduledReportRecordingEndpointRuntimeEnabledFor('dry-run-evidence', enabledEnv()), true);
  assert.equal(shouldAttachScheduledReportRecordingDelegate('owner-approval', enabledEnv()), true);
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
  assert.equal(calls.length, 0);

  const recorded = await recordScheduledReportEndpointRequest({
    target: 'dry-run-evidence',
    isOwner: true,
    payload: { id: 'sched_1', evidence: { ok: true } },
    delegate,
    env: enabledEnv(),
    now: new Date('2026-01-02T00:00:00.000Z')
  });
  assert.equal(recorded.ok, true);
  assert.equal(recorded.httpStatus, 200);
  assert.equal(recorded.recordedId, 'sched_1');

  await recordScheduledReportEndpointRequest({
    target: 'owner-approval',
    isOwner: true,
    payload: { id: 'sched_1', approval: { reviewer: 'owner' } },
    delegate,
    env: enabledEnv()
  });
  await recordScheduledReportEndpointRequest({
    target: 'global-disable-state',
    isOwner: true,
    payload: { id: 'sched_1', disableState: { safeDefault: 'disabled' } },
    delegate,
    env: enabledEnv()
  });
  assert.equal(calls.length, 3);

  const routePaths = [
    'app/admin/analytics/scheduled-reports/record-dry-run/route.ts',
    'app/admin/analytics/scheduled-reports/record-owner-approval/route.ts',
    'app/admin/analytics/scheduled-reports/record-disable-state/route.ts'
  ];
  for (const path of routePaths) {
    const routeSource = source(path);
    assert.match(routeSource, /export async function POST/);
    assert.match(routeSource, /assertAdminRole\('owner'\)/);
    assert.match(routeSource, /shouldAttachScheduledReportRecordingDelegate/);
    assert.match(routeSource, /await import\('@\/lib\/prisma'\)/);
    assert.doesNotMatch(routeSource, /export\s+async\s+function\s+(GET|PUT|PATCH|DELETE)/);
    assert.doesNotMatch(routeSource, /sendMail|transport|setInterval|setTimeout|cron|schedule\.create/i);
  }

  const pageSource = source('app/admin/analytics/scheduled-reports/page.tsx');
  assert.doesNotMatch(pageSource, /<form\b/i);
  assert.doesNotMatch(pageSource, /\bmethod=/i);
  assert.doesNotMatch(pageSource, /recordScheduledReportEndpointRequest/);

  console.log('scheduled-report-recording-endpoints.test.ts passed');
}
