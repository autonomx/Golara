import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  createPendingPaymentOperationRecord,
  findPaymentOperationRecordByIdempotencyKey,
  listPaymentOperationRecordsForOrder,
  markPaymentOperationRecordFailed,
  markPaymentOperationRecordSubmitted,
  markPaymentOperationRecordSucceeded,
  paymentOperationRecordRepository
} from '../../lib/checkout/payment-operation-record-repository';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentOperationRecordRepositoryTests() {
  const repositorySource = source('lib/checkout/payment-operation-record-repository.ts');
  const migrationSource = source('prisma/migrations/20260604200000_add_payment_operation_records/migration.sql');

  const unavailableCreate = await createPendingPaymentOperationRecord({
    orderId: 'order_123',
    paymentAttemptId: 'attempt_123',
    orderNumber: ' G-1001 ',
    operationKind: ' Refund ',
    requestedAmountCents: 1500,
    currency: ' usd ',
    originalPaymentAmountCents: 2500,
    originalPaymentCurrency: ' usd ',
    provider: ' Stripe ',
    providerReference: ' pi_123 ',
    idempotencyKey: ' payment-operation:op_123 ',
    operatorId: ' admin_123 ',
    operatorLabel: ' Store Admin ',
    operatorEmail: ' admin@example.com ',
    operatorReason: ' Customer request ',
    previewDecision: 'allowed',
    previewReasons: ['within amount'],
    transitionPlan: { kind: 'refund' },
    metadata: { source: 'unit' }
  });
  assert.deepEqual(unavailableCreate, { status: 'unavailable', reason: 'database_unavailable' });

  const emptyIdempotencyLookup = await findPaymentOperationRecordByIdempotencyKey(' payment-operation:op_123 ');
  assert.equal(emptyIdempotencyLookup, null);

  assert.deepEqual(await markPaymentOperationRecordSubmitted({
    id: 'op_123',
    providerOperationReference: ' re_123 ',
    providerStatus: ' submitted ',
    metadata: { provider: 'stripe' }
  }), { status: 'unavailable', reason: 'database_unavailable' });

  assert.deepEqual(await markPaymentOperationRecordSucceeded({
    id: 'op_123',
    providerOperationReference: ' re_123 ',
    providerStatus: ' succeeded ',
    metadata: { provider: 'stripe' }
  }), { status: 'unavailable', reason: 'database_unavailable' });

  assert.deepEqual(await markPaymentOperationRecordFailed({
    id: 'op_123',
    providerOperationReference: ' re_123 ',
    providerStatus: ' failed ',
    errorCategory: ' provider_rejected_operation ',
    retryable: true,
    metadata: { provider: 'stripe' }
  }), { status: 'unavailable', reason: 'database_unavailable' });

  assert.deepEqual(await listPaymentOperationRecordsForOrder('order_123', 250), []);

  assert.equal(paymentOperationRecordRepository.createPending, createPendingPaymentOperationRecord);
  assert.equal(paymentOperationRecordRepository.findByIdempotencyKey, findPaymentOperationRecordByIdempotencyKey);
  assert.equal(paymentOperationRecordRepository.markSubmitted, markPaymentOperationRecordSubmitted);
  assert.equal(paymentOperationRecordRepository.markSucceeded, markPaymentOperationRecordSucceeded);
  assert.equal(paymentOperationRecordRepository.markFailed, markPaymentOperationRecordFailed);
  assert.equal(paymentOperationRecordRepository.listForOrder, listPaymentOperationRecordsForOrder);

  for (const marker of [
    'idempotency_key_required',
    'idempotency_lookup_failed',
    'database_unavailable',
    'ON CONFLICT ("idempotencyKey") DO NOTHING',
    'status" IN (\'pending\', \'manual_review\')',
    'status" IN (\'pending\', \'submitted\', \'manual_review\')',
    'Math.max(1, Math.min(limit, 100))'
  ]) {
    assert.ok(repositorySource.includes(marker), `repository source must include ${marker}`);
  }

  for (const marker of [
    'CREATE TABLE IF NOT EXISTS "PaymentOperationRecord"',
    '"idempotencyKey" TEXT NOT NULL',
    'PaymentOperationRecord_idempotencyKey_key',
    'PaymentOperationRecord_orderId_idx',
    'PaymentOperationRecord_paymentAttemptId_idx'
  ]) {
    assert.ok(migrationSource.includes(marker), `payment operation record migration must include ${marker}`);
  }

  assert.equal(repositorySource.includes('fetch('), false);
  assert.equal(repositorySource.includes('https://api.stripe.com'), false);
  assert.equal(repositorySource.includes('https://www.zarinpal.com'), false);
  assert.equal(repositorySource.includes('CheckoutOrder" SET'), false);
  assert.equal(repositorySource.includes('CheckoutPaymentAttempt" SET'), false);

  console.log('payment-operation-record-repository.test.ts passed');
}
