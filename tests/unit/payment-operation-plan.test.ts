import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { planPaymentOperation } from '../../lib/checkout/payment-operation-plan';
import { buildPaymentOperationPreview } from '../../lib/checkout/payment-operation-preview';
import { buildPaymentOperationPreviewRouteResult } from '../../lib/checkout/payment-operation-preview-route-core';
import { buildPaymentOperationPreviewView } from '../../lib/checkout/payment-operation-preview-view';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentOperationPlanTests() {
  const docs = source('docs/production-roadmap-phase33-payment-operations.md');
  const previewSource = source('lib/checkout/payment-operation-preview.ts');
  const previewRouteCoreSource = source('lib/checkout/payment-operation-preview-route-core.ts');
  const previewViewSource = source('lib/checkout/payment-operation-preview-view.ts');
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

  assert.match(previewSource, /export function buildPaymentOperationPreview/);
  assert.match(previewSource, /planPaymentOperation\(input\)/);
  assert.doesNotMatch(previewSource, /prisma\./);
  assert.doesNotMatch(previewSource, /fetch\(/);
  assert.doesNotMatch(previewSource, /checkoutOrder\.update/);
  assert.doesNotMatch(previewSource, /checkoutPaymentAttempt\.update/);

  assert.match(previewViewSource, /export function buildPaymentOperationPreviewView/);
  assert.match(previewViewSource, /buildPaymentOperationPreview\(input\)/);
  assert.doesNotMatch(previewViewSource, /prisma\./);
  assert.doesNotMatch(previewViewSource, /fetch\(/);
  assert.doesNotMatch(previewViewSource, /checkoutOrder\.update/);
  assert.doesNotMatch(previewViewSource, /checkoutPaymentAttempt\.update/);

  assert.match(previewRouteCoreSource, /export function buildPaymentOperationPreviewRouteResult/);
  assert.match(previewRouteCoreSource, /buildPaymentOperationPreviewView\(input\)/);
  assert.doesNotMatch(previewRouteCoreSource, /prisma\./);
  assert.doesNotMatch(previewRouteCoreSource, /fetch\(/);
  assert.doesNotMatch(previewRouteCoreSource, /checkoutOrder\.update/);
  assert.doesNotMatch(previewRouteCoreSource, /checkoutPaymentAttempt\.update/);

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

  const readyPreview = buildPaymentOperationPreview({
    operation: 'refund',
    order: { status: 'paid', totalCents: 420000, currency: 'USD' },
    payment: {
      provider: 'stripe',
      status: 'paid',
      amountCents: 420000,
      currency: 'USD',
      providerReference: 'payment-reference'
    },
    amountCents: 210000,
    orderNumber: 'GOL-1001',
    paymentAttemptId: 'attempt-1'
  });
  assert.equal(readyPreview.canSubmit, true);
  assert.equal(readyPreview.blocked, false);
  assert.equal(readyPreview.requiresManualReview, false);
  assert.equal(readyPreview.orderNumber, 'GOL-1001');
  assert.equal(readyPreview.paymentAttemptId, 'attempt-1');
  assert.equal(readyPreview.plan.decision, 'ready');
  assert.match(readyPreview.summary, /Refund preview/);
  assert.match(readyPreview.nextAction, /Provider execution can be added only after preview, persistence, audit, and idempotency rules are defined/);
  assert.deepEqual(readyPreview.warnings, []);

  const readyView = buildPaymentOperationPreviewView({
    operation: 'refund',
    order: { status: 'paid', totalCents: 420000, currency: 'USD' },
    payment: {
      provider: 'stripe',
      status: 'paid',
      amountCents: 420000,
      currency: 'USD',
      providerReference: 'payment-reference'
    },
    amountCents: 210000,
    orderNumber: 'GOL-1001',
    paymentAttemptId: 'attempt-1'
  });
  assert.equal(readyView.tone, 'success');
  assert.equal(readyView.statusLabel, 'Ready for preview approval');
  assert.equal(readyView.actionLabel, 'Preview only');
  assert.match(readyView.disabledReason ?? '', /does not submit/);
  assert.deepEqual(readyView.detailRows.map((row) => row.label), [
    'Order',
    'Operation',
    'Decision',
    'Provider',
    'Amount',
    'Provider reference required',
    'Manual review',
    'Payment attempt'
  ]);

  const readyRouteResult = buildPaymentOperationPreviewRouteResult({
    operation: 'refund',
    order: { status: 'paid', totalCents: 420000, currency: 'USD' },
    payment: {
      provider: 'stripe',
      status: 'paid',
      amountCents: 420000,
      currency: 'USD',
      providerReference: 'payment-reference'
    },
    amountCents: 210000,
    orderNumber: 'GOL-1001',
    paymentAttemptId: 'attempt-1'
  });
  assert.equal(readyRouteResult.status, 200);
  assert.equal(readyRouteResult.body.ok, true);
  assert.equal(readyRouteResult.body.preview.statusLabel, 'Ready for preview approval');

  const missingReference = planPaymentOperation({
    operation: 'refund',
    order: { status: 'paid', totalCents: 10000, currency: 'USD' },
    payment: { provider: 'stripe', status: 'paid', amountCents: 10000, currency: 'USD' }
  });
  assert.equal(missingReference.decision, 'blocked');
  assert.deepEqual(missingReference.reasons, ['provider_reference_required']);

  const blockedPreview = buildPaymentOperationPreview({
    operation: 'refund',
    order: { status: 'paid', totalCents: 10000, currency: 'USD' },
    payment: { provider: 'stripe', status: 'paid', amountCents: 10000, currency: 'USD' }
  });
  assert.equal(blockedPreview.canSubmit, false);
  assert.equal(blockedPreview.blocked, true);
  assert.equal(blockedPreview.requiresManualReview, false);
  assert.deepEqual(blockedPreview.warnings, [
    'A provider reference is required before this operation can be sent to a live payment provider.'
  ]);

  const blockedView = buildPaymentOperationPreviewView({
    operation: 'refund',
    order: { status: 'paid', totalCents: 10000, currency: 'USD' },
    payment: { provider: 'stripe', status: 'paid', amountCents: 10000, currency: 'USD' }
  });
  assert.equal(blockedView.tone, 'danger');
  assert.equal(blockedView.statusLabel, 'Blocked');
  assert.equal(blockedView.actionLabel, 'Resolve blockers');
  assert.match(blockedView.disabledReason ?? '', /blocked/);

  const manualRefund = planPaymentOperation({
    operation: 'refund',
    order: { status: 'paid', totalCents: 15000, currency: 'USD' },
    payment: { provider: 'manual', status: 'paid', amountCents: 15000, currency: 'USD' }
  });
  assert.equal(manualRefund.decision, 'manual_review');
  assert.equal(manualRefund.manualOnly, true);
  assert.equal(manualRefund.requiresProviderReference, false);

  const manualPreview = buildPaymentOperationPreview({
    operation: 'refund',
    order: { status: 'paid', totalCents: 15000, currency: 'USD' },
    payment: { provider: 'manual', status: 'paid', amountCents: 15000, currency: 'USD' }
  });
  assert.equal(manualPreview.canSubmit, false);
  assert.equal(manualPreview.blocked, false);
  assert.equal(manualPreview.requiresManualReview, true);
  assert.match(manualPreview.nextAction, /Handle this operation manually/);

  const manualView = buildPaymentOperationPreviewView({
    operation: 'refund',
    order: { status: 'paid', totalCents: 15000, currency: 'USD' },
    payment: { provider: 'manual', status: 'paid', amountCents: 15000, currency: 'USD' }
  });
  assert.equal(manualView.tone, 'warning');
  assert.equal(manualView.statusLabel, 'Manual review required');
  assert.equal(manualView.actionLabel, 'Record manual review');
  assert.match(manualView.disabledReason ?? '', /Manual-review operations/);

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
