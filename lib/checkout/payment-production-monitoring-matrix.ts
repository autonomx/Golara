export type PaymentProductionMonitoringDomain =
  | 'checkout'
  | 'payment_return'
  | 'webhook'
  | 'settlement'
  | 'refund_void'
  | 'notification'
  | 'admin_payment_action'
  | 'rollback';

export type PaymentProductionMonitoringRequirement = {
  id: string;
  domain: PaymentProductionMonitoringDomain;
  label: string;
  requiredSignal: string;
  requiredRunbook: string;
  rollbackEvidenceRequired: boolean;
};

export type PaymentProductionMonitoringEvidenceInput = {
  id: string;
  signalCaptured?: boolean;
  runbookLinked?: boolean;
  ownerAssigned?: boolean;
  rollbackEvidenceCaptured?: boolean;
};

export type PaymentProductionMonitoringEvidenceCheck = {
  id: string;
  complete: boolean;
  missing: string[];
};

export const PAYMENT_PRODUCTION_MONITORING_REQUIREMENTS: PaymentProductionMonitoringRequirement[] = [
  {
    id: 'checkout_creation_errors',
    domain: 'checkout',
    label: 'Checkout creation errors',
    requiredSignal: 'Structured checkout creation failures and duplicate submission/idempotency events are observable.',
    requiredRunbook: 'Checkout creation failure triage and rollback to assisted/inquiry checkout.',
    rollbackEvidenceRequired: true
  },
  {
    id: 'provider_handoff_failures',
    domain: 'checkout',
    label: 'Provider handoff failures',
    requiredSignal: 'Provider session creation and redirect/handoff failures are observable without exposing secrets.',
    requiredRunbook: 'Provider handoff outage triage and manual checkout fallback.',
    rollbackEvidenceRequired: true
  },
  {
    id: 'payment_return_anomalies',
    domain: 'payment_return',
    label: 'Payment return anomalies',
    requiredSignal: 'Success, cancel, failure, missing-token, and unverified return outcomes are observable.',
    requiredRunbook: 'Payment return anomaly review and customer-safe order status recovery.',
    rollbackEvidenceRequired: true
  },
  {
    id: 'webhook_signature_failures',
    domain: 'webhook',
    label: 'Webhook signature failures',
    requiredSignal: 'Invalid signature, missing secret, malformed payload, and duplicate replay outcomes are observable.',
    requiredRunbook: 'Webhook signature failure and provider endpoint rotation runbook.',
    rollbackEvidenceRequired: true
  },
  {
    id: 'settlement_mismatches',
    domain: 'settlement',
    label: 'Settlement mismatches',
    requiredSignal: 'Amount/currency/reference mismatches and durable/fallback settlement source states are observable.',
    requiredRunbook: 'Settlement mismatch reconciliation and provider dashboard review runbook.',
    rollbackEvidenceRequired: true
  },
  {
    id: 'refund_void_operation_failures',
    domain: 'refund_void',
    label: 'Refund/void operation failures',
    requiredSignal: 'Submitted, succeeded, failed, retryable, manual-review, and idempotency-conflict operation states are observable.',
    requiredRunbook: 'Refund/void provider failure, duplicate operation, and manual review runbook.',
    rollbackEvidenceRequired: true
  },
  {
    id: 'notification_delivery_failures',
    domain: 'notification',
    label: 'Notification delivery failures',
    requiredSignal: 'Accepted, rejected, rate-limited, unavailable, duplicate, and retry delivery outcomes are observable.',
    requiredRunbook: 'Notification provider outage, retry, and manual customer/staff contact runbook.',
    rollbackEvidenceRequired: false
  },
  {
    id: 'admin_payment_action_audit',
    domain: 'admin_payment_action',
    label: 'Admin payment action audit',
    requiredSignal: 'Owner-only payment-operation attempts, denials, successes, and failures are audit-visible with redacted metadata.',
    requiredRunbook: 'Admin payment action review and suspicious-action escalation runbook.',
    rollbackEvidenceRequired: false
  },
  {
    id: 'gateway_mode_rollback_drill',
    domain: 'rollback',
    label: 'Gateway-mode rollback drill',
    requiredSignal: 'Operators can confirm checkout mode, payment provider mode, and notification mode changes in deployed configuration.',
    requiredRunbook: 'Rollback from gateway/live delivery to inquiry/manual/log modes with customer-safe messaging.',
    rollbackEvidenceRequired: true
  }
];

export function listPaymentProductionMonitoringRequirements() {
  return PAYMENT_PRODUCTION_MONITORING_REQUIREMENTS.map((requirement) => ({ ...requirement }));
}

export function validatePaymentProductionMonitoringEvidence(inputs: PaymentProductionMonitoringEvidenceInput[]): PaymentProductionMonitoringEvidenceCheck[] {
  const inputById = new Map(inputs.map((input) => [input.id, input]));

  return PAYMENT_PRODUCTION_MONITORING_REQUIREMENTS.map((requirement) => {
    const evidence = inputById.get(requirement.id);
    const missing: string[] = [];

    if (!evidence?.signalCaptured) missing.push('signal_evidence_missing');
    if (!evidence?.runbookLinked) missing.push('runbook_link_missing');
    if (!evidence?.ownerAssigned) missing.push('owner_assignment_missing');
    if (requirement.rollbackEvidenceRequired && !evidence?.rollbackEvidenceCaptured) missing.push('rollback_evidence_missing');

    return {
      id: requirement.id,
      complete: missing.length === 0,
      missing
    };
  });
}

export function isPaymentProductionMonitoringEvidenceComplete(inputs: PaymentProductionMonitoringEvidenceInput[]) {
  return validatePaymentProductionMonitoringEvidence(inputs).every((check) => check.complete);
}
