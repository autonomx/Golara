import {
  checkoutResultEventTitle,
  planCheckoutResultTransition,
  type CheckoutResultStatus
} from './payment-result-core';
import type { NormalizedPaymentWebhookEvent } from './payment-webhook-core';

export type PaymentWebhookStatePlan = {
  trusted: boolean;
  resultStatus: CheckoutResultStatus;
  nextOrderStatus: string;
  nextAttemptStatus: string;
  shouldUpdateOrder: boolean;
  shouldUpdateAttempt: boolean;
  shouldCreateTimelineEvent: boolean;
  timelineTitle: string;
  reason: 'paid_webhook' | 'non_paid_webhook' | 'pending_webhook' | 'missing_provider_reference';
};

function resultStatusFromWebhook(event: NormalizedPaymentWebhookEvent): CheckoutResultStatus | null {
  if (event.status === 'paid') return 'paid';
  if (event.status === 'failed') return 'failed';
  if (event.status === 'cancelled') return 'cancelled';
  return null;
}

export function planPaymentWebhookStateChange(input: {
  event: NormalizedPaymentWebhookEvent;
  currentOrderStatus: string;
  currentAttemptStatus?: string | null;
  lastEvent?: { title: string; createdAt: Date } | null;
  nowMs?: number;
}): PaymentWebhookStatePlan {
  const resultStatus = resultStatusFromWebhook(input.event);
  const trusted = Boolean(resultStatus && input.event.providerReference);
  const normalizedStatus: CheckoutResultStatus = resultStatus ?? 'failed';
  const transition = trusted
    ? planCheckoutResultTransition({
        currentOrderStatus: input.currentOrderStatus,
        currentAttemptStatus: input.currentAttemptStatus,
        resultStatus: normalizedStatus,
        lastEvent: input.lastEvent,
        nowMs: input.nowMs
      })
    : {
        nextOrderStatus: input.currentOrderStatus,
        nextAttemptStatus: input.currentAttemptStatus ?? 'pending_webhook',
        shouldUpdateAttemptStatus: false,
        orderStatusChanged: false,
        shouldCreateTimelineEvent: false
      };

  return {
    trusted,
    resultStatus: normalizedStatus,
    nextOrderStatus: transition.nextOrderStatus,
    nextAttemptStatus: transition.nextAttemptStatus,
    shouldUpdateOrder: trusted && transition.orderStatusChanged,
    shouldUpdateAttempt: trusted && transition.shouldUpdateAttemptStatus,
    shouldCreateTimelineEvent: trusted && transition.shouldCreateTimelineEvent,
    timelineTitle: checkoutResultEventTitle(normalizedStatus),
    reason: !input.event.providerReference
      ? 'missing_provider_reference'
      : input.event.status === 'pending'
        ? 'pending_webhook'
        : input.event.status === 'paid'
          ? 'paid_webhook'
          : 'non_paid_webhook'
  };
}
