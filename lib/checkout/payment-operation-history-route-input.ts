export type PaymentOperationHistoryRouteValidationError = {
  field: 'orderId' | 'limit';
  code: string;
  message: string;
};

export type PaymentOperationHistoryRouteInputOptions = {
  orderId?: string | null;
  limit?: number | string | null;
};

export type NormalizedPaymentOperationHistoryRouteInput =
  | {
      ok: true;
      orderId: string;
      limit: number;
      historyOptions: { orderId: string; limit: number };
    }
  | {
      ok: false;
      errors: PaymentOperationHistoryRouteValidationError[];
    };

function normalizeOrderId(value: string | null | undefined) {
  const orderId = typeof value === 'string' ? value.trim() : '';
  return orderId ? orderId : null;
}

function normalizeLimit(value: PaymentOperationHistoryRouteInputOptions['limit']) {
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

export function normalizePaymentOperationHistoryRouteInput(
  input: PaymentOperationHistoryRouteInputOptions
): NormalizedPaymentOperationHistoryRouteInput {
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
  if (errors.length > 0 || !orderId || limit.value === undefined) return { ok: false, errors };

  return {
    ok: true,
    orderId,
    limit: limit.value,
    historyOptions: { orderId, limit: limit.value }
  };
}
