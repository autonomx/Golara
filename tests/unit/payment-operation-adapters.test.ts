import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  createMockPaymentOperationAdapter,
  createMockPaymentOperationAdapters,
  createUnavailablePaymentOperationAdapter,
  executePaymentOperationAdapter,
  normalizePaymentOperationAdapterProvider
} from '../../lib/checkout/payment-operation-adapters';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

const operation = {
  operationKind: 'refund' as const,
  paymentOperationRecordId: 'op_123',
  orderId: 'order_123',
  paymentAttemptId: 'attempt_123',
  amountCents: 4200,
  currency: 'usd',
  providerReference: 'pi_123',
  idempotencyKey: 'payment-operation:op_123',
  reason: 'Customer request',
  metadata: { source: 'unit_guard' }
};

export async function runPaymentOperationAdaptersTests() {
  const adapterSource = source('lib/checkout/payment-operation-adapters.ts');
  const phase33Docs = source('docs/production-roadmap-phase33-payment-operations.md');

  assert.equal(normalizePaymentOperationAdapterProvider(' Stripe '), 'stripe');
  assert.equal(normalizePaymentOperationAdapterProvider('zarin-pal'), 'zarinpal');
  assert.equal(normalizePaymentOperationAdapterProvider('assisted'), 'manual');
  assert.equal(normalizePaymentOperationAdapterProvider('other'), 'unknown');

  const stripe = createMockPaymentOperationAdapter('stripe');
  const stripeResult = await stripe.execute(operation);
  assert.equal(stripeResult.provider, 'stripe');
  assert.equal(stripeResult.operationKind, 'refund');
  assert.equal(stripeResult.status, 'succeeded');
  assert.equal(stripeResult.providerOperationReference, 'stripe:refund:op_123');
  assert.equal(stripeResult.providerStatus, 'refund_succeeded');
  assert.equal(stripeResult.retryable, false);
  assert.equal(stripeResult.metadata.paymentOperationRecordId, 'op_123');
  assert.equal(stripeResult.metadata.currency, 'USD');

  const missingReferenceResult = await stripe.execute({ ...operation, providerReference: null });
  assert.equal(missingReferenceResult.status, 'failed');
  assert.equal(missingReferenceResult.errorCategory, 'provider_reference_required');
  assert.equal(missingReferenceResult.retryable, false);

  const manual = createMockPaymentOperationAdapter('manual');
  const manualResult = await manual.execute({ ...operation, operationKind: 'void', providerReference: null });
  assert.equal(manualResult.provider, 'manual');
  assert.equal(manualResult.operationKind, 'void');
  assert.equal(manualResult.status, 'manual_review');
  assert.equal(manualResult.providerStatus, 'manual_review_required');

  const unavailable = createUnavailablePaymentOperationAdapter('unknown');
  const unavailableResult = await unavailable.execute(operation);
  assert.equal(unavailableResult.provider, 'unknown');
  assert.equal(unavailableResult.status, 'unavailable');
  assert.equal(unavailableResult.errorCategory, 'provider_operation_not_configured');

  const adapters = createMockPaymentOperationAdapters();
  const routed = await executePaymentOperationAdapter({ provider: 'zarinpal', operation, adapters });
  assert.equal(routed.provider, 'zarinpal');
  assert.equal(routed.status, 'succeeded');

  const unknown = await executePaymentOperationAdapter({ provider: 'not-real', operation, adapters });
  assert.equal(unknown.provider, 'unknown');
  assert.equal(unknown.status, 'unavailable');

  assert.ok(adapterSource.includes('PaymentOperationAdapter'));
  assert.ok(adapterSource.includes('PaymentOperationAdapterResult'));
  assert.ok(adapterSource.includes('createMockPaymentOperationAdapters'));
  assert.ok(adapterSource.includes('executePaymentOperationAdapter'));
  assert.ok(adapterSource.includes('provider_operation_not_configured'));
  assert.ok(adapterSource.includes('provider_reference_required'));
  assert.equal(adapterSource.includes('fetch('), false);
  assert.equal(adapterSource.includes('@prisma/client'), false);
  assert.equal(adapterSource.includes('prisma.'), false);
  assert.equal(adapterSource.includes('CheckoutOrder" SET'), false);
  assert.equal(adapterSource.includes('CheckoutPaymentAttempt" SET'), false);

  assert.ok(phase33Docs.includes('provider operation adapter contract'));
  assert.ok(phase33Docs.includes('lib/checkout/payment-operation-adapters.ts'));
  assert.ok(phase33Docs.includes('tests/unit/payment-operation-adapters.test.ts'));
  assert.ok(phase33Docs.includes('raising the runner count from 118 to 119 files'));
  assert.ok(phase33Docs.includes('no live Stripe or ZarinPal refund/void HTTP calls'));

  console.log('payment-operation-adapters.test.ts passed');
}
