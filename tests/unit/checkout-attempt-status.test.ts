import assert from 'node:assert/strict';
import { mapCheckoutAttemptStatus } from '../../lib/checkout/checkout-attempt-status';

export async function runCheckoutAttemptStatusTests() {
  assert.equal(mapCheckoutAttemptStatus('manual'), 'manual_pending');
  assert.equal(mapCheckoutAttemptStatus('unavailable'), 'manual_pending');
  assert.equal(mapCheckoutAttemptStatus('redirect'), 'redirect_required');
  assert.equal(mapCheckoutAttemptStatus('started'), 'created');

  console.log('checkout-attempt-status.test.ts passed');
}
