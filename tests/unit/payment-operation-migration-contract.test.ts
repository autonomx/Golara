import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentOperationMigrationContractTests() {
  const migration = source('prisma/migrations/20260604200000_add_payment_operation_records/migration.sql');
  const contract = source('docs/production-roadmap-phase33-payment-operation-migration-contract.md');
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

  assert.equal(schema.includes('model PaymentOperationRecord'), false);

  console.log('payment-operation-migration-contract.test.ts passed');
}
