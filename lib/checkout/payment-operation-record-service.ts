import 'server-only';

import { executePaymentOperationAdapter, type PaymentOperationAdapter, type PaymentOperationAdapterInput, type PaymentOperationAdapterProvider, type PaymentOperationAdapterResult } from './payment-operation-adapters';
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

export type ExecutePaymentOperationRecordServiceResult =
  | PaymentOperationRecordServiceUnavailableResult
  | { status: 'blocked'; reason: string; record: PaymentOperationRecordRow }
  | { status: 'manual_review'; record: PaymentOperationRecordRow; adapterResult: PaymentOperationAdapterResult }
  | { status: 'failed'; record: PaymentOperationRecordRow; adapterResult: PaymentOperationAdapterResult }
  | { status: 'succeeded'; record: PaymentOperationRecordRow; adapterResult: PaymentOperationAdapterResult };

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

function operationKind(record: PaymentOperationRecordRow) {
  return record.operationKind === 'refund' || record.operationKind === 'void' ? record.operationKind : null;
}

function recordIsExecutable(record: PaymentOperationRecordRow) {
  if (record.status !== 'pending' && record.status !== 'manual_review') return `record_status_${record.status}_not_executable`;
  if (record.previewDecision !== 'ready' && record.previewDecision !== 'manual_review') return `preview_decision_${record.previewDecision}_not_executable`;
  if (!operationKind(record)) return 'operation_kind_not_supported';
  return null;
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

function adapterInput(record: PaymentOperationRecordRow): PaymentOperationAdapterInput | null {
  const kind = operationKind(record);
  if (!kind) return null;
  return {
    operationKind: kind,
    paymentOperationRecordId: record.id,
    orderId: record.orderId,
    paymentAttemptId: record.paymentAttemptId,
    amountCents: record.requestedAmountCents,
    currency: record.currency,
    providerReference: record.providerReference,
    idempotencyKey: record.idempotencyKey,
    reason: record.operatorReason,
    metadata: {
      orderNumber: record.orderNumber,
      previewDecision: record.previewDecision
    }
  };
}

function adapterMetadata(result: PaymentOperationAdapterResult) {
  return {
    adapterProvider: result.provider,
    adapterStatus: result.status,
    adapterMessage: result.message,
    adapterMetadata: result.metadata
  };
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

export async function executePaymentOperationRecordIfConfirmed(
  record: PaymentOperationRecordRow,
  options: {
    adapters?: Record<PaymentOperationAdapterProvider, PaymentOperationAdapter>;
    env?: Record<string, string | undefined>;
  } = {}
): Promise<ExecutePaymentOperationRecordServiceResult> {
  const blocked = migrationGate(options.env ?? process.env);
  if (blocked) return blocked;

  const blockedReason = recordIsExecutable(record);
  if (blockedReason) return { status: 'blocked', reason: blockedReason, record };

  const operation = adapterInput(record);
  if (!operation) return { status: 'blocked', reason: 'operation_kind_not_supported', record };

  const submitted = await markPaymentOperationRecordSubmittedIfConfirmed(
    {
      id: record.id,
      providerOperationReference: record.providerOperationReference,
      providerStatus: 'submitted_for_provider_operation',
      metadata: { orchestration: 'payment_operation_record_service' }
    },
    options.env ?? process.env
  );
  if (submitted.status !== 'updated') return { status: 'blocked', reason: `submit_transition_${submitted.status}`, record };

  const adapterResult = await executePaymentOperationAdapter({ provider: record.provider, operation, adapters: options.adapters });
  if (adapterResult.status === 'manual_review') return { status: 'manual_review', record: submitted.record, adapterResult };

  if (adapterResult.status === 'succeeded') {
    const succeeded = await markPaymentOperationRecordSucceededIfConfirmed(
      {
        id: submitted.record.id,
        providerOperationReference: adapterResult.providerOperationReference,
        providerStatus: adapterResult.providerStatus,
        metadata: adapterMetadata(adapterResult)
      },
      options.env ?? process.env
    );
    return succeeded.status === 'updated'
      ? { status: 'succeeded', record: succeeded.record, adapterResult }
      : { status: 'blocked', reason: `success_transition_${succeeded.status}`, record: submitted.record };
  }

  const failed = await markPaymentOperationRecordFailedIfConfirmed(
    {
      id: submitted.record.id,
      providerOperationReference: adapterResult.providerOperationReference,
      providerStatus: adapterResult.providerStatus,
      errorCategory: adapterResult.errorCategory ?? adapterResult.status,
      retryable: adapterResult.retryable,
      metadata: adapterMetadata(adapterResult)
    },
    options.env ?? process.env
  );
  return failed.status === 'updated'
    ? { status: 'failed', record: failed.record, adapterResult }
    : { status: 'blocked', reason: `failed_transition_${failed.status}`, record: submitted.record };
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
  executeRecord: executePaymentOperationRecordIfConfirmed,
  listForOrder: listPaymentOperationRecordsForOrderIfConfirmed
};
