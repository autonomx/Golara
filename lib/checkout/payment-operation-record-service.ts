import 'server-only';

import { recordPaymentOperationAuditEvent } from './payment-operation-audit';
import {
  getPaymentOperationRecordsMigrationStatus,
  type PaymentOperationRecordsMigrationStatus
} from './payment-operation-migration-status';
import {
  createPendingPaymentOperationRecord,
  listPaymentOperationRecordsForOrder,
  markPaymentOperationRecordFailed,
  markPaymentOperationRecordSubmitted,
  markPaymentOperationRecordSucceeded,
  type CreatePendingPaymentOperationRecordInput,
  type CreatePendingPaymentOperationRecordResult,
  type MarkPaymentOperationFailedInput,
  type MarkPaymentOperationSubmittedInput,
  type MarkPaymentOperationSucceededInput,
  type PaymentOperationRecordRow,
  type PaymentOperationRecordTransitionResult
} from './payment-operation-record-repository';

export type PaymentOperationRecordServiceUnavailableResult = {
  status: 'migration_unconfirmed';
  migrationStatus: PaymentOperationRecordsMigrationStatus;
};

export type CreatePendingPaymentOperationServiceResult =
  | CreatePendingPaymentOperationRecordResult
  | PaymentOperationRecordServiceUnavailableResult;

export type PaymentOperationTransitionServiceResult =
  | PaymentOperationRecordTransitionResult
  | PaymentOperationRecordServiceUnavailableResult;

export type ListPaymentOperationRecordsForOrderServiceResult =
  | { status: 'ok'; records: PaymentOperationRecordRow[] }
  | PaymentOperationRecordServiceUnavailableResult;

function auditMetadata(input: CreatePendingPaymentOperationRecordInput) {
  return {
    orderNumber: input.orderNumber ?? null,
    originalPaymentAmountCents: input.originalPaymentAmountCents ?? null,
    originalPaymentCurrency: input.originalPaymentCurrency ?? null,
    previewDecision: input.previewDecision,
    previewReasonCount: input.previewReasons.length
  };
}

function transitionAuditMetadata(input: MarkPaymentOperationSubmittedInput | MarkPaymentOperationSucceededInput | MarkPaymentOperationFailedInput) {
  return {
    providerOperationReference: input.providerOperationReference ?? null,
    providerStatus: input.providerStatus ?? null,
    errorCategory: 'errorCategory' in input ? input.errorCategory ?? null : null,
    retryable: 'retryable' in input ? input.retryable ?? false : false,
    transitionMetadata: input.metadata ?? {}
  };
}

function migrationGate(env: Record<string, string | undefined>) {
  const migrationStatus = getPaymentOperationRecordsMigrationStatus(env);
  return migrationStatus.confirmed ? null : { status: 'migration_unconfirmed' as const, migrationStatus };
}

async function auditRecordTransition(
  kind: 'record_submitted' | 'record_succeeded' | 'record_failed',
  record: PaymentOperationRecordRow,
  metadata: Record<string, unknown>
) {
  await recordPaymentOperationAuditEvent({
    kind,
    orderId: record.orderId,
    paymentAttemptId: record.paymentAttemptId,
    paymentOperationRecordId: record.id,
    idempotencyKey: record.idempotencyKey,
    operationKind: record.operationKind,
    provider: record.provider,
    requestedAmountCents: record.requestedAmountCents,
    currency: record.currency,
    previewDecision: record.previewDecision,
    previewReasons: record.previewReasons,
    operatorReason: record.operatorReason,
    metadata
  });
}

export async function createPendingPaymentOperationRecordIfConfirmed(
  input: CreatePendingPaymentOperationRecordInput,
  env: Record<string, string | undefined> = process.env
): Promise<CreatePendingPaymentOperationServiceResult> {
  const blocked = migrationGate(env);
  if (blocked) return blocked;
  const result = await createPendingPaymentOperationRecord(input);

  if (result.status === 'created') {
    await recordPaymentOperationAuditEvent({
      kind: 'pending_record_created',
      orderId: result.record.orderId,
      paymentAttemptId: result.record.paymentAttemptId,
      paymentOperationRecordId: result.record.id,
      idempotencyKey: result.record.idempotencyKey,
      operationKind: result.record.operationKind,
      provider: result.record.provider,
      requestedAmountCents: result.record.requestedAmountCents,
      currency: result.record.currency,
      previewDecision: result.record.previewDecision,
      previewReasons: result.record.previewReasons,
      operatorReason: result.record.operatorReason,
      metadata: auditMetadata(input)
    });
  } else if (result.status === 'duplicate') {
    await recordPaymentOperationAuditEvent({
      kind: 'idempotency_duplicate_reused',
      orderId: result.record.orderId,
      paymentAttemptId: result.record.paymentAttemptId,
      paymentOperationRecordId: result.record.id,
      idempotencyKey: result.record.idempotencyKey,
      operationKind: result.record.operationKind,
      provider: result.record.provider,
      requestedAmountCents: result.record.requestedAmountCents,
      currency: result.record.currency,
      previewDecision: result.record.previewDecision,
      previewReasons: result.record.previewReasons,
      operatorReason: result.record.operatorReason,
      metadata: auditMetadata(input)
    });
  } else if (result.status === 'conflict') {
    await recordPaymentOperationAuditEvent({
      kind: 'idempotency_conflict_blocked',
      orderId: result.record.orderId,
      paymentAttemptId: result.record.paymentAttemptId,
      paymentOperationRecordId: result.record.id,
      idempotencyKey: result.record.idempotencyKey,
      operationKind: input.operationKind,
      provider: input.provider,
      requestedAmountCents: input.requestedAmountCents,
      currency: input.currency,
      previewDecision: input.previewDecision,
      previewReasons: input.previewReasons,
      conflicts: result.conflicts,
      operatorReason: input.operatorReason,
      metadata: auditMetadata(input)
    });
  }

  return result;
}

export async function markPaymentOperationRecordSubmittedIfConfirmed(
  input: MarkPaymentOperationSubmittedInput,
  env: Record<string, string | undefined> = process.env
): Promise<PaymentOperationTransitionServiceResult> {
  const blocked = migrationGate(env);
  if (blocked) return blocked;
  const result = await markPaymentOperationRecordSubmitted(input);
  if (result.status === 'updated') {
    await auditRecordTransition('record_submitted', result.record, transitionAuditMetadata(input));
  }
  return result;
}

export async function markPaymentOperationRecordSucceededIfConfirmed(
  input: MarkPaymentOperationSucceededInput,
  env: Record<string, string | undefined> = process.env
): Promise<PaymentOperationTransitionServiceResult> {
  const blocked = migrationGate(env);
  if (blocked) return blocked;
  const result = await markPaymentOperationRecordSucceeded(input);
  if (result.status === 'updated') {
    await auditRecordTransition('record_succeeded', result.record, transitionAuditMetadata(input));
  }
  return result;
}

export async function markPaymentOperationRecordFailedIfConfirmed(
  input: MarkPaymentOperationFailedInput,
  env: Record<string, string | undefined> = process.env
): Promise<PaymentOperationTransitionServiceResult> {
  const blocked = migrationGate(env);
  if (blocked) return blocked;
  const result = await markPaymentOperationRecordFailed(input);
  if (result.status === 'updated') {
    await auditRecordTransition('record_failed', result.record, transitionAuditMetadata(input));
  }
  return result;
}

export async function listPaymentOperationRecordsForOrderIfConfirmed(
  orderId: string,
  limit = 25,
  env: Record<string, string | undefined> = process.env
): Promise<ListPaymentOperationRecordsForOrderServiceResult> {
  const blocked = migrationGate(env);
  if (blocked) return blocked;
  return { status: 'ok', records: await listPaymentOperationRecordsForOrder(orderId, limit) };
}

export const paymentOperationRecordService = {
  createPending: createPendingPaymentOperationRecordIfConfirmed,
  markSubmitted: markPaymentOperationRecordSubmittedIfConfirmed,
  markSucceeded: markPaymentOperationRecordSucceededIfConfirmed,
  markFailed: markPaymentOperationRecordFailedIfConfirmed,
  listForOrder: listPaymentOperationRecordsForOrderIfConfirmed
};
