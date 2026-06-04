import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  getPaymentOperationRecordsMigrationStatus,
  isPaymentOperationRecordsMigrationConfirmed,
  PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED_ENV,
  PAYMENT_OPERATION_RECORDS_MIGRATION_EVIDENCE_PATH,
  PAYMENT_OPERATION_RECORDS_MIGRATION_PATH
} from '../../lib/checkout/payment-operation-migration-status';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentOperationMigrationStatusTests() {
  assert.equal(isPaymentOperationRecordsMigrationConfirmed({}), false);
  assert.equal(isPaymentOperationRecordsMigrationConfirmed({ [PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED_ENV]: 'false' }), false);
  assert.equal(isPaymentOperationRecordsMigrationConfirmed({ [PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED_ENV]: ' TRUE ' }), true);

  const pending = getPaymentOperationRecordsMigrationStatus({});
  assert.equal(pending.confirmed, false);
  assert.equal(pending.flagName, PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED_ENV);
  assert.equal(pending.rawValue, '');
  assert.equal(pending.migrationPath, PAYMENT_OPERATION_RECORDS_MIGRATION_PATH);
  assert.equal(pending.evidencePath, PAYMENT_OPERATION_RECORDS_MIGRATION_EVIDENCE_PATH);
  assert.match(pending.summary, /not operator-confirmed/);
  assert.ok(pending.requiredBefore.includes('idempotent PaymentOperationRecord repository/service writes'));
  assert.ok(pending.requiredBefore.includes('provider refund or void execution adapters'));
  assert.ok(pending.requiredBefore.includes('inventory or capacity release based on refund or void success'));
  assert.ok(pending.warnings.some((warning) => warning.includes(PAYMENT_OPERATION_RECORDS_MIGRATION_PATH)));
  assert.ok(pending.warnings.some((warning) => warning.includes(PAYMENT_OPERATION_RECORDS_MIGRATION_EVIDENCE_PATH)));
  assert.ok(pending.warnings.some((warning) => warning.includes(PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED_ENV)));

  const confirmed = getPaymentOperationRecordsMigrationStatus({ [PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED_ENV]: 'true' });
  assert.equal(confirmed.confirmed, true);
  assert.equal(confirmed.rawValue, 'true');
  assert.match(confirmed.summary, /operator-confirmed/);
  assert.deepEqual(confirmed.warnings, []);

  const helper = source('lib/checkout/payment-operation-migration-status.ts');
  assert.equal(helper.includes('@prisma/client'), false);
  assert.equal(helper.includes('fetch('), false);
  assert.equal(helper.includes('stripe'), false);
  assert.equal(helper.includes('zarinpal'), false);
  assert.equal(helper.includes('CheckoutOrder'), false);
  assert.equal(helper.includes('CheckoutPaymentAttempt'), false);
  assert.equal(helper.includes('create('), false);
  assert.equal(helper.includes('update('), false);
  assert.equal(helper.includes('delete('), false);

  console.log('payment-operation-migration-status.test.ts passed');
}
