import { normalizePaymentOperationPreviewInput, type PaymentOperationPreviewInputDraft, type PaymentOperationPreviewInputError } from '@/lib/checkout/payment-operation-preview-input';
import { buildPaymentOperationPreviewRouteResult, type PaymentOperationPreviewRouteResult } from '@/lib/checkout/payment-operation-preview-route-core';

export type PaymentOperationPreviewRequestResult =
  | PaymentOperationPreviewRouteResult
  | {
      status: 400;
      body: {
        ok: false;
        errors: PaymentOperationPreviewInputError[];
      };
    };

export function buildPaymentOperationPreviewRequestResult(draft: PaymentOperationPreviewInputDraft): PaymentOperationPreviewRequestResult {
  const normalized = normalizePaymentOperationPreviewInput(draft);
  if (!normalized.ok) {
    return {
      status: 400,
      body: {
        ok: false,
        errors: normalized.errors
      }
    };
  }

  return buildPaymentOperationPreviewRouteResult(normalized.input);
}
