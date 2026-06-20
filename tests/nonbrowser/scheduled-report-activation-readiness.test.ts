import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildAdminAnalyticsScheduledReportActivationReadinessDecision,
  buildScheduledReportActivationReadinessPreview,
  createGatedAdminAnalyticsScheduledReportActivationRepositoryFactory,
  type AdminAnalyticsScheduledReportActivationCandidate,
  type AdminAnalyticsScheduledReportActivationDelegate,
  type AdminAnalyticsScheduledReportActivationGateState
} from '../../lib/analytics/admin-analytics-scheduled-report-activation-readiness';

const ACTIVATION_READINESS_PATH = new URL(
  '../../lib/analytics/admin-analytics-scheduled-report-activation-readiness.ts',
  import.meta.url
);
const PAGE_PATH = new URL('../../app/admin/analytics/scheduled-reports/page.tsx', import.meta.url);
const LIVE_EXECUTION_PATTERN = /sendMail|createTransport|transport\.(send|deliver)|setInterval|setTimeout|cron|schedule\.create|enqueue/i;

function activeGateState(): AdminAnalyticsScheduledReportActivationGateState {
  return {
    generatedClientRuntimeAccessEnabled: true,
    repositoryWritesEnabled: true,
    activationMetadataWritesEnabled: true,
    globalKillSwitchPermitsActivation: true,
    globalDisableStateValidated: true,
    ownerApprovalPolicyValidated: true,
    deliveryExecutionEnabled: false,
    deliveryTransportConfigured: false,
    schedulerEnabled: false,
    timerEnabled: false,
    backgroundJobEnabled: false
  };
}

function activationCandidate(overrides: Partial<AdminAnalyticsScheduledReportActivationCandidate> = {}): AdminAnalyticsScheduledReportActivationCandidate {
  return {
    id: 'sched_1',
    ownerApproved: true,
    isActive: false,
    deliveryEnabled: false,
    lastDryRunAt: new Date('2026-01-02T00:00:00.000Z'),
    lastDryRunSummary: { preview: 'ok' },
    metadata: {},
    ...overrides
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
    ownerApproved: true,
    isActive: true,
    deliveryEnabled: false,
    deliveryChannel: null,
    lastDryRunAt: new Date('2026-01-02T00:00:00.000Z'),
    lastDryRunSummary: { preview: 'ok' },
    createdByRole: 'owner',
    createdByLabel: null,
    metadata: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-03T00:00:00.000Z')
  };
}

export async function runScheduledReportActivationReadinessTests() {
  const preview = buildScheduledReportActivationReadinessPreview({ isOwner: true });
  assert.equal(preview.status, 'activation_readiness_runtime_gated');
  assert.equal(preview.ownerOnly, true);
  assert.equal(preview.visibleToOwner, true);
  assert.equal(preview.canActivate, false);
  assert.equal(preview.schedulerEnabled, false);
  assert.equal(preview.timerEnabled, false);
  assert.equal(preview.backgroundJobEnabled, false);
  assert.equal(preview.deliveryExecutionEnabled, false);
  assert.equal(preview.deliveryEnabledAfterActivation, false);
  assert.ok(preview.blockers.includes('activation metadata writes not enabled'));
  assert.ok(preview.blockers.includes('scheduled report row not selected'));
  assert.equal(preview.updateArgs, null);

  const staffDecision = buildAdminAnalyticsScheduledReportActivationReadinessDecision({
    isOwner: false,
    state: activeGateState(),
    candidate: activationCandidate()
  });
  assert.equal(staffDecision.canActivate, false);
  assert.ok(staffDecision.blockers.includes('owner admin role required'));

  const blockedByDelivery = buildAdminAnalyticsScheduledReportActivationReadinessDecision({
    isOwner: true,
    state: { ...activeGateState(), deliveryExecutionEnabled: true },
    candidate: activationCandidate()
  });
  assert.equal(blockedByDelivery.canActivate, false);
  assert.ok(blockedByDelivery.blockers.includes('delivery execution must remain disabled'));
  assert.equal(blockedByDelivery.updateArgs, null);

  const blockedByScheduler = buildAdminAnalyticsScheduledReportActivationReadinessDecision({
    isOwner: true,
    state: { ...activeGateState(), schedulerEnabled: true },
    candidate: activationCandidate()
  });
  assert.equal(blockedByScheduler.canActivate, false);
  assert.ok(blockedByScheduler.blockers.includes('scheduler must remain disabled'));

  const blockedByReportDelivery = buildAdminAnalyticsScheduledReportActivationReadinessDecision({
    isOwner: true,
    state: activeGateState(),
    candidate: activationCandidate({ deliveryEnabled: true })
  });
  assert.equal(blockedByReportDelivery.canActivate, false);
  assert.ok(blockedByReportDelivery.blockers.includes('scheduled report deliveryEnabled must remain false'));

  const blockedByMissingEvidence = buildAdminAnalyticsScheduledReportActivationReadinessDecision({
    isOwner: true,
    state: activeGateState(),
    candidate: activationCandidate({ lastDryRunAt: null, lastDryRunSummary: {} })
  });
  assert.equal(blockedByMissingEvidence.canActivate, false);
  assert.ok(blockedByMissingEvidence.blockers.includes('dry-run evidence timestamp not recorded'));
  assert.ok(blockedByMissingEvidence.blockers.includes('dry-run evidence summary not recorded'));

  const ready = buildAdminAnalyticsScheduledReportActivationReadinessDecision({
    isOwner: true,
    state: activeGateState(),
    candidate: activationCandidate(),
    metadata: {
      activatedAt: new Date('2026-01-03T00:00:00.000Z'),
      activatedByLabel: 'Owner Admin'
    }
  });
  assert.equal(ready.canActivate, true);
  assert.equal(ready.updateArgs?.where.id, 'sched_1');
  assert.deepEqual(ready.updateArgs?.data, {
    isActive: true,
    deliveryEnabled: false,
    metadata: {
      activation: {
        status: 'active_metadata_recorded_delivery_disabled',
        activatedAt: '2026-01-03T00:00:00.000Z',
        activatedByRole: 'owner',
        activatedByLabel: 'Owner Admin',
        dryRunEvidenceRecorded: true,
        ownerApprovalRecorded: true,
        globalKillSwitchPermitted: true,
        globalDisableStateValidated: true,
        schedulerEnabled: false,
        deliveryExecutionEnabled: false,
        deliveryEnabled: false
      }
    }
  });

  const calls: unknown[] = [];
  const delegate: AdminAnalyticsScheduledReportActivationDelegate = {
    update: async (args) => {
      calls.push(args);
      return returnedRow();
    }
  };

  const defaultFactory = createGatedAdminAnalyticsScheduledReportActivationRepositoryFactory(delegate);
  assert.equal(defaultFactory.createRepository(activationCandidate()), null);

  const enabledFactory = createGatedAdminAnalyticsScheduledReportActivationRepositoryFactory(delegate, activeGateState(), true);
  const repository = enabledFactory.createRepository(activationCandidate());
  assert.ok(repository);
  await repository.activateMetadataOnly(activationCandidate(), {
    activatedAt: new Date('2026-01-03T00:00:00.000Z'),
    activatedByLabel: 'Owner Admin'
  });
  assert.equal(calls.length, 1);
  assert.deepEqual((calls[0] as { data: Record<string, unknown> }).data, ready.updateArgs?.data);

  const source = await readFile(ACTIVATION_READINESS_PATH, 'utf8');
  assert.doesNotMatch(source, LIVE_EXECUTION_PATTERN);
  assert.doesNotMatch(source, /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/);
  assert.doesNotMatch(source, /await import\('@\/lib\/prisma'\)/);
  assert.doesNotMatch(source, /\.findMany\(/);

  const pageSource = await readFile(PAGE_PATH, 'utf8');
  assert.match(pageSource, /buildScheduledReportActivationReadinessPreview/);
  assert.match(pageSource, /Activation readiness/);
  assert.doesNotMatch(pageSource, /\/admin\/analytics\/scheduled-reports\/(activate|activation|delivery|scheduler)/i);
  assert.doesNotMatch(pageSource, LIVE_EXECUTION_PATTERN);

  console.log('scheduled-report-activation-readiness.test.ts passed');
}
