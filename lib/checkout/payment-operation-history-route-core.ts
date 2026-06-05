import 'server-only';

import {
  normalizePaymentOperationHistoryRouteInput,
  type PaymentOperationHistoryRouteInputOptions,
  type PaymentOperationHistoryRouteValidationError
} from './payment-operation-history-route-input';
import { buildPaymentOperationHistoryView, type PaymentOperationHistoryView } from './payment-operation-history-view';
import type { PaymentOperationRecordsMigrationStatus } from './payment-operation-migration-status';
import { listPaymentOperationRecordsForOrderIfConfirmed } from './payment-operation-record-service';

export type { PaymentOperationHistoryRouteValidationError } from './payment-operation-history-route-input';

export type PaymentOperationHistoryRouteInput = PaymentOperationHistoryRouteInputOptions & {
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

export async function buildPaymentOperationHistoryRouteResult(
  input: PaymentOperationHistoryRouteInput
): Promise<PaymentOperationHistoryRouteResult> {
  const normalized = normalizePaymentOperationHistoryRouteInput(input);
  if (!normalized.ok) return { status: 400, body: { ok: false, errors: normalized.errors } };

  const serviceResult = await listPaymentOperationRecordsForOrderIfConfirmed(
    normalized.orderId,
    normalized.limit,
    input.env ?? process.env
  );
  if (serviceResult.status === 'migration_unconfirmed') {
    return {
      status: 503,
      body: {
        ok: false,
        code: 'payment_operation_records_migration_unconfirmed',
        message: 'Payment operation records are unavailable until the target environment migration is operator-confirmed.',
        orderId: normalized.orderId,
        limit: normalized.limit,
        migrationStatus: serviceResult.migrationStatus,
        history: buildPaymentOperationHistoryView([], normalized.historyOptions)
      }
    };
  }

  return {
    status: 200,
    body: {
      ok: true,
      orderId: normalized.orderId,
      limit: normalized.limit,
      recordCount: serviceResult.records.length,
      history: buildPaymentOperationHistoryView(serviceResult.records, normalized.historyOptions)
    }
  };
}
