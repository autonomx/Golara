import assert from 'node:assert/strict';
import { buildAdminAnalyticsScheduledReportRecordingReadinessContract } from '../../lib/analytics/admin-analytics-scheduled-report-recording-readiness';

export function runScheduledReportRecordingReadinessTests() {
  const contract = buildAdminAnalyticsScheduledReportRecordingReadinessContract();

  assert.equal(contract.status, 'recording_readiness_contract_only');
  assert.equal(contract.enabled, false);
  assert.equal(contract.contractAvailable, true);
  assert.equal(contract.dryRunEvidenceRecordingReady, true);
  assert.equal(contract.dryRunEvidenceRecordingEnabled, false);
  assert.equal(contract.ownerApprovalRecordingReady, true);
  assert.equal(contract.ownerApprovalRecordingEnabled, false);
  assert.equal(contract.globalDisableStateRecordingReady, true);
  assert.equal(contract.globalDisableStateRecordingEnabled, false);
  assert.equal(contract.repositoryWritesEnabled, false);
  assert.equal(contract.writeEndpointEnabled, false);
  assert.equal(contract.managementUiEnabled, false);
  assert.equal(contract.schedulerEnabled, false);
  assert.equal(contract.deliveryExecutionEnabled, false);
  assert.deepEqual(contract.allowedRecordingTargets, ['dry-run-evidence', 'owner-approval', 'global-disable-state']);
  assert.equal(contract.recordingPlans.length, 3);

  const dryRun = contract.recordingPlans.find((plan) => plan.target === 'dry-run-evidence');
  assert.ok(dryRun);
  assert.deepEqual(dryRun.recordFields, ['lastDryRunAt', 'lastDryRunSummary']);
  assert.equal(dryRun.repositoryWriteEnabled, false);
  assert.ok(dryRun.requiredEvidenceFields.includes('Business CSV preview path'));
  assert.ok(dryRun.requiredEvidenceFields.includes('Site CSV preview path'));

  const approval = contract.recordingPlans.find((plan) => plan.target === 'owner-approval');
  assert.ok(approval);
  assert.deepEqual(approval.recordFields, ['ownerApproved', 'metadata']);
  assert.equal(approval.repositoryWriteEnabled, false);
  assert.ok(approval.requiredEvidenceFields.includes('owner reviewer identity'));
  assert.ok(approval.requiredEvidenceFields.includes('dry-run evidence reference'));

  const globalDisable = contract.recordingPlans.find((plan) => plan.target === 'global-disable-state');
  assert.ok(globalDisable);
  assert.deepEqual(globalDisable.recordFields, ['isActive', 'deliveryEnabled', 'metadata']);
  assert.equal(globalDisable.repositoryWriteEnabled, false);
  assert.ok(globalDisable.requiredEvidenceFields.includes('safe default state'));
  assert.ok(globalDisable.requiredEvidenceFields.includes('rollback procedure'));

  assert.ok(contract.activationBlockers.includes('dry-run evidence recording not enabled'));
  assert.ok(contract.activationBlockers.includes('owner approval recording not enabled'));
  assert.ok(contract.activationBlockers.includes('global disable state recording not enabled'));
  assert.ok(contract.activationBlockers.includes('repository writes remain disabled'));
  assert.ok(contract.activationBlockers.includes('scheduler remains disabled'));
  assert.ok(contract.activationBlockers.includes('delivery execution remains disabled'));

  console.log('scheduled-report-recording-readiness.test.ts passed');
}
