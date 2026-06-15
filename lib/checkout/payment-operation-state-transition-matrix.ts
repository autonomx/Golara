export type PaymentOperationStateTransitionCase = {
  id: string;
  operation: 'refund' | 'void';
  scenario: string;
  providerOutcome: 'succeeded' | 'failed' | 'manual_review';
  orderStatusExpectation: string;
  paymentStatusExpectation: string;
  releaseExpectation: 'none' | 'manual_review' | 'eligible_after_policy';
  requiredEvidence: string[];
  requiredGuards: string[];
};

export const paymentOperationStateTransitionMatrix: PaymentOperationStateTransitionCase[] = [
  {
    id: 'full-refund-before-fulfillment',
    operation: 'refund',
    scenario: 'Full refund succeeds before fulfillment work starts.',
    providerOutcome: 'succeeded',
    orderStatusExpectation: 'refunded_after_provider_success',
    paymentStatusExpectation: 'refunded_after_provider_success',
    releaseExpectation: 'eligible_after_policy',
    requiredEvidence: [
      'provider_success_response',
      'operation_record_succeeded_transition',
      'order_timeline_entry',
      'inventory_or_capacity_release_policy'
    ],
    requiredGuards: [
      'owner_only_execution',
      'idempotency_key_reuse',
      'no_state_mutation_before_provider_success',
      'bounded_audit_metadata'
    ]
  },
  {
    id: 'full-refund-after-fulfillment-started',
    operation: 'refund',
    scenario: 'Full refund succeeds after fulfillment, delivery, or packing work starts.',
    providerOutcome: 'succeeded',
    orderStatusExpectation: 'refunded_after_provider_success',
    paymentStatusExpectation: 'refunded_after_provider_success',
    releaseExpectation: 'manual_review',
    requiredEvidence: [
      'provider_success_response',
      'fulfillment_status_snapshot',
      'manual_release_review_record',
      'order_timeline_entry'
    ],
    requiredGuards: [
      'owner_only_execution',
      'no_automatic_release_after_fulfillment_started',
      'bounded_audit_metadata'
    ]
  },
  {
    id: 'partial-refund',
    operation: 'refund',
    scenario: 'Partial refund succeeds for a paid order.',
    providerOutcome: 'succeeded',
    orderStatusExpectation: 'paid_partial_refund_after_provider_success',
    paymentStatusExpectation: 'partially_refunded_after_provider_success',
    releaseExpectation: 'none',
    requiredEvidence: [
      'provider_success_response',
      'partial_amount_reconciliation',
      'operation_record_succeeded_transition',
      'customer_safe_order_status_copy'
    ],
    requiredGuards: [
      'partial_amount_less_than_paid_total',
      'idempotency_key_reuse',
      'no_inventory_release_for_partial_refund'
    ]
  },
  {
    id: 'void-before-fulfillment',
    operation: 'void',
    scenario: 'Authorization void succeeds before fulfillment starts.',
    providerOutcome: 'succeeded',
    orderStatusExpectation: 'cancelled_after_provider_success',
    paymentStatusExpectation: 'voided_after_provider_success',
    releaseExpectation: 'eligible_after_policy',
    requiredEvidence: [
      'provider_void_success_response',
      'authorization_not_captured_snapshot',
      'operation_record_succeeded_transition',
      'inventory_or_capacity_release_policy'
    ],
    requiredGuards: [
      'void_only_before_capture',
      'owner_only_execution',
      'no_state_mutation_before_provider_success',
      'bounded_audit_metadata'
    ]
  },
  {
    id: 'void-after-fulfillment-started',
    operation: 'void',
    scenario: 'Void-like reversal succeeds or requires provider/manual review after fulfillment starts.',
    providerOutcome: 'manual_review',
    orderStatusExpectation: 'manual_review_before_cancellation',
    paymentStatusExpectation: 'voided_after_provider_success',
    releaseExpectation: 'manual_review',
    requiredEvidence: [
      'provider_or_manual_review_response',
      'fulfillment_status_snapshot',
      'manual_release_review_record',
      'operator_decision_record'
    ],
    requiredGuards: [
      'no_automatic_cancellation_after_fulfillment_started',
      'no_automatic_release_after_fulfillment_started',
      'bounded_audit_metadata'
    ]
  },
  {
    id: 'provider-operation-failed',
    operation: 'refund',
    scenario: 'Provider rejects or fails a refund or void operation.',
    providerOutcome: 'failed',
    orderStatusExpectation: 'unchanged',
    paymentStatusExpectation: 'unchanged',
    releaseExpectation: 'none',
    requiredEvidence: [
      'provider_failure_response',
      'operation_record_failed_transition',
      'retryability_classification',
      'admin_visible_failure_reason'
    ],
    requiredGuards: [
      'no_state_mutation_after_provider_failure',
      'no_inventory_release_after_provider_failure',
      'bounded_error_metadata',
      'operator_retry_decision_required'
    ]
  }
];

export function getPaymentOperationStateTransitionMatrix() {
  return paymentOperationStateTransitionMatrix;
}

export function getPaymentOperationStateTransitionCaseIds() {
  return paymentOperationStateTransitionMatrix.map((entry) => entry.id);
}
