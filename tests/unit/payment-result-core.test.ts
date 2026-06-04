import assert from 'node:assert/strict';
import {
  checkoutAttemptStatusForResult,
  checkoutResultEventTitle,
  isDuplicateCheckoutResultEvent,
  nextCheckoutOrderStatus,
  normalizeCheckoutResultStatus,
  optionalCheckoutResultText,
  planCheckoutResultTransition,
  providerVerificationResult,
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

  assert.deepEqual(providerVerificationResult({
    provider: 'manual',
    status: 'paid',
    providerReference: 'REF-1'
  }), {
    status: 'paid',
    providerReference: 'REF-1',
    metadata: {
      verified: true,
      verificationSkipped: true
    }
  });

  assert.deepEqual(providerVerificationResult({
    provider: 'stripe',
    status: 'paid',
    providerReference: 'REF-2',
    requireVerification: true
  }), {
    status: 'failed',
    providerReference: 'REF-2',
    metadata: {
      verified: false,
      reason: 'provider-verification-required'
    }
  });

  assert.deepEqual(providerVerificationResult({
    provider: 'stripe',
    status: 'failed',
    providerReference: 'REF-3',
    requireVerification: true
  }), {
    status: 'failed',
    providerReference: 'REF-3',
    metadata: {
      verified: false,
      verificationSkipped: true
    }
  });

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

  assert.deepEqual(planCheckoutResultTransition({
    currentOrderStatus: 'pending_payment',
    currentAttemptStatus: 'pending_payment',
    resultStatus: 'paid',
    nowMs,
    lastEvent: null
  }), {
    nextAttemptStatus: 'verified_paid',
    shouldUpdateAttemptStatus: true,
    nextOrderStatus: 'paid',
    orderStatusChanged: true,
    duplicateTimelineEvent: false,
    shouldCreateTimelineEvent: true,
    shouldPersistOrderUpdate: true
  });

  assert.deepEqual(planCheckoutResultTransition({
    currentOrderStatus: 'pending_payment',
    currentAttemptStatus: 'pending_payment',
    resultStatus: 'failed',
    nowMs,
    lastEvent: null
  }), {
    nextAttemptStatus: 'failed',
    shouldUpdateAttemptStatus: true,
    nextOrderStatus: 'pending_payment',
    orderStatusChanged: false,
    duplicateTimelineEvent: false,
    shouldCreateTimelineEvent: true,
    shouldPersistOrderUpdate: true
  });

  assert.deepEqual(planCheckoutResultTransition({
    currentOrderStatus: 'paid',
    currentAttemptStatus: 'verified_paid',
    resultStatus: 'cancelled',
    nowMs,
    lastEvent: { title: 'Payment cancelled', createdAt: new Date(nowMs - 60_000) }
  }), {
    nextAttemptStatus: 'cancelled',
    shouldUpdateAttemptStatus: false,
    nextOrderStatus: 'paid',
    orderStatusChanged: false,
    duplicateTimelineEvent: true,
    shouldCreateTimelineEvent: false,
    shouldPersistOrderUpdate: false
  });

  assert.deepEqual(planCheckoutResultTransition({
    currentOrderStatus: 'paid',
    currentAttemptStatus: 'failed',
    resultStatus: 'paid',
    nowMs,
    lastEvent: { title: 'Payment failed', createdAt: new Date(nowMs - 60_000) }
  }), {
    nextAttemptStatus: 'verified_paid',
    shouldUpdateAttemptStatus: true,
    nextOrderStatus: 'paid',
    orderStatusChanged: false,
    duplicateTimelineEvent: false,
    shouldCreateTimelineEvent: true,
    shouldPersistOrderUpdate: true
  });

  console.log('payment-result-core.test.ts passed');
}
