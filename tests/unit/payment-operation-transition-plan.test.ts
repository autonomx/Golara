import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { planPaymentOperation } from '../../lib/checkout/payment-operation-plan';
import { buildPaymentOperationPreview } from '../../lib/checkout/payment-operation-preview';
import { normalizePaymentOperationPreviewInput } from '../../lib/checkout/payment-operation-preview-input';
import { buildPaymentOperationPreviewView } from '../../lib/checkout/payment-operation-preview-view';
import { planPaymentOperationTransition } from '../../lib/checkout/payment-operation-transition-plan';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentOperationTransitionPlanTests() {
  const transitionSource = source('lib/checkout/payment-operation-transition-plan.ts');
  const previewSource = source('lib/checkout/payment-operation-preview.ts');
  const previewInputSource = source('lib/checkout/payment-operation-preview-input.ts');
  const previewViewSource = source('lib/checkout/payment-operation-preview-view.ts');
  const adminPreviewPanelSource = source('components/admin/AdminPaymentOperationPreviewPanel.tsx');
  assert.match(transitionSource, /export function planPaymentOperationTransition/);
  assert.match(transitionSource, /orderStatusRecommendation/);
  assert.match(transitionSource, /paymentStatusRecommendation/);
  assert.match(transitionSource, /releaseRecommendation/);
  assert.doesNotMatch(transitionSource, /prisma\./);
  assert.doesNotMatch(transitionSource, /fetch\(/);
  assert.doesNotMatch(transitionSource, /checkoutOrder\.update/);
  assert.doesNotMatch(transitionSource, /checkoutPaymentAttempt\.update/);

  assert.match(previewSource, /planPaymentOperationTransition/);
  assert.match(previewSource, /transition: PaymentOperationTransitionPlan/);
  assert.match(previewSource, /warnings = plan\.reasons\.map\(reasonCopy\)/);
  assert.doesNotMatch(previewSource, /prisma\./);
  assert.doesNotMatch(previewSource, /fetch\(/);
  assert.doesNotMatch(previewSource, /checkoutOrder\.update/);
  assert.doesNotMatch(previewSource, /checkoutPaymentAttempt\.update/);

  assert.match(previewInputSource, /fulfillmentStatus/);
  assert.match(previewInputSource, /hasPerishableCapacity/);
  assert.match(previewInputSource, /invalid_fulfillment_status/);
  assert.doesNotMatch(previewInputSource, /prisma\./);
  assert.doesNotMatch(previewInputSource, /fetch\(/);

  assert.match(previewViewSource, /transitionRows/);
  assert.match(previewViewSource, /Order recommendation/);
  assert.match(previewViewSource, /Payment recommendation/);
  assert.match(previewViewSource, /Release recommendation/);
  assert.match(previewViewSource, /Operator approval/);
  assert.doesNotMatch(previewViewSource, /prisma\./);
  assert.doesNotMatch(previewViewSource, /fetch\(/);

  assert.match(adminPreviewPanelSource, /Advisory transition plan/);
  assert.match(adminPreviewPanelSource, /transitionRows/);
  assert.match(adminPreviewPanelSource, /read-only and apply only after future provider success/);
  assert.doesNotMatch(adminPreviewPanelSource, /prisma\./);
  assert.doesNotMatch(adminPreviewPanelSource, /fetch\(/);
  assert.doesNotMatch(adminPreviewPanelSource, /checkoutOrder\.update/);
  assert.doesNotMatch(adminPreviewPanelSource, /checkoutPaymentAttempt\.update/);
  assert.doesNotMatch(adminPreviewPanelSource, /onClick=/);
  assert.doesNotMatch(adminPreviewPanelSource, /<button/);

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

  const normalizedTransitionInput = normalizePaymentOperationPreviewInput({
    operation: 'refund',
    orderStatus: 'paid',
    orderTotalCents: '420000',
    orderCurrency: 'usd',
    paymentProvider: 'stripe',
    paymentStatus: 'paid',
    paymentAmountCents: '420000',
    paymentCurrency: 'usd',
    providerReference: 'pi_preview_123',
    amountCents: '210000',
    fulfillmentStatus: 'scheduled',
    hasPerishableCapacity: 'false'
  });
  assert.equal(normalizedTransitionInput.ok, true);
  if (normalizedTransitionInput.ok) {
    assert.equal(normalizedTransitionInput.input.fulfillmentStatus, 'scheduled');
    assert.equal(normalizedTransitionInput.input.hasPerishableCapacity, false);
  }

  const invalidTransitionInput = normalizePaymentOperationPreviewInput({
    operation: 'refund',
    orderStatus: 'paid',
    orderTotalCents: '420000',
    orderCurrency: 'usd',
    paymentProvider: 'stripe',
    paymentStatus: 'paid',
    paymentAmountCents: '420000',
    paymentCurrency: 'usd',
    providerReference: 'pi_preview_123',
    fulfillmentStatus: 'packed'
  });
  assert.equal(invalidTransitionInput.ok, false);
  if (!invalidTransitionInput.ok) {
    assert.ok(invalidTransitionInput.errors.some((error) => error.field === 'fulfillmentStatus' && error.code === 'invalid_fulfillment_status'));
  }

  const previewWithTransition = buildPaymentOperationPreview({
    operation: 'refund',
    order: { status: 'paid', totalCents: 420000, currency: 'USD' },
    payment: {
      provider: 'stripe',
      status: 'paid',
      amountCents: 420000,
      currency: 'USD',
      providerReference: 'payment-reference'
    },
    fulfillmentStatus: 'delivered'
  });
  assert.equal(previewWithTransition.transition.releaseRecommendation, 'manual_review');
  assert.deepEqual(previewWithTransition.warnings, []);
  assert.ok(previewWithTransition.transition.notes.some((note) => note.includes('Full refunds after fulfillment starts')));

  const previewViewWithTransition = buildPaymentOperationPreviewView({
    operation: 'void',
    order: { status: 'pending_payment', totalCents: 420000, currency: 'USD' },
    payment: {
      provider: 'stripe',
      status: 'authorized',
      amountCents: 420000,
      currency: 'USD',
      providerReference: 'authorization-reference'
    },
    fulfillmentStatus: 'unfulfilled'
  });
  assert.deepEqual(previewViewWithTransition.transitionRows.map((row) => row.label), [
    'Order recommendation',
    'Payment recommendation',
    'Release recommendation',
    'Operator approval',
    'Release reasons'
  ]);
  assert.equal(previewViewWithTransition.transitionRows[0].value, 'cancelled after provider success');
  assert.equal(previewViewWithTransition.transitionRows[2].value, 'evaluate capacity release');

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
