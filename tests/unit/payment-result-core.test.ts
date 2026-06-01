import assert from 'node:assert/strict';
import {
  checkoutAttemptStatusForResult,
  checkoutResultEventTitle,
  isDuplicateCheckoutResultEvent,
  nextCheckoutOrderStatus,
  normalizeCheckoutResultStatus,
  optionalCheckoutResultText,
  shouldUpdateCheckoutAttemptStatus
} from '../../lib/checkout/payment-result-core';

export async function runPaymentResultCoreTests() {
  assert.equal(normalizeCheckoutResultStatus('paid'), 'paid');
  assert.equal(normalizeCheckoutResultStatus(' SUCCESS '), 'paid');
  assert.equal(normalizeCheckoutResultStatus('ok'), 'paid');
  assert.equal(normalizeCheckoutResultStatus('cancel'), 'cancelled');
  assert.equal(normalizeCheckoutResultStatus('canceled'), 'cancelled');
  assert.equal(normalizeCheckoutResultStatus('cancelled'), 'cancelled');
  assert.equal(normalizeCheckoutResultStatus('anything-else'), 'failed');

  assert.equal(optionalCheckoutResultText(' ref-1 '), 'ref-1');
  assert.equal(optionalCheckoutResultText('   '), undefined);
  assert.equal(optionalCheckoutResultText(undefined), undefined);

  assert.equal(checkoutAttemptStatusForResult('paid'), 'verified_paid');
  assert.equal(checkoutAttemptStatusForResult('cancelled'), 'cancelled');
  assert.equal(checkoutAttemptStatusForResult('failed'), 'failed');

  assert.equal(checkoutResultEventTitle('paid'), 'Payment verified paid');
  assert.equal(checkoutResultEventTitle('cancelled'), 'Payment cancelled');
  assert.equal(checkoutResultEventTitle('failed'), 'Payment failed');

  assert.equal(shouldUpdateCheckoutAttemptStatus('pending_payment', 'verified_paid'), true);
  assert.equal(shouldUpdateCheckoutAttemptStatus('manual_pending', 'failed'), true);
  assert.equal(shouldUpdateCheckoutAttemptStatus('verified_paid', 'failed'), false);
  assert.equal(shouldUpdateCheckoutAttemptStatus('failed', 'cancelled'), false);
  assert.equal(shouldUpdateCheckoutAttemptStatus('cancelled', 'failed'), false);
  assert.equal(shouldUpdateCheckoutAttemptStatus('failed', 'verified_paid'), true);
  assert.equal(shouldUpdateCheckoutAttemptStatus('verified_paid', 'verified_paid'), false);

  assert.equal(nextCheckoutOrderStatus('pending_payment', 'paid'), 'paid');
  assert.equal(nextCheckoutOrderStatus('paid', 'failed'), 'paid');
  assert.equal(nextCheckoutOrderStatus('pending_payment', 'failed'), 'pending_payment');
  assert.equal(nextCheckoutOrderStatus('draft', 'cancelled'), 'draft');

  const nowMs = new Date('2026-05-31T23:00:00Z').getTime();
  assert.equal(isDuplicateCheckoutResultEvent({
    nowMs,
    status: 'paid',
    lastEvent: { title: 'Payment verified paid', createdAt: new Date(nowMs - 60_000) }
  }), true);
  assert.equal(isDuplicateCheckoutResultEvent({
    nowMs,
    status: 'paid',
    lastEvent: { title: 'Payment failed', createdAt: new Date(nowMs - 60_000) }
  }), false);
  assert.equal(isDuplicateCheckoutResultEvent({
    nowMs,
    status: 'paid',
    lastEvent: { title: 'Payment verified paid', createdAt: new Date(nowMs - 6 * 60_000) }
  }), false);
  assert.equal(isDuplicateCheckoutResultEvent({ nowMs, status: 'failed', lastEvent: null }), false);

  console.log('payment-result-core.test.ts passed');
}
