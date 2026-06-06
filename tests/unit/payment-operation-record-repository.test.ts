import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { buildPaymentOperationAuditLogInput } from '../../lib/checkout/payment-operation-audit';
import {
  createPendingPaymentOperationRecord,
  findPaymentOperationRecordByIdempotencyKey,
  listPaymentOperationRecordsForOrder,
  markPaymentOperationRecordFailed,
  markPaymentOperationRecordSubmitted,
  markPaymentOperationRecordSucceeded,
  paymentOperationRecordRepository,
  type PaymentOperationRecordRow
} from '../../lib/checkout/payment-operation-record-repository';
import {
  createPendingPaymentOperationRecordIfConfirmed,
  executePaymentOperationRecordIfConfirmed,
  listPaymentOperationRecordsForOrderIfConfirmed,
  markPaymentOperationRecordFailedIfConfirmed,
  markPaymentOperationRecordSubmittedIfConfirmed,
  markPaymentOperationRecordSucceededIfConfirmed,
  paymentOperationRecordService
} from '../../lib/checkout/payment-operation-record-service';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function paymentOperationRecord(overrides: Partial<PaymentOperationRecordRow> = {}): PaymentOperationRecordRow {
  const now = new Date('2026-06-04T20:00:00.000Z');
  return {
    id: 'op_123',
    orderId: 'order_123',
    paymentAttemptId: 'attempt_123',
    orderNumber: 'G-1001',
    operationKind: 'refund',
    requestedAmountCents: 1500,
    currency: 'USD',
    originalPaymentAmountCents: 2500,
    originalPaymentCurrency: 'USD',
    provider: 'stripe',
    providerReference: 'pi_123',
    idempotencyKey: 'payment-operation:op_123',
    operatorId: 'admin_123',
    operatorLabel: 'Store Admin',
    operatorEmail: 'admin@example.com',
    operatorReason: 'Customer request',
    previewDecision: 'ready',
    previewReasons: ['within captured amount'],
    status: 'pending',
    providerOperationReference: 're_123',
    providerStatus: null,
    errorCategory: null,
    retryable: false,
    transitionPlan: { kind: 'refund' },
    metadata: { source: 'unit' },
    submittedAt: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

export async function runPaymentOperationRecordRepositoryTests() {
  const repositorySource = source('lib/checkout/payment-operation-record-repository.ts');
  const serviceSource = source('lib/checkout/payment-operation-record-service.ts');
  const migrationSource = source('prisma/migrations/20260604200000_add_payment_operation_records/migration.sql');
  const confirmedEnv = { PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED: ' true ' };

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

  const audit = buildPaymentOperationAuditLogInput({
    kind: 'idempotency_conflict_blocked',
    orderId: ' order_123 ',
    paymentAttemptId: ' attempt_123 ',
    paymentOperationRecordId: ' op_123 ',
    idempotencyKey: ' payment-operation:op_123 ',
    operationKind: ' Refund ',
    provider: ' Stripe ',
    requestedAmountCents: 1500,
    currency: ' usd ',
    previewDecision: ' manual_review ',
    previewReasons: [' allowed ', '', ' operator review '],
    conflicts: [' amount ', '', ' provider '],
    operatorReason: ' Customer request ',
    metadata: {
      nested: { keep: true, drop: undefined, values: [' ok ', undefined, null] },
      count: 2,
      empty: undefined
    }
  });
  assert.equal(audit.action, 'payment_operation.record.idempotency_conflict_blocked');
  assert.equal(audit.entity, 'paymentOperation');
  assert.equal(audit.entityId, 'op_123');
  assert.equal(audit.summary, 'Payment operation idempotency conflict blocked');
  assert.deepEqual(audit.metadata, {
    nested: { keep: true, values: [' ok '] },
    count: 2,
    kind: 'idempotency_conflict_blocked',
    operationKind: 'refund',
    provider: 'stripe',
    requestedAmountCents: 1500,
    currency: 'USD',
    previewReasons: ['allowed', 'operator review'],
    conflicts: ['amount', 'provider'],
    orderId: 'order_123',
    paymentAttemptId: 'attempt_123',
    paymentOperationRecordId: 'op_123',
    idempotencyKey: 'payment-operation:op_123',
    previewDecision: 'manual_review',
    operatorReason: 'Customer request'
  });

  const fallbackEntityAudit = buildPaymentOperationAuditLogInput({
    kind: 'record_failed',
    orderId: ' order_456 ',
    paymentAttemptId: ' attempt_456 ',
    operationKind: ' Void ',
    provider: ' ZarinPal ',
    requestedAmountCents: 0,
    currency: ' irr ',
    metadata: { dropped: undefined, bool: false }
  });
  assert.equal(fallbackEntityAudit.action, 'payment_operation.record.failed');
  assert.equal(fallbackEntityAudit.entityId, 'order_456');
  assert.equal(fallbackEntityAudit.metadata.currency, 'IRR');
  assert.deepEqual(fallbackEntityAudit.metadata.previewReasons, []);
  assert.deepEqual(fallbackEntityAudit.metadata.conflicts, []);
  assert.equal((fallbackEntityAudit.metadata as Record<string, unknown>).dropped, undefined);
  assert.equal((fallbackEntityAudit.metadata as Record<string, unknown>).bool, false);

  assert.equal(paymentOperationRecordService.createPending, createPendingPaymentOperationRecordIfConfirmed);
  assert.equal(paymentOperationRecordService.markSubmitted, markPaymentOperationRecordSubmittedIfConfirmed);
  assert.equal(paymentOperationRecordService.markSucceeded, markPaymentOperationRecordSucceededIfConfirmed);
  assert.equal(paymentOperationRecordService.markFailed, markPaymentOperationRecordFailedIfConfirmed);
  assert.equal(paymentOperationRecordService.executeRecord, executePaymentOperationRecordIfConfirmed);
  assert.equal(paymentOperationRecordService.listForOrder, listPaymentOperationRecordsForOrderIfConfirmed);

  const blockedCreate = await createPendingPaymentOperationRecordIfConfirmed({
    orderId: 'order_123',
    paymentAttemptId: 'attempt_123',
    operationKind: 'refund',
    requestedAmountCents: 1500,
    currency: 'USD',
    provider: 'stripe',
    idempotencyKey: 'payment-operation:op_123',
    previewDecision: 'ready',
    previewReasons: []
  }, {});
  assert.equal(blockedCreate.status, 'migration_unconfirmed');
  assert.equal(blockedCreate.migrationStatus.confirmed, false);

  const confirmedCreate = await createPendingPaymentOperationRecordIfConfirmed({
    orderId: 'order_123',
    paymentAttemptId: 'attempt_123',
    operationKind: 'refund',
    requestedAmountCents: 1500,
    currency: 'USD',
    provider: 'stripe',
    idempotencyKey: 'payment-operation:op_123',
    previewDecision: 'ready',
    previewReasons: []
  }, confirmedEnv);
  assert.deepEqual(confirmedCreate, { status: 'unavailable', reason: 'database_unavailable' });

  assert.deepEqual(await markPaymentOperationRecordSubmittedIfConfirmed({
    id: 'op_123',
    providerOperationReference: 're_123',
    providerStatus: 'submitted',
    metadata: { orchestration: 'unit' }
  }, confirmedEnv), { status: 'unavailable', reason: 'database_unavailable' });

  assert.deepEqual(await markPaymentOperationRecordSucceededIfConfirmed({
    id: 'op_123',
    providerOperationReference: 're_123',
    providerStatus: 'succeeded',
    metadata: { orchestration: 'unit' }
  }, confirmedEnv), { status: 'unavailable', reason: 'database_unavailable' });

  assert.deepEqual(await markPaymentOperationRecordFailedIfConfirmed({
    id: 'op_123',
    providerOperationReference: 're_123',
    providerStatus: 'failed',
    errorCategory: 'provider_rejected_operation',
    retryable: true,
    metadata: { orchestration: 'unit' }
  }, confirmedEnv), { status: 'unavailable', reason: 'database_unavailable' });

  assert.deepEqual(await listPaymentOperationRecordsForOrderIfConfirmed('order_123', 10, confirmedEnv), { status: 'ok', records: [] });

  const blockedStatus = await executePaymentOperationRecordIfConfirmed(paymentOperationRecord({ status: 'succeeded' }), { env: confirmedEnv });
  assert.equal(blockedStatus.status, 'blocked');
  assert.equal(blockedStatus.reason, 'record_status_succeeded_not_executable');

  const blockedPreview = await executePaymentOperationRecordIfConfirmed(paymentOperationRecord({ previewDecision: 'denied' }), { env: confirmedEnv });
  assert.equal(blockedPreview.status, 'blocked');
  assert.equal(blockedPreview.reason, 'preview_decision_denied_not_executable');

  const blockedKind = await executePaymentOperationRecordIfConfirmed(paymentOperationRecord({ operationKind: 'capture' }), { env: confirmedEnv });
  assert.equal(blockedKind.status, 'blocked');
  assert.equal(blockedKind.reason, 'operation_kind_not_supported');

  const blockedSubmit = await executePaymentOperationRecordIfConfirmed(paymentOperationRecord(), { env: confirmedEnv });
  assert.equal(blockedSubmit.status, 'blocked');
  assert.equal(blockedSubmit.reason, 'submit_transition_unavailable');

  const blockedMigrationExecute = await executePaymentOperationRecordIfConfirmed(paymentOperationRecord(), { env: {} });
  assert.equal(blockedMigrationExecute.status, 'migration_unconfirmed');

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
    'pending_record_created',
    'idempotency_duplicate_reused',
    'idempotency_conflict_blocked',
    'record_status_${record.status}_not_executable',
    'preview_decision_${record.previewDecision}_not_executable',
    'submit_transition_${submitted.status}',
    'success_transition_${succeeded.status}',
    'failed_transition_${failed.status}'
  ]) {
    assert.ok(serviceSource.includes(marker), `service source must include ${marker}`);
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
  assert.equal(serviceSource.includes('fetch('), false);
  assert.equal(serviceSource.includes('https://api.stripe.com'), false);
  assert.equal(serviceSource.includes('https://www.zarinpal.com'), false);

  console.log('payment-operation-record-repository.test.ts passed');
}
