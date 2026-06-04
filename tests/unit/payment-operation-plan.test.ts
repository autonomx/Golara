import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { planPaymentOperation } from '../../lib/checkout/payment-operation-plan';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentOperationPlanTests() {
  const docs = source('docs/production-roadmap-phase33-payment-operations.md');
  assert.match(docs, /Phase 33 Refunds, Voids, and Payment Operations Progress/);
  assert.match(docs, /provider-neutral refund\/void planning helper/);
  assert.match(docs, /does not call Stripe, ZarinPal, or any other live provider/);
  assert.match(docs, /does not mutate payment attempts, orders, refunds, inventory, or audit logs/);
  assert.match(docs, /lib\/checkout\/payment-operation-plan\.ts/);
  assert.match(docs, /tests\/unit\/payment-operation-plan\.test\.ts/);
  assert.match(docs, /raising the runner count from 115 to 116 files/);
  assert.match(docs, /no-mutation preview acceptance criteria/);
  assert.match(docs, /## Preview boundary acceptance criteria/);
  assert.match(docs, /call `planPaymentOperation` as the single source of eligibility truth/);
  assert.match(docs, /return a preview payload that is safe for admin display/);
  assert.match(docs, /include operation kind, decision, provider, amount, currency, reasons, manual-review state, and provider-reference requirements/);
  assert.match(docs, /avoid database writes/);
  assert.match(docs, /avoid checkout order mutation/);
  assert.match(docs, /avoid payment attempt mutation/);
  assert.match(docs, /avoid live provider calls/);
  assert.match(docs, /live provider refund calls/);
  assert.match(docs, /live provider void calls/);
  assert.match(docs, /database writes/);
  assert.match(docs, /admin refund\/void buttons/);
  assert.match(docs, /local verification is pending/);

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
