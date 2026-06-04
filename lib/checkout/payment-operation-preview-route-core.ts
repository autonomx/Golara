import { buildPaymentOperationPreviewView, type PaymentOperationPreviewView } from '@/lib/checkout/payment-operation-preview-view';
import type { PaymentOperationPreviewInput } from '@/lib/checkout/payment-operation-preview';

export type PaymentOperationPreviewRouteResult = {
  status: 200;
  body: {
    ok: true;
    preview: PaymentOperationPreviewView;
  };
};

export function buildPaymentOperationPreviewRouteResult(input: PaymentOperationPreviewInput): PaymentOperationPreviewRouteResult {
  return {
    status: 200,
    body: {
      ok: true,
      preview: buildPaymentOperationPreviewView(input)
    }
  };
}
