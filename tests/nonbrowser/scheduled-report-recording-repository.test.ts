import assert from 'node:assert/strict';
import {
  buildAdminAnalyticsScheduledReportRecordingRepositoryDecision,
  createGatedAdminAnalyticsScheduledReportRecordingRepositoryFactory,
  type AdminAnalyticsScheduledReportRecordingDelegate
} from '../../lib/analytics/admin-analytics-scheduled-report-recording-repository';

function activeGateState() {
  return {
    generatedClientRuntimeAccessEnabled: true,
    repositoryWritesEnabled: true,
    dryRunEvidenceRecordingEnabled: true,
    ownerApprovalRecordingEnabled: true,
    globalDisableStateRecordingEnabled: true,
    globalKillSwitchValidated: true,
    ownerApprovalPolicyValidated: true,
    deliveryExecutionEnabled: false,
    writeEndpointEnabled: false,
    managementUiEnabled: false,
    schedulerEnabled: false
  };
}

export async function runScheduledReportRecordingRepositoryTests() {
  const defaultDecision = buildAdminAnalyticsScheduledReportRecordingRepositoryDecision('dry-run-evidence');
  assert.equal(defaultDecision.status, 'recording_repository_runtime_gated');
  assert.equal(defaultDecision.enabled, false);
  assert.equal(defaultDecision.canRecord, false);
  assert.ok(defaultDecision.blockers.includes('repository writes not enabled'));
  assert.ok(defaultDecision.blockers.includes('dry-run evidence recording not enabled'));
  assert.ok(defaultDecision.blockers.includes('global disable control not validated'));

  const blockedByDelivery = buildAdminAnalyticsScheduledReportRecordingRepositoryDecision('owner-approval', {
    ...activeGateState(),
    deliveryExecutionEnabled: true
  });
  assert.equal(blockedByDelivery.canRecord, false);
  assert.ok(blockedByDelivery.blockers.includes('delivery execution must remain disabled'));

  const calls: unknown[] = [];
  const delegate: AdminAnalyticsScheduledReportRecordingDelegate = {
    update: async (args) => {
      calls.push(args);
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
  };

  const defaultFactory = createGatedAdminAnalyticsScheduledReportRecordingRepositoryFactory(delegate);
  assert.equal(defaultFactory.createRepository('dry-run-evidence'), null);

  const enabledFactory = createGatedAdminAnalyticsScheduledReportRecordingRepositoryFactory(delegate, activeGateState());
  const repository = enabledFactory.createRepository('dry-run-evidence');
  assert.ok(repository);
  await repository.recordDryRunEvidence('sched_1', { preview: 'ok' }, new Date('2026-01-02T00:00:00.000Z'));
  await repository.recordOwnerApproval('sched_1', { reviewer: 'owner' });
  await repository.recordGlobalDisableState('sched_1', { safeDefault: 'disabled' });

  assert.equal(calls.length, 3);
  assert.deepEqual((calls[0] as { data: Record<string, unknown> }).data, {
    lastDryRunAt: new Date('2026-01-02T00:00:00.000Z'),
    lastDryRunSummary: { preview: 'ok' }
  });
  assert.deepEqual((calls[1] as { data: Record<string, unknown> }).data, {
    ownerApproved: true,
    metadata: { reviewer: 'owner' }
  });
  assert.deepEqual((calls[2] as { data: Record<string, unknown> }).data, {
    isActive: false,
    deliveryEnabled: false,
    metadata: { safeDefault: 'disabled' }
  });

  console.log('scheduled-report-recording-repository.test.ts passed');
}
