import assert from 'node:assert/strict';

import { planPaymentOperation } from '../../lib/checkout/payment-operation-plan';

export async function runPaymentOperationPlanTests() {
  const refund = planPaymentOperation({
    operation: 'refund',
    order: { status: 'paid', totalCents: 420000, currency: 'USD' },
    payment: {
      provider: 'stripe',
      status: 'paid',
      amountCents: 420000,
      currency: 'usd',
      providerReference: 'payment-reference'
    },
    amountCents: 210000,
    reason: 'Customer requested partial refund'
  });
  assert.equal(refund.decision, 'ready');
  assert.equal(refund.operation, 'refund');
  assert.equal(refund.provider, 'stripe');
  assert.equal(refund.amountCents, 210000);
  assert.equal(refund.currency, 'USD');
  assert.equal(refund.requiresProviderReference, true);
  assert.equal(refund.manualOnly, false);
  assert.deepEqual(refund.reasons, []);
  assert.equal(refund.metadata.partialAmount, true);
  assert.equal(refund.metadata.fullAmount, false);
  assert.equal(refund.metadata.reason, 'Customer requested partial refund');

  const missingReference = planPaymentOperation({
    operation: 'refund',
    order: { status: 'paid', totalCents: 10000, currency: 'USD' },
    payment: { provider: 'stripe', status: 'paid', amountCents: 10000, currency: 'USD' }
  });
  assert.equal(missingReference.decision, 'blocked');
  assert.deepEqual(missingReference.reasons, ['provider_reference_required']);

  const manualRefund = planPaymentOperation({
    operation: 'refund',
    order: { status: 'paid', totalCents: 15000, currency: 'USD' },
    payment: { provider: 'manual', status: 'paid', amountCents: 15000, currency: 'USD' }
  });
  assert.equal(manualRefund.decision, 'manual_review');
  assert.equal(manualRefund.manualOnly, true);
  assert.equal(manualRefund.requiresProviderReference, false);

  const voidPlan = planPaymentOperation({
    operation: 'void',
    order: { status: 'pending_payment', totalCents: 50000, currency: 'USD' },
    payment: {
      provider: 'stripe',
      status: 'authorized',
      amountCents: 50000,
      currency: 'USD',
      providerReference: 'authorization-reference'
    }
  });
  assert.equal(voidPlan.decision, 'ready');
  assert.equal(voidPlan.operation, 'void');
  assert.equal(voidPlan.metadata.fullAmount, true);

  const blockedVoid = planPaymentOperation({
    operation: 'void',
    order: { status: 'paid', totalCents: 50000, currency: 'USD' },
    payment: {
      provider: 'stripe',
      status: 'paid',
      amountCents: 50000,
      currency: 'USD',
      providerReference: 'captured-payment'
    }
  });
  assert.equal(blockedVoid.decision, 'blocked');
  assert.deepEqual(blockedVoid.reasons, ['payment_status_not_voidable']);

  const invalidAmount = planPaymentOperation({
    operation: 'refund',
    order: { status: 'paid', totalCents: 10000, currency: 'USD' },
    payment: {
      provider: 'stripe',
      status: 'paid',
      amountCents: 10000,
      currency: 'USD',
      providerReference: 'payment-reference'
    },
    amountCents: 12000
  });
  assert.equal(invalidAmount.decision, 'blocked');
  assert.deepEqual(invalidAmount.reasons, ['operation_amount_exceeds_payment_amount']);

  const currencyMismatch = planPaymentOperation({
    operation: 'refund',
    order: { status: 'paid', totalCents: 10000, currency: 'USD' },
    payment: {
      provider: 'zarinpal',
      status: 'settled',
      amountCents: 10000,
      currency: 'TOMAN',
      providerReference: 'authority-reference'
    }
  });
  assert.equal(currencyMismatch.decision, 'blocked');
  assert.deepEqual(currencyMismatch.reasons, ['order_payment_currency_mismatch']);

  console.log('payment-operation-plan.test.ts passed');
}
