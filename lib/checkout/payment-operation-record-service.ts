import 'server-only';

import {
  getPaymentOperationRecordsMigrationStatus,
  type PaymentOperationRecordsMigrationStatus
} from './payment-operation-migration-status';
import {
  createPendingPaymentOperationRecord,
  listPaymentOperationRecordsForOrder,
  type CreatePendingPaymentOperationRecordInput,
  type CreatePendingPaymentOperationRecordResult,
  type PaymentOperationRecordRow
} from './payment-operation-record-repository';

export type PaymentOperationRecordServiceUnavailableResult = {
  status: 'migration_unconfirmed';
  migrationStatus: PaymentOperationRecordsMigrationStatus;
};

export type CreatePendingPaymentOperationServiceResult =
  | CreatePendingPaymentOperationRecordResult
  | PaymentOperationRecordServiceUnavailableResult;

export type ListPaymentOperationRecordsForOrderServiceResult =
  | { status: 'ok'; records: PaymentOperationRecordRow[] }
  | PaymentOperationRecordServiceUnavailableResult;

export async function createPendingPaymentOperationRecordIfConfirmed(
  input: CreatePendingPaymentOperationRecordInput,
  env: Record<string, string | undefined> = process.env
): Promise<CreatePendingPaymentOperationServiceResult> {
  const migrationStatus = getPaymentOperationRecordsMigrationStatus(env);
  if (!migrationStatus.confirmed) return { status: 'migration_unconfirmed', migrationStatus };
  return createPendingPaymentOperationRecord(input);
}

export async function listPaymentOperationRecordsForOrderIfConfirmed(
  orderId: string,
  limit = 25,
  env: Record<string, string | undefined> = process.env
): Promise<ListPaymentOperationRecordsForOrderServiceResult> {
  const migrationStatus = getPaymentOperationRecordsMigrationStatus(env);
  if (!migrationStatus.confirmed) return { status: 'migration_unconfirmed', migrationStatus };
  return { status: 'ok', records: await listPaymentOperationRecordsForOrder(orderId, limit) };
}

export const paymentOperationRecordService = {
  createPending: createPendingPaymentOperationRecordIfConfirmed,
  listForOrder: listPaymentOperationRecordsForOrderIfConfirmed
};
