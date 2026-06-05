import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { validatePaymentOperationMigrationEvidence } from '../../lib/checkout/payment-operation-migration-evidence';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function assertNoRuntimeAccess(fileSource: string) {
  assert.equal(fileSource.includes('fetch('), false);
  assert.equal(fileSource.includes('@prisma/client'), false);
  assert.equal(fileSource.includes('prisma.'), false);
  assert.equal(fileSource.includes('executePaymentOperationAdapter'), false);
  assert.equal(fileSource.includes('https://api.stripe.com'), false);
  assert.equal(fileSource.includes('https://www.zarinpal.com'), false);
}

export async function runPaymentOperationMigrationEvidenceTests() {
  const helper = source('lib/checkout/payment-operation-migration-evidence.ts');
  const evidenceDocs = source('docs/production-roadmap-phase33-payment-operation-migration-validation-evidence.md');
  const phase33Docs = source('docs/production-roadmap-phase33-payment-operations.md');

  const partial = validatePaymentOperationMigrationEvidence({ deployedSha: '909eb871' });
  assert.equal(partial.complete, false);
  assert.equal(partial.executionEnabled, false);
  assert.ok(partial.missing.includes('migration_application_missing'));
  assert.ok(partial.missing.includes('operator_signoff_missing'));
  assert.ok(partial.warnings.includes('migration_evidence_incomplete'));

  const complete = validatePaymentOperationMigrationEvidence({
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
  assert.equal(complete.complete, true);
  assert.equal(complete.executionEnabled, false);
  assert.deepEqual(complete.missing, []);
  assert.ok(complete.warnings.includes('migration_evidence_complete_but_execution_still_disabled'));

  assert.ok(helper.includes('validatePaymentOperationMigrationEvidence'));
  assert.ok(helper.includes('migration_application_missing'));
  assert.ok(helper.includes('operator_signoff_missing'));
  assert.ok(helper.includes('executionEnabled: false'));
  assertNoRuntimeAccess(helper);

  assert.ok(evidenceDocs.includes('Migration evidence completeness check'));
  assert.ok(evidenceDocs.includes('does not enable repository writes'));
  assert.ok(evidenceDocs.includes('does not enable live refund/void execution'));
  assert.ok(phase33Docs.includes('migration evidence-completeness validation helper'));
  assert.ok(phase33Docs.includes('executionEnabled: false'));

  console.log('payment-operation-migration-evidence.test.ts passed');
}
