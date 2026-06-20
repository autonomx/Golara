import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildAdminAnalyticsScheduledReportDeliveryReadinessContract } from '../../lib/analytics/admin-analytics-scheduled-report-delivery-readiness';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export function runScheduledReportDeliveryReadinessTests() {
  const contract = buildAdminAnalyticsScheduledReportDeliveryReadinessContract();

  assert.equal(contract.status, 'delivery_readiness_contract_only');
  assert.equal(contract.enabled, false);
  assert.equal(contract.contractAvailable, true);
  assert.equal(contract.deliveryExecutionEnabled, false);
  assert.equal(contract.schedulerEnabled, false);
  assert.equal(contract.timerEnabled, false);
  assert.equal(contract.backgroundJobEnabled, false);
  assert.equal(contract.repositoryReadsEnabled, false);
  assert.equal(contract.repositoryWritesEnabled, false);
  assert.equal(contract.readEndpointEnabled, false);
  assert.equal(contract.managementUiEnabled, false);
  assert.equal(contract.ownerApprovalRecordingEnabled, false);
  assert.equal(contract.dryRunEvidenceRecordingEnabled, false);
  assert.equal(contract.globalDisableStateRecordingEnabled, false);
  assert.equal(contract.ownerOverrideEnabled, false);

  const payload = contract.aggregatePayloadContract;
  assert.equal(payload.status, 'aggregate_payload_contract_only');
  assert.equal(payload.enabled, false);
  assert.equal(payload.aggregateOnly, true);
  assert.deepEqual(payload.allowedReportTypes, ['business', 'site']);
  assert.deepEqual(payload.allowedCadences, ['weekly', 'monthly']);
  assert.ok(payload.requiredPayloadSections.includes('business-csv-preview'));
  assert.ok(payload.requiredPayloadSections.includes('site-csv-preview'));
  assert.ok(payload.requiredPayloadSections.includes('failure-visibility-summary'));
  assert.ok(payload.requiredPayloadFields.includes('Business CSV preview path'));
  assert.ok(payload.requiredPayloadFields.includes('Site CSV preview path'));
  assert.ok(payload.blockedPayloadFields.includes('customer rows'));
  assert.ok(payload.blockedPayloadFields.includes('customer contact fields'));
  assert.ok(payload.blockedPayloadFields.includes('raw site event rows'));
  assert.ok(payload.blockedPayloadFields.includes('visitor identifiers'));
  assert.equal(payload.payloadBodyRecordingEnabled, false);
  assert.equal(payload.payloadPreviewRecordingEnabled, false);

  const channel = contract.deliveryChannelContract;
  assert.equal(channel.status, 'delivery_channel_disabled_contract_only');
  assert.equal(channel.enabled, false);
  assert.equal(channel.channelRuntimeEnabled, false);
  assert.equal(channel.channelConfigurationRecordingEnabled, false);
  assert.deepEqual(channel.allowedFutureChannels, ['owner-email', 'owner-dashboard-download']);
  assert.ok(channel.requiredChannelEvidenceFields.includes('channel owner'));
  assert.ok(channel.requiredChannelEvidenceFields.includes('disable workflow'));
  assert.ok(channel.blockedChannelOperations.includes('send scheduled report'));
  assert.ok(channel.blockedChannelOperations.includes('enqueue scheduled report'));

  const retryFailure = contract.retryFailureVisibilityContract;
  assert.equal(retryFailure.status, 'retry_failure_visibility_contract_only');
  assert.equal(retryFailure.enabled, false);
  assert.equal(retryFailure.retryPolicyVisible, true);
  assert.equal(retryFailure.retryExecutionEnabled, false);
  assert.equal(retryFailure.failureVisibilityRequired, true);
  assert.equal(retryFailure.failureRecordingEnabled, false);
  assert.ok(retryFailure.requiredFailureEvidenceFields.includes('owner-visible failure summary'));
  assert.ok(retryFailure.requiredFailureEvidenceFields.includes('manual disable instruction'));
  assert.ok(retryFailure.blockedRetryOperations.includes('execute retry'));
  assert.ok(retryFailure.blockedRetryOperations.includes('record failure state'));

  const preview = contract.operatorPreviewSummaryContract;
  assert.equal(preview.status, 'operator_preview_summary_contract_only');
  assert.equal(preview.enabled, false);
  assert.equal(preview.previewSummaryRequired, true);
  assert.equal(preview.previewSummaryRecordingEnabled, false);
  assert.equal(preview.ownerReviewerRequired, true);
  assert.ok(preview.requiredPreviewFields.includes('reviewer identity'));
  assert.ok(preview.requiredPreviewFields.includes('delivery disabled confirmation'));
  assert.ok(preview.requiredPreviewFields.includes('global disable confirmation'));
  assert.ok(preview.blockedPreviewOperations.includes('record preview review'));
  assert.ok(preview.blockedPreviewOperations.includes('activate schedule from preview'));

  assert.ok(contract.requirements.some((requirement) => requirement.key === 'aggregate-business-site-only' && requirement.required));
  assert.ok(contract.requirements.some((requirement) => requirement.key === 'channel-disabled-confirmed' && requirement.required));
  assert.ok(contract.requirements.some((requirement) => requirement.key === 'retry-visibility-reviewed' && requirement.required));
  assert.ok(contract.requirements.some((requirement) => requirement.key === 'operator-preview-reviewed' && requirement.required));
  assert.ok(contract.requirements.every((requirement) => requirement.satisfiedByDefault === false));
  assert.ok(contract.blockedOperations.includes('build live delivery payload'));
  assert.ok(contract.blockedOperations.includes('execute delivery'));
  assert.ok(contract.blockedOperations.includes('record operator preview'));
  assert.ok(contract.activationBlockers.includes('delivery payload recording not enabled'));
  assert.ok(contract.activationBlockers.includes('delivery channel runtime disabled'));
  assert.ok(contract.activationBlockers.includes('retry execution disabled'));
  assert.ok(contract.activationBlockers.includes('scheduler remains disabled'));
  assert.ok(contract.activationBlockers.includes('delivery execution remains disabled'));

  const readinessSource = source('lib/analytics/admin-analytics-scheduled-report-delivery-readiness.ts');
  assert.match(readinessSource, /delivery_readiness_contract_only/);
  assert.match(readinessSource, /aggregate_payload_contract_only/);
  assert.match(readinessSource, /delivery_channel_disabled_contract_only/);
  assert.match(readinessSource, /retry_failure_visibility_contract_only/);
  assert.match(readinessSource, /operator_preview_summary_contract_only/);
  assert.match(readinessSource, /deliveryExecutionEnabled: false/);
  assert.match(readinessSource, /schedulerEnabled: false/);
  assert.match(readinessSource, /repositoryWritesEnabled: false/);
  assert.match(readinessSource, /payloadBodyRecordingEnabled: false/);
  assert.match(readinessSource, /channelRuntimeEnabled: false/);
  assert.match(readinessSource, /retryExecutionEnabled: false/);
  assert.match(readinessSource, /previewSummaryRecordingEnabled: false/);
  assert.doesNotMatch(readinessSource, /PrismaClient|prisma\.|$queryRaw|findMany|create\(|update\(|upsert\(|delete\(|fetch\(|sendMail|transport|cron|schedule\.create|setInterval|setTimeout|\bPOST\b|\bPUT\b|\bPATCH\b|\bDELETE\b|localStorage|sessionStorage|cookies\(/);

  const scheduledReportContractSource = [
    readinessSource,
    source('lib/analytics/admin-analytics-scheduled-report-dry-run-evidence.ts'),
    source('lib/analytics/admin-analytics-scheduled-report-global-kill-switch.ts'),
    source('lib/analytics/admin-analytics-scheduled-report-owner-approval-policy.ts'),
    source('lib/analytics/admin-analytics-scheduled-report-repository.ts'),
    source('lib/analytics/admin-analytics-scheduled-report-read-model.ts'),
    source('lib/analytics/admin-analytics-scheduled-report-storage.ts'),
    source('lib/analytics/admin-analytics-scheduled-reports.ts')
  ].join('\n');

  assert.doesNotMatch(
    scheduledReportContractSource,
    /PrismaClient|prisma\.|$queryRaw|findMany|create\(|update\(|upsert\(|delete\(|fetch\(|sendMail|transport|cron|schedule\.create|setInterval|setTimeout/,
    'scheduled-report delivery-readiness contracts should not add database, scheduler, timer, background, or delivery execution'
  );

  console.log('scheduled-report-delivery-readiness.test.ts passed');
}
