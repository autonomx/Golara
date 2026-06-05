import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { validatePaymentOperationMigrationEvidence } from '../../lib/checkout/payment-operation-migration-evidence';
import { validatePaymentOperationProviderEvidencePacket } from '../../lib/checkout/payment-operation-provider-readiness';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function assertNoExecutionSurface(pageSource: string) {
  assert.equal(pageSource.includes('fetch('), false);
  assert.equal(pageSource.includes('@prisma/client'), false);
  assert.equal(pageSource.includes('prisma.'), false);
  assert.equal(pageSource.includes('executePaymentOperationAdapter'), false);
  assert.equal(pageSource.includes('https://api.stripe.com'), false);
  assert.equal(pageSource.includes('https://www.zarinpal.com'), false);
}

export async function runPaymentOperationProviderEvidencePacketTests() {
  const readinessSource = source('lib/checkout/payment-operation-provider-readiness.ts');
  const migrationEvidenceSource = source('lib/checkout/payment-operation-migration-evidence.ts');
  const phase33Docs = source('docs/production-roadmap-phase33-payment-operations.md');
  const migrationEvidenceDocs = source('docs/production-roadmap-phase33-payment-operation-migration-validation-evidence.md');
  const goNoGoChecklist = source('docs/production-roadmap-phase33-refund-void-go-no-go-checklist.md');
  const providerEvidenceExample = source('docs/production-roadmap-phase33-provider-readiness-evidence-example.md');

  const partialStripe = validatePaymentOperationProviderEvidencePacket({
    provider: 'stripe',
    endpointMappingConfirmed: true,
    liveValidationConfirmed: true
  });
  assert.equal(partialStripe.provider, 'stripe');
  assert.equal(partialStripe.complete, false);
  assert.equal(partialStripe.executionEnabled, false);
  assert.ok(partialStripe.missing.includes('credential_evidence_missing'));
  assert.ok(partialStripe.missing.includes('idempotency_evidence_missing'));
  assert.ok(partialStripe.missing.includes('response_example_evidence_missing'));
  assert.ok(partialStripe.missing.includes('dashboard_evidence_missing'));

  const completeZarinpal = validatePaymentOperationProviderEvidencePacket({
    provider: 'zarin-pal',
    endpointMappingConfirmed: true,
    liveValidationConfirmed: true,
    credentialEvidenceCaptured: true,
    idempotencyEvidenceCaptured: true,
    responseExampleCaptured: true,
    dashboardEvidenceCaptured: true
  });
  assert.equal(completeZarinpal.provider, 'zarinpal');
  assert.equal(completeZarinpal.complete, true);
  assert.equal(completeZarinpal.executionEnabled, false);
  assert.deepEqual(completeZarinpal.missing, []);

  const manual = validatePaymentOperationProviderEvidencePacket({ provider: 'manual' });
  assert.equal(manual.complete, false);
  assert.equal(manual.executionEnabled, false);
  assert.ok(manual.warnings.includes('manual_provider_requires_operator_review'));

  const unknown = validatePaymentOperationProviderEvidencePacket({ provider: 'not-real' });
  assert.equal(unknown.provider, 'unknown');
  assert.equal(unknown.complete, false);
  assert.equal(unknown.executionEnabled, false);
  assert.ok(unknown.missing.includes('provider_operation_adapter_unavailable'));

  const blankMigrationSha = validatePaymentOperationMigrationEvidence({ deployedSha: '   ' });
  assert.equal(blankMigrationSha.complete, false);
  assert.equal(blankMigrationSha.executionEnabled, false);
  assert.ok(blankMigrationSha.missing.includes('deployed_sha_missing'));
  assert.equal(blankMigrationSha.checks.find((check) => check.key === 'deployed_sha_missing')?.status, 'missing');

  const partialMigration = validatePaymentOperationMigrationEvidence({ deployedSha: '909eb871' });
  assert.equal(partialMigration.complete, false);
  assert.equal(partialMigration.executionEnabled, false);
  assert.ok(partialMigration.missing.includes('migration_application_missing'));
  assert.ok(partialMigration.missing.includes('operator_signoff_missing'));
  assert.equal(partialMigration.checks.find((check) => check.key === 'deployed_sha_missing')?.status, 'ready');
  assert.equal(partialMigration.checks.find((check) => check.key === 'operator_signoff_missing')?.status, 'missing');
  assert.equal(partialMigration.checks.length, 9);

  const completeMigration = validatePaymentOperationMigrationEvidence({
    deployedSha: '909eb871874be6565e258440edd845a1df9d6b3d',
    migrationApplied: true,
    tableVerified: true,
    foreignKeysVerified: true,
    idempotencyIndexVerified: true,
    lookupIndexesVerified: true,
    applicationReadAccessVerified: true,
    rollbackConfirmed: true,
    operatorSignoff: true
  });
  assert.equal(completeMigration.complete, true);
  assert.equal(completeMigration.executionEnabled, false);
  assert.deepEqual(completeMigration.missing, []);
  assert.ok(completeMigration.checks.every((check) => check.status === 'ready'));
  assert.ok(completeMigration.checks.every((check) => check.detail.endsWith('evidence is captured for operator review.')));
  assert.ok(completeMigration.warnings.includes('migration_evidence_complete_but_execution_still_disabled'));

  assert.ok(readinessSource.includes('validatePaymentOperationProviderEvidencePacket'));
  assert.ok(readinessSource.includes('credential_evidence_missing'));
  assert.ok(readinessSource.includes('idempotency_evidence_missing'));
  assert.ok(readinessSource.includes('response_example_evidence_missing'));
  assert.ok(readinessSource.includes('dashboard_evidence_missing'));
  assert.ok(readinessSource.includes('executionEnabled: false'));
  assertNoExecutionSurface(readinessSource);

  assert.ok(migrationEvidenceSource.includes('validatePaymentOperationMigrationEvidence'));
  assert.ok(migrationEvidenceSource.includes('migration_application_missing'));
  assert.ok(migrationEvidenceSource.includes('operator_signoff_missing'));
  assert.ok(migrationEvidenceSource.includes('deployed_sha_missing'));
  assert.ok(migrationEvidenceSource.includes('evidence is captured for operator review.'));
  assert.ok(migrationEvidenceSource.includes('evidence must be captured before migration confirmation is trusted.'));
  assert.ok(migrationEvidenceSource.includes('executionEnabled: false'));
  assertNoExecutionSurface(migrationEvidenceSource);

  assert.ok(phase33Docs.includes('provider evidence-packet validation helper'));
  assert.ok(phase33Docs.includes('migration evidence-completeness validation helper'));
  assert.ok(phase33Docs.includes('executionEnabled: false'));
  assert.ok(migrationEvidenceDocs.includes('Migration evidence completeness check'));
  assert.ok(migrationEvidenceDocs.includes('does not enable repository writes'));
  assert.ok(goNoGoChecklist.includes('evidence-packet validation'));
  assert.ok(providerEvidenceExample.includes('Evidence packet validation'));

  console.log('payment-operation-provider-evidence-packet.test.ts passed');
}
