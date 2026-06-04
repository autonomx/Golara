import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { normalizePaymentWebhookEvent } from '../../lib/checkout/payment-webhook-core';
import { planPaymentWebhookStateChange } from '../../lib/checkout/payment-webhook-transition-plan';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentWebhookTransitionPlanTests() {
  const planner = source('lib/checkout/payment-webhook-transition-plan.ts');
  assert.match(planner, /export function planPaymentWebhookStateChange/);
  assert.match(planner, /planCheckoutResultTransition/);
  assert.match(planner, /missing_provider_reference/);
  assert.doesNotMatch(planner, /checkoutOrder\.update/);
  assert.doesNotMatch(planner, /checkoutPaymentAttempt\.update/);

  const paid = normalizePaymentWebhookEvent({
    provider: 'stripe',
    eventType: 'checkout.session.completed',
    payload: {
      data: {
        object: {
          id: 'cs_test_123',
          payment_status: 'paid',
          metadata: { orderNumber: 'GOL-1' }
        }
      }
    }
  });
  const paidPlan = planPaymentWebhookStateChange({
    event: paid,
    currentOrderStatus: 'pending_payment',
    currentAttemptStatus: 'pending_payment'
  });
  assert.equal(paidPlan.trusted, true);
  assert.equal(paidPlan.resultStatus, 'paid');
  assert.equal(paidPlan.nextOrderStatus, 'paid');
  assert.equal(paidPlan.nextAttemptStatus, 'verified_paid');
  assert.equal(paidPlan.shouldUpdateOrder, true);
  assert.equal(paidPlan.shouldUpdateAttempt, true);
  assert.equal(paidPlan.reason, 'paid_webhook');

  const failed = normalizePaymentWebhookEvent({ provider: 'zarinpal', payload: { Status: 'NOK', Authority: 'A0001' } });
  const failedPlan = planPaymentWebhookStateChange({
    event: failed,
    currentOrderStatus: 'paid',
    currentAttemptStatus: 'verified_paid'
  });
  assert.equal(failedPlan.trusted, true);
  assert.equal(failedPlan.resultStatus, 'failed');
  assert.equal(failedPlan.nextOrderStatus, 'paid');
  assert.equal(failedPlan.shouldUpdateOrder, false);
  assert.equal(failedPlan.shouldUpdateAttempt, false);
  assert.equal(failedPlan.reason, 'non_paid_webhook');

  const pending = normalizePaymentWebhookEvent({ provider: 'unknown', payload: { id: 'evt_unknown' } });
  const pendingPlan = planPaymentWebhookStateChange({
    event: pending,
    currentOrderStatus: 'pending_payment',
    currentAttemptStatus: 'pending_payment'
  });
  assert.equal(pendingPlan.trusted, true);
  assert.equal(pendingPlan.reason, 'pending_webhook');
  assert.equal(pendingPlan.shouldUpdateOrder, false);
  assert.equal(pendingPlan.shouldUpdateAttempt, true);

  const missingReference = normalizePaymentWebhookEvent({ provider: 'stripe', eventType: 'checkout.session.completed', payload: { data: { object: { payment_status: 'paid' } } } });
  const missingReferencePlan = planPaymentWebhookStateChange({
    event: missingReference,
    currentOrderStatus: 'pending_payment',
    currentAttemptStatus: 'pending_payment'
  });
  assert.equal(missingReferencePlan.trusted, false);
  assert.equal(missingReferencePlan.reason, 'missing_provider_reference');
  assert.equal(missingReferencePlan.shouldUpdateOrder, false);
  assert.equal(missingReferencePlan.shouldUpdateAttempt, false);

  console.log('payment-webhook-transition-plan.test.ts passed');
}
