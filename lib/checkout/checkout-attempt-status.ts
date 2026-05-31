export type CheckoutAttemptStartStatus = 'manual' | 'redirect' | 'unavailable' | 'started';

export function mapCheckoutAttemptStatus(status: CheckoutAttemptStartStatus) {
  if (status === 'redirect') return 'redirect_required';
  if (status === 'started') return 'created';
  return 'manual_pending';
}
