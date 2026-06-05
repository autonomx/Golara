import 'server-only';

import { buildPaymentOperationHistoryView, type PaymentOperationHistoryView } from './payment-operation-history-view';
import type { PaymentOperationRecordsMigrationStatus } from './payment-operation-migration-status';
import { listPaymentOperationRecordsForOrderIfConfirmed } from './payment-operation-record-service';

export type PaymentOperationHistoryRouteValidationError = {
  field: 'orderId' | 'limit';
  code: string;
  message: string;
};

export type PaymentOperationHistoryRouteInput = {
  orderId?: string | null;
  limit?: number | string | null;
  env?: Record<string, string | undefined>;
};

export type PaymentOperationHistoryRouteResult =
  | {
      status: 200;
      body: {
        ok: true;
        orderId: string;
        limit: number;
        recordCount: number;
        history: PaymentOperationHistoryView;
      };
    }
  | {
      status: 400;
      body: {
        ok: false;
        errors: PaymentOperationHistoryRouteValidationError[];
      };
    }
  | {
      status: 503;
      body: {
        ok: false;
        code: 'payment_operation_records_migration_unconfirmed';
        message: string;
        orderId: string;
        limit: number;
        migrationStatus: PaymentOperationRecordsMigrationStatus;
        history: PaymentOperationHistoryView;
      };
    };

function normalizeOrderId(value: string | null | undefined) {
  const orderId = typeof value === 'string' ? value.trim() : '';
  return orderId ? orderId : null;
}

function normalizeLimit(value: PaymentOperationHistoryRouteInput['limit']) {
  if (value === undefined || value === null || value === '') return { value: 25 };
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(numeric) || numeric < 1) {
    return {
      error: {
        field: 'limit' as const,
        code: 'invalid_limit',
        message: 'Limit must be a positive integer.'
      }
    };
  }
  return { value: Math.min(numeric, 100) };
}

export async function buildPaymentOperationHistoryRouteResult(
  input: PaymentOperationHistoryRouteInput
): Promise<PaymentOperationHistoryRouteResult> {
  const errors: PaymentOperationHistoryRouteValidationError[] = [];
  const orderId = normalizeOrderId(input.orderId);
  const limit = normalizeLimit(input.limit);

  if (!orderId) {
    errors.push({
      field: 'orderId',
      code: 'required',
      message: 'Order ID is required to read payment operation history.'
    });
  }
  if (limit.error) errors.push(limit.error);
  if (errors.length > 0 || !orderId || limit.value === undefined) return { status: 400, body: { ok: false, errors } };

  const historyOptions = { orderId, limit: limit.value };
  const serviceResult = await listPaymentOperationRecordsForOrderIfConfirmed(orderId, limit.value, input.env ?? process.env);
  if (serviceResult.status === 'migration_unconfirmed') {
    return {
      status: 503,
      body: {
        ok: false,
        code: 'payment_operation_records_migration_unconfirmed',
        message: 'Payment operation records are unavailable until the target environment migration is operator-confirmed.',
        orderId,
        limit: limit.value,
        migrationStatus: serviceResult.migrationStatus,
        history: buildPaymentOperationHistoryView([], historyOptions)
      }
    };
  }

  return {
    status: 200,
    body: {
      ok: true,
      orderId,
      limit: limit.value,
      recordCount: serviceResult.records.length,
      history: buildPaymentOperationHistoryView(serviceResult.records, historyOptions)
    }
  };
}
