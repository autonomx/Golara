export type CheckoutResultStatus = 'paid' | 'failed' | 'cancelled';

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
