import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentOperationMigrationContractTests() {
  const migration = source('prisma/migrations/20260604200000_add_payment_operation_records/migration.sql');
  const contract = source('docs/production-roadmap-phase33-payment-operation-migration-contract.md');
  const evidence = source('docs/production-roadmap-phase33-payment-operation-migration-validation-evidence.md');
  const repositoryDesign = source('docs/production-roadmap-phase33-payment-operation-repository-design.md');
  const statusHelper = source('lib/checkout/payment-operation-migration-status.ts');
  const repository = source('lib/checkout/payment-operation-record-repository.ts');
  const service = source('lib/checkout/payment-operation-record-service.ts');
  const audit = source('lib/checkout/payment-operation-audit.ts');
  const schema = source('prisma/schema.prisma');

  assert.ok(migration.includes('CREATE TABLE IF NOT EXISTS "PaymentOperationRecord"'));
  assert.ok(migration.includes('"orderId" TEXT NOT NULL'));
  assert.ok(migration.includes('"paymentAttemptId" TEXT NOT NULL'));
  assert.ok(migration.includes('"operationKind" TEXT NOT NULL'));
  assert.ok(migration.includes('"requestedAmountCents" INTEGER NOT NULL'));
  assert.ok(migration.includes('"idempotencyKey" TEXT NOT NULL'));
  assert.ok(migration.includes('"previewDecision" TEXT NOT NULL'));
  assert.ok(migration.includes('"previewReasons" TEXT[] NOT NULL'));
  assert.ok(migration.includes('"transitionPlan" JSONB NOT NULL'));
  assert.ok(migration.includes('REFERENCES "CheckoutOrder"("id")'));
  assert.ok(migration.includes('REFERENCES "CheckoutPaymentAttempt"("id")'));
  assert.ok(migration.includes('PaymentOperationRecord_idempotencyKey_key'));
  assert.ok(migration.includes('PaymentOperationRecord_orderId_idx'));
  assert.ok(migration.includes('PaymentOperationRecord_paymentAttemptId_idx'));
  assert.ok(migration.includes('PaymentOperationRecord_provider_status_idx'));
  assert.ok(migration.includes('PaymentOperationRecord_kind_status_idx'));

  assert.ok(contract.includes('Payment Operation Migration Contract'));
  assert.ok(contract.includes('repository-side schema groundwork only'));
  assert.ok(contract.includes('not currently represented as a Prisma model'));
  assert.ok(contract.includes('prisma generate'));
  assert.ok(contract.includes('unique idempotency index'));
  assert.ok(contract.includes('provider refund calls'));
  assert.ok(contract.includes('provider void calls'));
  assert.ok(contract.includes('admin execution buttons'));

  assert.ok(evidence.includes('Payment Operation Migration Validation Evidence Template'));
  assert.ok(evidence.includes('does not claim that staging or production validation has been completed'));
  assert.ok(evidence.includes('PaymentOperationRecord'));
  assert.ok(evidence.includes('Commit SHA deployed'));
  assert.ok(evidence.includes('Table verification evidence'));
  assert.ok(evidence.includes('Constraint and index evidence'));
  assert.ok(evidence.includes('Application read-access evidence'));
  assert.ok(evidence.includes('Execution boundary confirmation'));
  assert.ok(evidence.includes('No live provider refund calls were added or executed'));
  assert.ok(evidence.includes('No live provider void calls were added or executed'));
  assert.ok(evidence.includes('No repository/service writes were enabled by this evidence alone'));
  assert.ok(evidence.includes('No admin refund/void execution buttons were enabled by this evidence alone'));

  assert.ok(repositoryDesign.includes('Payment Operation Repository Design'));
  assert.ok(repositoryDesign.includes('createPendingPaymentOperationRecord'));
  assert.ok(repositoryDesign.includes('findPaymentOperationRecordByIdempotencyKey'));
  assert.ok(repositoryDesign.includes('Idempotent create-pending semantics'));
  assert.ok(repositoryDesign.includes('duplicate idempotency reuse'));
  assert.ok(repositoryDesign.includes('idempotency conflict blocking'));
  assert.ok(repositoryDesign.includes('audit writes should be coupled at the service layer'));
  assert.ok(repositoryDesign.includes('This design does not approve execution'));
  assert.ok(repositoryDesign.includes('live Stripe refund calls'));
  assert.ok(repositoryDesign.includes('admin refund/void execution controls'));

  assert.ok(statusHelper.includes('PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED'));
  assert.ok(statusHelper.includes('isPaymentOperationRecordsMigrationConfirmed'));
  assert.ok(statusHelper.includes('getPaymentOperationRecordsMigrationStatus'));
  assert.ok(statusHelper.includes('idempotent PaymentOperationRecord repository/service writes'));
  assert.ok(statusHelper.includes('provider refund or void execution adapters'));
  assert.ok(statusHelper.includes('inventory or capacity release based on refund or void success'));
  assert.equal(statusHelper.includes('@prisma/client'), false);
  assert.equal(statusHelper.includes('fetch('), false);
  assert.equal(statusHelper.includes('CheckoutOrder'), false);
  assert.equal(statusHelper.includes('CheckoutPaymentAttempt'), false);

  assert.ok(repository.includes('createPendingPaymentOperationRecord'));
  assert.ok(repository.includes('findPaymentOperationRecordByIdempotencyKey'));
  assert.ok(repository.includes('ON CONFLICT ("idempotencyKey") DO NOTHING'));
  assert.ok(repository.includes('idempotencyConflicts'));
  assert.ok(repository.includes('listPaymentOperationRecordsForOrder'));
  assert.equal(repository.includes('stripe'), false);
  assert.equal(repository.includes('zarinpal'), false);
  assert.equal(repository.includes('fetch('), false);
  assert.equal(repository.includes('CheckoutOrder" SET'), false);
  assert.equal(repository.includes('CheckoutPaymentAttempt" SET'), false);

  assert.ok(service.includes('getPaymentOperationRecordsMigrationStatus'));
  assert.ok(service.includes('migration_unconfirmed'));
  assert.ok(service.includes('createPendingPaymentOperationRecordIfConfirmed'));
  assert.ok(service.includes('listPaymentOperationRecordsForOrderIfConfirmed'));
  assert.ok(service.includes('auditRecordTransition'));
  assert.ok(service.includes("auditRecordTransition('record_submitted'"));
  assert.ok(service.includes("auditRecordTransition('record_succeeded'"));
  assert.ok(service.includes("auditRecordTransition('record_failed'"));
  assert.ok(service.includes('transitionAuditMetadata'));
  assert.ok(service.includes('providerOperationReference'));
  assert.ok(service.includes('errorCategory'));
  assert.ok(service.includes('retryable'));
  assert.equal(service.includes('stripe'), false);
  assert.equal(service.includes('zarinpal'), false);
  assert.equal(service.includes('fetch('), false);
  assert.equal(service.includes('@prisma/client'), false);

  assert.ok(audit.includes('PaymentOperationAuditKind'));
  assert.ok(audit.includes('preview_requested'));
  assert.ok(audit.includes('preview_blocked'));
  assert.ok(audit.includes('preview_manual_review'));
  assert.ok(audit.includes('pending_record_created'));
  assert.ok(audit.includes('idempotency_duplicate_reused'));
  assert.ok(audit.includes('idempotency_conflict_blocked'));
  assert.ok(audit.includes('record_submitted'));
  assert.ok(audit.includes('record_succeeded'));
  assert.ok(audit.includes('record_failed'));
  assert.ok(audit.includes('payment_operation.record.submitted'));
  assert.ok(audit.includes('payment_operation.record.succeeded'));
  assert.ok(audit.includes('payment_operation.record.failed'));
  assert.ok(audit.includes('buildPaymentOperationAuditLogInput'));
  assert.ok(audit.includes('recordPaymentOperationAuditEvent'));
  assert.ok(audit.includes('recordAdminAuditLog'));
  assert.equal(audit.includes('stripe'), false);
  assert.equal(audit.includes('zarinpal'), false);
  assert.equal(audit.includes('fetch('), false);
  assert.equal(audit.includes('CheckoutOrder" SET'), false);
  assert.equal(audit.includes('CheckoutPaymentAttempt" SET'), false);

  assert.equal(schema.includes('model PaymentOperationRecord'), false);

  console.log('payment-operation-migration-contract.test.ts passed');
}
