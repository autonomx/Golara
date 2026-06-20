import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildAdminAnalyticsScheduledReportDryRunEvidencePolicy } from '../../lib/analytics/admin-analytics-scheduled-report-dry-run-evidence';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export function runScheduledReportDryRunEvidenceTests() {
  const policy = buildAdminAnalyticsScheduledReportDryRunEvidencePolicy();

  assert.equal(policy.status, 'dry_run_evidence_contract_only');
  assert.equal(policy.enabled, false);
  assert.equal(policy.contractAvailable, true);
  assert.equal(policy.evidenceRecordingEnabled, false);
  assert.equal(policy.evidenceRequired, true);
  assert.equal(policy.dryRunPassedByDefault, false);
  assert.equal(policy.selectedRangeRequired, true);
  assert.equal(policy.aggregateOnlyPayloadRequired, true);
  assert.equal(policy.businessCsvPreviewRequired, true);
  assert.equal(policy.siteCsvPreviewRequired, true);
  assert.equal(policy.globalDisableEvidenceRequired, true);
  assert.equal(policy.ownerApprovalEvidenceRequired, true);
  assert.equal(policy.deliveryDisabledEvidenceRequired, true);
  assert.equal(policy.scheduleActivationEnabled, false);
  assert.equal(policy.deliveryExecutionEnabled, false);
  assert.equal(policy.repositoryReadsEnabled, false);
  assert.equal(policy.repositoryWritesEnabled, false);
  assert.equal(policy.readEndpointEnabled, false);
  assert.equal(policy.managementUiEnabled, false);
  assert.deepEqual(policy.allowedReportTypes, ['business', 'site']);

  assert.ok(policy.requiredEvidenceFields.includes('dry-run evidence id'));
  assert.ok(policy.requiredEvidenceFields.includes('dry-run timestamp'));
  assert.ok(policy.requiredEvidenceFields.includes('selected range query'));
  assert.ok(policy.requiredEvidenceFields.includes('Business CSV preview path'));
  assert.ok(policy.requiredEvidenceFields.includes('Site CSV preview path'));
  assert.ok(policy.requiredEvidenceFields.includes('global disable control confirmation'));
  assert.ok(policy.requiredEvidenceFields.includes('owner approval policy confirmation'));
  assert.ok(policy.requiredEvidenceFields.includes('delivery disabled confirmation'));

  assert.ok(policy.requirements.some((requirement) => requirement.key === 'selected-range-recorded' && requirement.required));
  assert.ok(policy.requirements.some((requirement) => requirement.key === 'aggregate-report-types-only' && requirement.required));
  assert.ok(policy.requirements.some((requirement) => requirement.key === 'csv-preview-paths-recorded' && requirement.required));
  assert.ok(policy.requirements.some((requirement) => requirement.key === 'global-disable-control-confirmed' && requirement.required));
  assert.ok(policy.requirements.some((requirement) => requirement.key === 'owner-approval-policy-confirmed' && requirement.required));
  assert.ok(policy.requirements.some((requirement) => requirement.key === 'delivery-disabled-confirmed' && requirement.required));
  assert.ok(policy.requirements.every((requirement) => requirement.satisfiedByDefault === false));

  assert.ok(policy.blockedOperations.includes('record dry-run evidence'));
  assert.ok(policy.blockedOperations.includes('activate scheduled report metadata'));
  assert.ok(policy.blockedOperations.includes('enable scheduled report delivery'));
  assert.ok(policy.activationBlockers.includes('dry-run evidence recording not enabled'));
  assert.ok(policy.activationBlockers.includes('dry-run evidence not recorded'));
  assert.ok(policy.activationBlockers.includes('selected range evidence not recorded'));
  assert.ok(policy.activationBlockers.includes('aggregate CSV preview paths not recorded'));
  assert.ok(policy.activationBlockers.includes('global disable control evidence not recorded'));
  assert.ok(policy.activationBlockers.includes('owner approval evidence not recorded'));
  assert.ok(policy.activationBlockers.includes('delivery execution remains disabled'));

  const policySource = source('lib/analytics/admin-analytics-scheduled-report-dry-run-evidence.ts');
  assert.match(policySource, /dry_run_evidence_contract_only/);
  assert.match(policySource, /evidenceRecordingEnabled: false/);
  assert.match(policySource, /dryRunPassedByDefault: false/);
  assert.match(policySource, /aggregateOnlyPayloadRequired: true/);
  assert.match(policySource, /businessCsvPreviewRequired: true/);
  assert.match(policySource, /siteCsvPreviewRequired: true/);
  assert.match(policySource, /globalDisableEvidenceRequired: true/);
  assert.match(policySource, /ownerApprovalEvidenceRequired: true/);
  assert.match(policySource, /deliveryDisabledEvidenceRequired: true/);
  assert.doesNotMatch(policySource, /PrismaClient|prisma\.|\$queryRaw|findMany|create\(|update\(|upsert\(|delete\(|fetch\(|sendMail|transport|cron|schedule\.create|setInterval|setTimeout|\bPOST\b|\bPUT\b|\bPATCH\b|\bDELETE\b|localStorage|sessionStorage|cookies\(/);

  const scheduledReportContractSource = [
    policySource,
    source('lib/analytics/admin-analytics-scheduled-report-global-kill-switch.ts'),
    source('lib/analytics/admin-analytics-scheduled-report-owner-approval-policy.ts'),
    source('lib/analytics/admin-analytics-scheduled-report-repository.ts'),
    source('lib/analytics/admin-analytics-scheduled-report-read-model.ts'),
    source('lib/analytics/admin-analytics-scheduled-report-storage.ts'),
    source('lib/analytics/admin-analytics-scheduled-reports.ts')
  ].join('\n');

  assert.doesNotMatch(
    scheduledReportContractSource,
    /PrismaClient|prisma\.|\$queryRaw|findMany|create\(|update\(|upsert\(|delete\(|fetch\(|sendMail|transport|cron|schedule\.create|setInterval|setTimeout/,
    'scheduled-report dry-run evidence contract should not add database, scheduler, timer, background, or delivery execution'
  );

  console.log('scheduled-report-dry-run-evidence.test.ts passed');
}
