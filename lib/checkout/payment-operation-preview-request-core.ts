import { recordPaymentOperationAuditEvent } from '@/lib/checkout/payment-operation-audit';
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

export async function buildAuditedPaymentOperationPreviewRequestResult(draft: PaymentOperationPreviewInputDraft): Promise<PaymentOperationPreviewRequestResult> {
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

  const result = buildPaymentOperationPreviewRouteResult(normalized.input);
  const preview = result.body.preview.preview;
  await recordPaymentOperationAuditEvent({
    kind: preview.blocked ? 'preview_blocked' : preview.requiresManualReview ? 'preview_manual_review' : 'preview_requested',
    orderId: null,
    paymentAttemptId: preview.paymentAttemptId ?? null,
    operationKind: preview.plan.operation,
    provider: preview.plan.provider,
    requestedAmountCents: preview.plan.amountCents,
    currency: preview.plan.currency,
    previewDecision: preview.plan.decision,
    previewReasons: preview.plan.reasons,
    operatorReason: preview.plan.operatorReason,
    metadata: {
      orderNumber: preview.orderNumber ?? null,
      warningCount: preview.warnings.length,
      canSubmit: preview.canSubmit,
      requiresManualReview: preview.requiresManualReview,
      blocked: preview.blocked
    }
  });

  return result;
}
