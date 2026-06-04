export type PaymentWebhookAlertSeverity = 'none' | 'warning' | 'critical';

export type PaymentWebhookAlertInput = {
  provider: string;
  status?: string | null;
  providerReference?: string | null;
  orderNumber?: string | null;
  paymentAttemptId?: string | null;
  eventId?: string | null;
  ageMinutes?: number | null;
  duplicate?: boolean;
  missingPaymentAttempt?: boolean;
  settlementStatus?: string | null;
};

export type PaymentWebhookAlertPlan = {
  shouldAlert: boolean;
  severity: PaymentWebhookAlertSeverity;
  reason: 'none' | 'failed_webhook' | 'pending_webhook' | 'missing_payment_attempt' | 'settlement_mismatch' | 'stale_pending_webhook';
  retryable: boolean;
  provider: string;
  providerReference?: string;
  orderNumber?: string;
  paymentAttemptId?: string;
  eventId?: string;
  message: string;
};

function text(value?: string | null) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function planPaymentWebhookAlert(input: PaymentWebhookAlertInput): PaymentWebhookAlertPlan {
  const provider = text(input.provider) || 'unknown';
  const status = text(input.status)?.toLowerCase() || 'pending';
  const settlementStatus = text(input.settlementStatus)?.toLowerCase();
  const providerReference = text(input.providerReference);
  const orderNumber = text(input.orderNumber);
  const paymentAttemptId = text(input.paymentAttemptId);
  const eventId = text(input.eventId);
  const ageMinutes = typeof input.ageMinutes === 'number' && Number.isFinite(input.ageMinutes) ? input.ageMinutes : 0;

  if (input.duplicate) {
    return {
      shouldAlert: false,
      severity: 'none',
      reason: 'none',
      retryable: false,
      provider,
      providerReference,
      orderNumber,
      paymentAttemptId,
      eventId,
      message: 'Duplicate webhook event was ignored.'
    };
  }

  if (input.missingPaymentAttempt || !paymentAttemptId) {
    return {
      shouldAlert: true,
      severity: 'critical',
      reason: 'missing_payment_attempt',
      retryable: true,
      provider,
      providerReference,
      orderNumber,
      paymentAttemptId,
      eventId,
      message: 'Payment webhook could not be matched to a checkout payment attempt.'
    };
  }

  if (settlementStatus === 'amount_mismatch' || settlementStatus === 'currency_mismatch') {
    return {
      shouldAlert: true,
      severity: 'critical',
      reason: 'settlement_mismatch',
      retryable: false,
      provider,
      providerReference,
      orderNumber,
      paymentAttemptId,
      eventId,
      message: 'Payment webhook settlement data does not match checkout order totals or currency.'
    };
  }

  if (status === 'failed' || status === 'cancelled') {
    return {
      shouldAlert: true,
      severity: 'warning',
      reason: 'failed_webhook',
      retryable: false,
      provider,
      providerReference,
      orderNumber,
      paymentAttemptId,
      eventId,
      message: 'Payment webhook reported a failed or cancelled provider payment.'
    };
  }

  if (status === 'pending' && ageMinutes >= 30) {
    return {
      shouldAlert: true,
      severity: 'warning',
      reason: 'stale_pending_webhook',
      retryable: true,
      provider,
      providerReference,
      orderNumber,
      paymentAttemptId,
      eventId,
      message: 'Payment webhook is still pending after the operator attention threshold.'
    };
  }

  if (status === 'pending') {
    return {
      shouldAlert: true,
      severity: 'warning',
      reason: 'pending_webhook',
      retryable: true,
      provider,
      providerReference,
      orderNumber,
      paymentAttemptId,
      eventId,
      message: 'Payment webhook is pending provider verification or settlement reconciliation.'
    };
  }

  return {
    shouldAlert: false,
    severity: 'none',
    reason: 'none',
    retryable: false,
    provider,
    providerReference,
    orderNumber,
    paymentAttemptId,
    eventId,
    message: 'Payment webhook does not require operator attention.'
  };
}

export function summarizePaymentWebhookAlerts(plans: PaymentWebhookAlertPlan[]) {
  return plans.reduce((summary, plan) => {
    summary.total += 1;
    if (plan.shouldAlert) summary.alerts += 1;
    if (plan.severity === 'warning') summary.warning += 1;
    if (plan.severity === 'critical') summary.critical += 1;
    if (plan.retryable) summary.retryable += 1;
    return summary;
  }, { total: 0, alerts: 0, warning: 0, critical: 0, retryable: 0 });
}
