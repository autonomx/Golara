import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildStripePaymentOperationRequest,
  buildZarinPalPaymentOperationRequest,
  createMockPaymentOperationAdapter,
  createMockPaymentOperationAdapters,
  createUnavailablePaymentOperationAdapter,
  executePaymentOperationAdapter,
  normalizePaymentOperationAdapterProvider,
  normalizeStripePaymentOperationResponse,
  normalizeZarinPalPaymentOperationResponse
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

  const missingStripeCredentials = buildStripePaymentOperationRequest(operation);
  assert.equal('status' in missingStripeCredentials && missingStripeCredentials.status, 'unavailable');
  assert.equal('errorCategory' in missingStripeCredentials && missingStripeCredentials.errorCategory, 'provider_credentials_missing');

  const stripeRequest = buildStripePaymentOperationRequest(operation, 'configured-secret');
  assert.equal('method' in stripeRequest && stripeRequest.method, 'POST');
  assert.equal('endpoint' in stripeRequest && stripeRequest.endpoint, 'stripe.refunds.create');
  assert.ok('body' in stripeRequest && stripeRequest.body.includes('payment_intent=pi_123'));
  assert.ok('body' in stripeRequest && stripeRequest.body.includes('amount=4200'));
  assert.equal('headers' in stripeRequest && stripeRequest.headers['Idempotency-Key'], 'payment-operation:op_123');

  const stripeVoidRequest = buildStripePaymentOperationRequest({ ...operation, operationKind: 'void' }, 'configured-secret');
  assert.equal('endpoint' in stripeVoidRequest && stripeVoidRequest.endpoint, 'stripe.payment_intents.cancel');

  const stripeSuccess = normalizeStripePaymentOperationResponse(operation, { ok: true, status: 200, body: { id: 're_123', status: 'succeeded' } });
  assert.equal(stripeSuccess.status, 'succeeded');
  assert.equal(stripeSuccess.providerOperationReference, 're_123');
  assert.equal(stripeSuccess.providerStatus, 'succeeded');
  assert.equal(stripeSuccess.retryable, false);

  const stripeRetryable = normalizeStripePaymentOperationResponse(operation, { ok: false, status: 503, body: { error: { message: 'Temporarily unavailable' } } });
  assert.equal(stripeRetryable.status, 'failed');
  assert.equal(stripeRetryable.errorCategory, 'provider_retryable_error');
  assert.equal(stripeRetryable.retryable, true);

  const missingZarinPalCredentials = buildZarinPalPaymentOperationRequest(operation);
  assert.equal('status' in missingZarinPalCredentials && missingZarinPalCredentials.status, 'unavailable');
  assert.equal('errorCategory' in missingZarinPalCredentials && missingZarinPalCredentials.errorCategory, 'provider_credentials_missing');

  const zarinpalRequest = buildZarinPalPaymentOperationRequest(operation, 'merchant-123');
  assert.equal('method' in zarinpalRequest && zarinpalRequest.method, 'POST');
  assert.equal('endpoint' in zarinpalRequest && zarinpalRequest.endpoint, 'zarinpal.payment.refund');
  assert.ok('body' in zarinpalRequest && zarinpalRequest.body.includes('merchant-123'));
  assert.ok('body' in zarinpalRequest && zarinpalRequest.body.includes('pi_123'));
  assert.equal('headers' in zarinpalRequest && zarinpalRequest.headers['Idempotency-Key'], 'payment-operation:op_123');

  const zarinpalVoidRequest = buildZarinPalPaymentOperationRequest({ ...operation, operationKind: 'void' }, 'merchant-123');
  assert.equal('endpoint' in zarinpalVoidRequest && zarinpalVoidRequest.endpoint, 'zarinpal.payment.reverse');

  const zarinpalSuccess = normalizeZarinPalPaymentOperationResponse(operation, { ok: true, status: 200, body: { data: { ref_id: 'zp_ref_123', code: 100 } } });
  assert.equal(zarinpalSuccess.status, 'succeeded');
  assert.equal(zarinpalSuccess.providerOperationReference, 'zp_ref_123');
  assert.equal(zarinpalSuccess.providerStatus, '100');
  assert.equal(zarinpalSuccess.retryable, false);

  const zarinpalRejected = normalizeZarinPalPaymentOperationResponse(operation, { ok: false, status: 400, body: { message: 'Rejected' } });
  assert.equal(zarinpalRejected.status, 'failed');
  assert.equal(zarinpalRejected.errorCategory, 'provider_rejected_operation');
  assert.equal(zarinpalRejected.retryable, false);

  assert.ok(adapterSource.includes('PaymentOperationAdapter'));
  assert.ok(adapterSource.includes('PaymentOperationAdapterResult'));
  assert.ok(adapterSource.includes('ProviderPaymentOperationRequest'));
  assert.ok(adapterSource.includes('buildStripePaymentOperationRequest'));
  assert.ok(adapterSource.includes('normalizeStripePaymentOperationResponse'));
  assert.ok(adapterSource.includes('buildZarinPalPaymentOperationRequest'));
  assert.ok(adapterSource.includes('normalizeZarinPalPaymentOperationResponse'));
  assert.ok(adapterSource.includes('createMockPaymentOperationAdapters'));
  assert.ok(adapterSource.includes('executePaymentOperationAdapter'));
  assert.ok(adapterSource.includes('provider_operation_not_configured'));
  assert.ok(adapterSource.includes('provider_reference_required'));
  assert.ok(adapterSource.includes('provider_retryable_error'));
  assert.equal(adapterSource.includes('fetch('), false);
  assert.equal(adapterSource.includes('@prisma/client'), false);
  assert.equal(adapterSource.includes('prisma.'), false);
  assert.equal(adapterSource.includes('CheckoutOrder" SET'), false);
  assert.equal(adapterSource.includes('CheckoutPaymentAttempt" SET'), false);

  assert.ok(phase33Docs.includes('provider operation adapter contract'));
  assert.ok(phase33Docs.includes('provider-specific request/response mappers'));
  assert.ok(phase33Docs.includes('symbolic provider endpoints'));
  assert.ok(phase33Docs.includes('lib/checkout/payment-operation-adapters.ts'));
  assert.ok(phase33Docs.includes('tests/unit/payment-operation-adapters.test.ts'));
  assert.ok(phase33Docs.includes('raising the runner count from 118 to 119 files'));
  assert.ok(phase33Docs.includes('no live Stripe or ZarinPal refund/void HTTP calls'));

  console.log('payment-operation-adapters.test.ts passed');
}
