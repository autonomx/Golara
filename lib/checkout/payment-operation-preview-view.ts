import { buildPaymentOperationPreview, type PaymentOperationPreview, type PaymentOperationPreviewInput } from '@/lib/checkout/payment-operation-preview';

export type PaymentOperationPreviewTone = 'success' | 'warning' | 'danger';

export type PaymentOperationPreviewView = {
  preview: PaymentOperationPreview;
  tone: PaymentOperationPreviewTone;
  statusLabel: string;
  detailRows: Array<{ label: string; value: string }>;
  transitionRows: Array<{ label: string; value: string }>;
  actionLabel: string;
  disabledReason?: string;
};

function statusLabel(preview: PaymentOperationPreview) {
  if (preview.blocked) return 'Blocked';
  if (preview.requiresManualReview) return 'Manual review required';
  return 'Ready for preview approval';
}

function tone(preview: PaymentOperationPreview): PaymentOperationPreviewTone {
  if (preview.blocked) return 'danger';
  if (preview.requiresManualReview) return 'warning';
  return 'success';
}

function formatAmount(amountCents: number, currency: string) {
  return `${(amountCents / 100).toFixed(2)} ${currency}`;
}

function displayValue(value: string) {
  return value.replace(/_/g, ' ');
}

function actionLabel(preview: PaymentOperationPreview) {
  if (preview.blocked) return 'Resolve blockers';
  if (preview.requiresManualReview) return 'Record manual review';
  return 'Preview only';
}

function disabledReason(preview: PaymentOperationPreview) {
  if (preview.canSubmit) return 'This preview does not submit the operation.';
  if (preview.blocked) return 'This operation is blocked by the preview plan.';
  return 'Manual-review operations are not submitted from this preview.';
}

export function buildPaymentOperationPreviewView(input: PaymentOperationPreviewInput): PaymentOperationPreviewView {
  const preview = buildPaymentOperationPreview(input);
  const detailRows = [
    { label: 'Operation', value: preview.plan.operation },
    { label: 'Decision', value: preview.plan.decision },
    { label: 'Provider', value: preview.plan.provider },
    { label: 'Amount', value: formatAmount(preview.plan.amountCents, preview.plan.currency) },
    { label: 'Provider reference required', value: preview.plan.requiresProviderReference ? 'Yes' : 'No' },
    { label: 'Manual review', value: preview.requiresManualReview ? 'Yes' : 'No' }
  ];
  const transitionRows = [
    { label: 'Order recommendation', value: displayValue(preview.transition.orderStatusRecommendation) },
    { label: 'Payment recommendation', value: displayValue(preview.transition.paymentStatusRecommendation) },
    { label: 'Release recommendation', value: displayValue(preview.transition.releaseRecommendation) },
    { label: 'Operator approval', value: preview.transition.requiresOperatorApproval ? 'Required' : 'Not required' }
  ];

  if (preview.orderNumber) detailRows.unshift({ label: 'Order', value: preview.orderNumber });
  if (preview.paymentAttemptId) detailRows.push({ label: 'Payment attempt', value: preview.paymentAttemptId });
  if (preview.transition.releaseReasons.length) {
    transitionRows.push({ label: 'Release reasons', value: preview.transition.releaseReasons.map(displayValue).join(', ') });
  }

  return {
    preview,
    tone: tone(preview),
    statusLabel: statusLabel(preview),
    detailRows,
    transitionRows,
    actionLabel: actionLabel(preview),
    disabledReason: disabledReason(preview)
  };
}
