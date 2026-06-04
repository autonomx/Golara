export type CheckoutResultStatus = 'paid' | 'failed' | 'cancelled';

export type CheckoutProviderVerificationResult = {
  status: CheckoutResultStatus;
  providerReference?: string;
  metadata?: Record<string, string | number | boolean>;
};

export type CheckoutResultTransitionInput = {
  currentOrderStatus: string;
  currentAttemptStatus?: string | null;
  resultStatus: CheckoutResultStatus;
  lastEvent?: { title: string; createdAt: Date } | null;
  nowMs?: number;
};

export type CheckoutResultTransitionPlan = {
  nextAttemptStatus: string;
  shouldUpdateAttemptStatus: boolean;
  nextOrderStatus: string;
  orderStatusChanged: boolean;
  duplicateTimelineEvent: boolean;
  shouldCreateTimelineEvent: boolean;
  shouldPersistOrderUpdate: boolean;
};

const FINAL_ATTEMPT_STATUSES = new Set(['verified_paid', 'cancelled', 'failed']);

export function normalizeCheckoutResultStatus(value: string): CheckoutResultStatus {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'paid' || normalized === 'success' || normalized === 'ok') return 'paid';
  if (normalized === 'cancelled' || normalized === 'canceled' || normalized === 'cancel') return 'cancelled';
  return 'failed';
}

export function optionalCheckoutResultText(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

export function checkoutAttemptStatusForResult(status: CheckoutResultStatus) {
  if (status === 'paid') return 'verified_paid';
  if (status === 'cancelled') return 'cancelled';
  return 'failed';
}

export function checkoutResultEventTitle(status: CheckoutResultStatus) {
  if (status === 'paid') return 'Payment verified paid';
  if (status === 'cancelled') return 'Payment cancelled';
  return 'Payment failed';
}

export function shouldUpdateCheckoutAttemptStatus(currentStatus: string, nextStatus: string) {
  if (currentStatus === nextStatus) return false;
  if (currentStatus === 'verified_paid') return false;
  if (FINAL_ATTEMPT_STATUSES.has(currentStatus) && nextStatus !== 'verified_paid') return false;
  return true;
}

export function nextCheckoutOrderStatus(currentStatus: string, resultStatus: CheckoutResultStatus) {
  if (currentStatus === 'paid') return 'paid';
  if (resultStatus === 'paid') return 'paid';
  return currentStatus;
}

export function isDuplicateCheckoutResultEvent(input: {
  lastEvent?: { title: string; createdAt: Date } | null;
  status: CheckoutResultStatus;
  nowMs?: number;
}) {
  const lastEvent = input.lastEvent;
  if (!lastEvent) return false;
  if (lastEvent.title !== checkoutResultEventTitle(input.status)) return false;
  return lastEvent.createdAt.getTime() > (input.nowMs ?? Date.now()) - 5 * 60 * 1000;
}

export function planCheckoutResultTransition(input: CheckoutResultTransitionInput): CheckoutResultTransitionPlan {
  const nextAttemptStatus = checkoutAttemptStatusForResult(input.resultStatus);
  const shouldUpdateAttemptStatus = input.currentAttemptStatus
    ? shouldUpdateCheckoutAttemptStatus(input.currentAttemptStatus, nextAttemptStatus)
    : false;
  const nextOrderStatus = nextCheckoutOrderStatus(input.currentOrderStatus, input.resultStatus);
  const orderStatusChanged = nextOrderStatus !== input.currentOrderStatus;
  const duplicateTimelineEvent = isDuplicateCheckoutResultEvent({
    lastEvent: input.lastEvent,
    status: input.resultStatus,
    nowMs: input.nowMs
  });

  return {
    nextAttemptStatus,
    shouldUpdateAttemptStatus,
    nextOrderStatus,
    orderStatusChanged,
    duplicateTimelineEvent,
    shouldCreateTimelineEvent: !duplicateTimelineEvent,
    shouldPersistOrderUpdate: orderStatusChanged || shouldUpdateAttemptStatus || !duplicateTimelineEvent
  };
}

export function providerVerificationResult(input: {
  provider?: string;
  status: CheckoutResultStatus;
  providerReference?: string;
  requireVerification?: boolean;
}): CheckoutProviderVerificationResult {
  if (input.status === 'paid' && input.requireVerification) {
    return {
      status: 'failed',
      providerReference: input.providerReference,
      metadata: {
        verified: false,
        reason: 'provider-verification-required'
      }
    };
  }

  return {
    status: input.status,
    providerReference: input.providerReference,
    metadata: {
      verified: input.status !== 'paid' ? false : input.provider === 'manual' || input.provider === 'domestic_redirect',
      verificationSkipped: input.status !== 'paid' || input.provider !== 'zarinpal'
    }
  };
}
