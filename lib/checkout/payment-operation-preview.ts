import { planPaymentOperation, type PaymentOperationPlan, type PaymentOperationPlanInput } from '@/lib/checkout/payment-operation-plan';
import { planPaymentOperationTransition, type PaymentOperationTransitionPlan } from '@/lib/checkout/payment-operation-transition-plan';

export type PaymentOperationPreviewInput = PaymentOperationPlanInput & {
  orderNumber?: string | null;
  paymentAttemptId?: string | null;
  fulfillmentStatus?: string | null;
  hasPerishableCapacity?: boolean;
};

export type PaymentOperationPreview = {
  plan: PaymentOperationPlan;
  transition: PaymentOperationTransitionPlan;
  orderNumber?: string;
  paymentAttemptId?: string;
  canSubmit: boolean;
  requiresManualReview: boolean;
  blocked: boolean;
  title: string;
  summary: string;
  nextAction: string;
  warnings: string[];
};

function operationLabel(operation: PaymentOperationPlan['operation']) {
  return operation === 'refund' ? 'Refund' : 'Void';
}

function formatAmount(amountCents: number, currency: string) {
  const amount = (amountCents / 100).toFixed(2);
  return `${amount} ${currency}`;
}

const REASON_COPY: Record<string, string> = {
  operation_amount_must_be_positive: 'Enter an amount greater than zero.',
  operation_amount_exceeds_payment_amount: 'The requested amount is greater than the original payment amount.',
  order_payment_currency_mismatch: 'The order and payment currencies do not match.',
  order_status_not_operation_eligible: 'This order status is not eligible for this payment operation.',
  payment_status_not_refundable: 'This payment status is not refundable.',
  payment_status_not_voidable: 'This payment status is not voidable.',
  provider_reference_required: 'A provider reference is required before this operation can be sent to a live payment provider.'
};

function reasonCopy(reason: string) {
  return REASON_COPY[reason] ?? reason.replaceAll('_', ' ');
}

export function buildPaymentOperationPreview(input: PaymentOperationPreviewInput): PaymentOperationPreview {
  const plan = planPaymentOperation(input);
  const transition = planPaymentOperationTransition({
    plan,
    fulfillmentStatus: input.fulfillmentStatus,
    hasPerishableCapacity: input.hasPerishableCapacity
  });
  const label = operationLabel(plan.operation);
  const amount = formatAmount(plan.amountCents, plan.currency);
  const warnings = [...plan.reasons.map(reasonCopy), ...transition.notes];
  const orderNumber = input.orderNumber?.trim() || undefined;
  const paymentAttemptId = input.paymentAttemptId?.trim() || undefined;

  const blocked = plan.decision === 'blocked';
  const requiresManualReview = plan.decision === 'manual_review';
  const canSubmit = plan.decision === 'ready';

  let summary = `${label} preview for ${amount} via ${plan.provider}.`;
  let nextAction = 'Review the operation details before continuing.';

  if (blocked) {
    summary = `${label} is blocked for ${amount}.`;
    nextAction = 'Resolve the blocking reasons before continuing.';
  } else if (requiresManualReview) {
    summary = `${label} requires manual review for ${amount}.`;
    nextAction = 'Handle this operation manually and record the result before adding provider execution.';
  } else if (plan.requiresProviderReference) {
    nextAction = 'Provider execution can be added only after preview, persistence, audit, and idempotency rules are defined.';
  }

  return {
    plan,
    transition,
    ...(orderNumber ? { orderNumber } : {}),
    ...(paymentAttemptId ? { paymentAttemptId } : {}),
    canSubmit,
    requiresManualReview,
    blocked,
    title: `${label} payment operation preview`,
    summary,
    nextAction,
    warnings
  };
}
