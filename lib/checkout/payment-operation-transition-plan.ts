import type { PaymentOperationPlan } from '@/lib/checkout/payment-operation-plan';

export type PaymentOperationFulfillmentStatus = 'unfulfilled' | 'scheduled' | 'in_progress' | 'fulfilled' | 'delivered' | 'cancelled';

export type PaymentOperationTransitionInput = {
  plan: PaymentOperationPlan;
  fulfillmentStatus?: string | null;
  hasPerishableCapacity?: boolean;
};

export type PaymentOperationTransitionPlan = {
  orderStatusRecommendation: string;
  paymentStatusRecommendation: string;
  releaseRecommendation: 'none' | 'evaluate_capacity_release' | 'manual_review';
  releaseReasons: string[];
  requiresOperatorApproval: boolean;
  notes: string[];
};

function normalizeFulfillmentStatus(status?: string | null): PaymentOperationFulfillmentStatus {
  const normalized = (status ?? 'unfulfilled').trim().toLowerCase();
  if (normalized === 'scheduled') return 'scheduled';
  if (normalized === 'in_progress') return 'in_progress';
  if (normalized === 'fulfilled') return 'fulfilled';
  if (normalized === 'delivered') return 'delivered';
  if (normalized === 'cancelled') return 'cancelled';
  return 'unfulfilled';
}

function isAfterFulfillmentStarted(status: PaymentOperationFulfillmentStatus) {
  return status === 'in_progress' || status === 'fulfilled' || status === 'delivered';
}

export function planPaymentOperationTransition(input: PaymentOperationTransitionInput): PaymentOperationTransitionPlan {
  const fulfillmentStatus = normalizeFulfillmentStatus(input.fulfillmentStatus);
  const hasPerishableCapacity = input.hasPerishableCapacity ?? true;
  const plan = input.plan;
  const fullAmount = plan.metadata.fullAmount;
  const partialAmount = plan.metadata.partialAmount;
  const notes: string[] = [];
  const releaseReasons: string[] = [];

  if (plan.decision === 'blocked') {
    return {
      orderStatusRecommendation: 'unchanged',
      paymentStatusRecommendation: 'unchanged',
      releaseRecommendation: 'none',
      releaseReasons: ['operation_blocked'],
      requiresOperatorApproval: false,
      notes: ['Blocked payment operations must not change order, payment, inventory, or capacity state.']
    };
  }

  if (plan.decision === 'manual_review') {
    return {
      orderStatusRecommendation: 'unchanged_until_manual_review',
      paymentStatusRecommendation: 'unchanged_until_manual_review',
      releaseRecommendation: 'manual_review',
      releaseReasons: ['manual_review_required'],
      requiresOperatorApproval: true,
      notes: ['Manual-review payment operations require an operator decision before status or release changes.']
    };
  }

  if (plan.operation === 'void') {
    if (isAfterFulfillmentStarted(fulfillmentStatus)) {
      return {
        orderStatusRecommendation: 'manual_review_before_cancellation',
        paymentStatusRecommendation: 'voided_after_provider_success',
        releaseRecommendation: 'manual_review',
        releaseReasons: ['fulfillment_started'],
        requiresOperatorApproval: true,
        notes: ['Void succeeded planning should not automatically release capacity after fulfillment work has started.']
      };
    }

    return {
      orderStatusRecommendation: 'cancelled_after_provider_success',
      paymentStatusRecommendation: 'voided_after_provider_success',
      releaseRecommendation: hasPerishableCapacity ? 'evaluate_capacity_release' : 'none',
      releaseReasons: hasPerishableCapacity ? ['void_before_fulfillment'] : [],
      requiresOperatorApproval: hasPerishableCapacity,
      notes: ['Authorization voids before fulfillment can cancel the order after provider success; perishable capacity release still needs operator-aware rules.']
    };
  }

  if (partialAmount) {
    notes.push('Partial refunds should keep the order and payment attempt active unless an operator chooses a separate adjustment workflow.');
    return {
      orderStatusRecommendation: 'paid_partial_refund_after_provider_success',
      paymentStatusRecommendation: 'partially_refunded_after_provider_success',
      releaseRecommendation: 'none',
      releaseReasons: ['partial_refund'],
      requiresOperatorApproval: false,
      notes
    };
  }

  if (fullAmount && isAfterFulfillmentStarted(fulfillmentStatus)) {
    return {
      orderStatusRecommendation: 'refunded_after_provider_success',
      paymentStatusRecommendation: 'refunded_after_provider_success',
      releaseRecommendation: 'manual_review',
      releaseReasons: ['full_refund_after_fulfillment_started'],
      requiresOperatorApproval: true,
      notes: ['Full refunds after fulfillment starts should not automatically release inventory or delivery capacity.']
    };
  }

  return {
    orderStatusRecommendation: 'refunded_after_provider_success',
    paymentStatusRecommendation: 'refunded_after_provider_success',
    releaseRecommendation: hasPerishableCapacity ? 'evaluate_capacity_release' : 'none',
    releaseReasons: hasPerishableCapacity ? ['full_refund_before_fulfillment'] : [],
    requiresOperatorApproval: hasPerishableCapacity,
    notes: ['Full refunds before fulfillment may be eligible for inventory or capacity release after provider success.']
  };
}
