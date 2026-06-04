import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { planPaymentOperation } from '../../lib/checkout/payment-operation-plan';
import { planPaymentOperationTransition } from '../../lib/checkout/payment-operation-transition-plan';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentOperationTransitionPlanTests() {
  const transitionSource = source('lib/checkout/payment-operation-transition-plan.ts');
  assert.match(transitionSource, /export function planPaymentOperationTransition/);
  assert.match(transitionSource, /orderStatusRecommendation/);
  assert.match(transitionSource, /paymentStatusRecommendation/);
  assert.match(transitionSource, /releaseRecommendation/);
  assert.doesNotMatch(transitionSource, /prisma\./);
  assert.doesNotMatch(transitionSource, /fetch\(/);
  assert.doesNotMatch(transitionSource, /checkoutOrder\.update/);
  assert.doesNotMatch(transitionSource, /checkoutPaymentAttempt\.update/);

  const readyPartialRefund = planPaymentOperation({
    operation: 'refund',
    order: { status: 'paid', totalCents: 420000, currency: 'USD' },
    payment: {
      provider: 'stripe',
      status: 'paid',
      amountCents: 420000,
      currency: 'USD',
      providerReference: 'payment-reference'
    },
    amountCents: 210000
  });
  const partialTransition = planPaymentOperationTransition({ plan: readyPartialRefund, fulfillmentStatus: 'scheduled' });
  assert.equal(partialTransition.orderStatusRecommendation, 'paid_partial_refund_after_provider_success');
  assert.equal(partialTransition.paymentStatusRecommendation, 'partially_refunded_after_provider_success');
  assert.equal(partialTransition.releaseRecommendation, 'none');
  assert.equal(partialTransition.requiresOperatorApproval, false);
  assert.deepEqual(partialTransition.releaseReasons, ['partial_refund']);

  const readyFullRefund = planPaymentOperation({
    operation: 'refund',
    order: { status: 'paid', totalCents: 420000, currency: 'USD' },
    payment: {
      provider: 'stripe',
      status: 'paid',
      amountCents: 420000,
      currency: 'USD',
      providerReference: 'payment-reference'
    }
  });
  const fullRefundBeforeFulfillment = planPaymentOperationTransition({ plan: readyFullRefund, fulfillmentStatus: 'scheduled' });
  assert.equal(fullRefundBeforeFulfillment.orderStatusRecommendation, 'refunded_after_provider_success');
  assert.equal(fullRefundBeforeFulfillment.paymentStatusRecommendation, 'refunded_after_provider_success');
  assert.equal(fullRefundBeforeFulfillment.releaseRecommendation, 'evaluate_capacity_release');
  assert.equal(fullRefundBeforeFulfillment.requiresOperatorApproval, true);
  assert.deepEqual(fullRefundBeforeFulfillment.releaseReasons, ['full_refund_before_fulfillment']);

  const fullRefundAfterFulfillment = planPaymentOperationTransition({ plan: readyFullRefund, fulfillmentStatus: 'delivered' });
  assert.equal(fullRefundAfterFulfillment.releaseRecommendation, 'manual_review');
  assert.equal(fullRefundAfterFulfillment.requiresOperatorApproval, true);
  assert.deepEqual(fullRefundAfterFulfillment.releaseReasons, ['full_refund_after_fulfillment_started']);

  const readyVoid = planPaymentOperation({
    operation: 'void',
    order: { status: 'pending_payment', totalCents: 420000, currency: 'USD' },
    payment: {
      provider: 'stripe',
      status: 'authorized',
      amountCents: 420000,
      currency: 'USD',
      providerReference: 'authorization-reference'
    }
  });
  const voidBeforeFulfillment = planPaymentOperationTransition({ plan: readyVoid, fulfillmentStatus: 'unfulfilled' });
  assert.equal(voidBeforeFulfillment.orderStatusRecommendation, 'cancelled_after_provider_success');
  assert.equal(voidBeforeFulfillment.paymentStatusRecommendation, 'voided_after_provider_success');
  assert.equal(voidBeforeFulfillment.releaseRecommendation, 'evaluate_capacity_release');
  assert.deepEqual(voidBeforeFulfillment.releaseReasons, ['void_before_fulfillment']);

  const voidAfterFulfillment = planPaymentOperationTransition({ plan: readyVoid, fulfillmentStatus: 'in_progress' });
  assert.equal(voidAfterFulfillment.orderStatusRecommendation, 'manual_review_before_cancellation');
  assert.equal(voidAfterFulfillment.releaseRecommendation, 'manual_review');
  assert.deepEqual(voidAfterFulfillment.releaseReasons, ['fulfillment_started']);

  const blocked = planPaymentOperation({
    operation: 'refund',
    order: { status: 'paid', totalCents: 420000, currency: 'USD' },
    payment: {
      provider: 'stripe',
      status: 'paid',
      amountCents: 420000,
      currency: 'USD'
    }
  });
  const blockedTransition = planPaymentOperationTransition({ plan: blocked, fulfillmentStatus: 'scheduled' });
  assert.equal(blockedTransition.orderStatusRecommendation, 'unchanged');
  assert.equal(blockedTransition.paymentStatusRecommendation, 'unchanged');
  assert.equal(blockedTransition.releaseRecommendation, 'none');
  assert.deepEqual(blockedTransition.releaseReasons, ['operation_blocked']);

  const manual = planPaymentOperation({
    operation: 'refund',
    order: { status: 'paid', totalCents: 420000, currency: 'USD' },
    payment: { provider: 'manual', status: 'paid', amountCents: 420000, currency: 'USD' }
  });
  const manualTransition = planPaymentOperationTransition({ plan: manual, fulfillmentStatus: 'scheduled' });
  assert.equal(manualTransition.orderStatusRecommendation, 'unchanged_until_manual_review');
  assert.equal(manualTransition.paymentStatusRecommendation, 'unchanged_until_manual_review');
  assert.equal(manualTransition.releaseRecommendation, 'manual_review');
  assert.equal(manualTransition.requiresOperatorApproval, true);

  console.log('payment-operation-transition-plan.test.ts passed');
}
