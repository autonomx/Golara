import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildStripePaymentOperationRequest,
  buildZarinPalPaymentOperationRequest,
  createManualReviewPaymentOperationAdapter,
  createMockPaymentOperationAdapter,
  createMockPaymentOperationAdapters,
  createStripePaymentOperationHttpAdapter,
  createUnavailablePaymentOperationAdapter,
  createZarinPalPaymentOperationHttpAdapter,
  executePaymentOperationAdapter,
  normalizePaymentOperationAdapterProvider,
  normalizeStripePaymentOperationResponse,
  normalizeZarinPalPaymentOperationResponse,
  type ProviderPaymentOperationRequest
} from '../../lib/checkout/payment-operation-adapters';
import {
  refundVoidAdapterBoundaryMetadata,
  resolvePaymentOperationAdapterProviderForMethod
} from '../../lib/checkout/payment-operation-method-boundary';

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
  const methodBoundarySource = source('lib/checkout/payment-operation-method-boundary.ts');
  const phase33Docs = source('docs/production-roadmap-phase33-payment-operations.md');
  const paymentRoadmap = source('docs/digikala-style-payment-remaining-phases.md');

  assert.equal(normalizePaymentOperationAdapterProvider(' Stripe '), 'stripe');
  assert.equal(normalizePaymentOperationAdapterProvider('zarin-pal'), 'zarinpal');
  assert.equal(normalizePaymentOperationAdapterProvider('assisted'), 'manual');
  assert.equal(normalizePaymentOperationAdapterProvider('inquiry'), 'manual');
  assert.equal(normalizePaymentOperationAdapterProvider('other'), 'unknown');

  assert.equal(resolvePaymentOperationAdapterProviderForMethod({ methodKey: 'zarinpal', methodType: 'gateway', provider: 'zarinpal' }), 'zarinpal');
  assert.equal(resolvePaymentOperationAdapterProviderForMethod({ methodKey: 'iranian-ipg', methodType: 'gateway', provider: 'iranian' }), 'zarinpal');
  assert.equal(resolvePaymentOperationAdapterProviderForMethod({ methodKey: 'stripe-card', methodType: 'gateway', providerKey: 'stripe' }), 'stripe');
  assert.equal(resolvePaymentOperationAdapterProviderForMethod({ methodKey: 'wallet', methodType: 'wallet' }), 'manual');
  assert.equal(resolvePaymentOperationAdapterProviderForMethod({ methodKey: 'unknown-gateway', methodType: 'gateway' }), 'unknown');
  assert.equal(resolvePaymentOperationAdapterProviderForMethod({ metadata: { paymentMethodKey: 'domestic-ipg', paymentMethodType: 'gateway', paymentProvider: 'iranian' } }), 'zarinpal');

  const boundaryMetadata = refundVoidAdapterBoundaryMetadata({
    methodKey: 'iranian-ipg',
    methodType: 'gateway',
    provider: 'iranian',
    providerKey: 'domestic-ipg'
  });
  assert.equal(boundaryMetadata.gatewayRefundVoidBoundaryVersion, 'p6.gateway-refund-void-boundary.v1');
  assert.equal(boundaryMetadata.gatewayRefundVoidAdapterProvider, 'zarinpal');
  assert.equal(boundaryMetadata.gatewayRefundVoidSupportsRefund, true);
  assert.equal(boundaryMetadata.gatewayRefundVoidSupportsVoid, true);

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

  const explicitManual = await createManualReviewPaymentOperationAdapter().execute(operation);
  assert.equal(explicitManual.provider, 'manual');
  assert.equal(explicitManual.status, 'manual_review');
  assert.equal(explicitManual.providerOperationReference, 'manual:refund:op_123');
  assert.equal(explicitManual.metadata.reason, 'Customer request');

  const unavailable = createUnavailablePaymentOperationAdapter('unknown', 'Custom unavailable message.');
  const unavailableResult = await unavailable.execute(operation);
  assert.equal(unavailableResult.provider, 'unknown');
  assert.equal(unavailableResult.status, 'unavailable');
  assert.equal(unavailableResult.errorCategory, 'provider_operation_not_configured');
  assert.equal(unavailableResult.message, 'Custom unavailable message.');

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

  const missingStripeReference = buildStripePaymentOperationRequest({ ...operation, providerReference: '   ' }, 'configured-secret');
  assert.equal('status' in missingStripeReference && missingStripeReference.status, 'failed');
  assert.equal('errorCategory' in missingStripeReference && missingStripeReference.errorCategory, 'provider_reference_required');
  assert.equal('retryable' in missingStripeReference && missingStripeReference.retryable, false);

  const stripeRequest = buildStripePaymentOperationRequest(operation, 'configured-secret');
  assert.equal('method' in stripeRequest && stripeRequest.method, 'POST');
  assert.equal('endpoint' in stripeRequest && stripeRequest.endpoint, 'stripe.refunds.create');
  assert.ok('body' in stripeRequest && stripeRequest.body.includes('payment_intent=pi_123'));
  assert.ok('body' in stripeRequest && stripeRequest.body.includes('amount=4200'));
  assert.ok('body' in stripeRequest && stripeRequest.body.includes('metadata%5Bgolara_reason%5D=Customer+request'));
  assert.equal('headers' in stripeRequest && stripeRequest.headers['Idempotency-Key'], 'payment-operation:op_123');

  const stripeVoidRequest = buildStripePaymentOperationRequest({ ...operation, operationKind: 'void' }, 'configured-secret');
  assert.equal('endpoint' in stripeVoidRequest && stripeVoidRequest.endpoint, 'stripe.payment_intents.cancel');
  assert.equal('body' in stripeVoidRequest && stripeVoidRequest.body.includes('payment_intent='), false);

  const stripeSuccess = normalizeStripePaymentOperationResponse(operation, { ok: true, status: 200, body: { id: 're_123', status: 'succeeded' } });
  assert.equal(stripeSuccess.status, 'succeeded');
  assert.equal(stripeSuccess.providerOperationReference, 're_123');
  assert.equal(stripeSuccess.providerStatus, 'succeeded');
  assert.equal(stripeSuccess.retryable, false);

  const stripeRetryable = normalizeStripePaymentOperationResponse(operation, { ok: false, status: 503, body: { error: { message: 'Temporarily unavailable' } } });
  assert.equal(stripeRetryable.status, 'failed');
  assert.equal(stripeRetryable.errorCategory, 'provider_retryable_error');
  assert.equal(stripeRetryable.retryable, true);
  assert.equal(stripeRetryable.message, 'Temporarily unavailable');

  const stripeRejectedFallback = normalizeStripePaymentOperationResponse(operation, { ok: false, status: 402, body: { status: 'requires_action' } });
  assert.equal(stripeRejectedFallback.status, 'failed');
  assert.equal(stripeRejectedFallback.errorCategory, 'provider_rejected_operation');
  assert.equal(stripeRejectedFallback.providerStatus, 'requires_action');
  assert.equal(stripeRejectedFallback.retryable, false);
  assert.equal(stripeRejectedFallback.message, 'Stripe returned HTTP 402.');

  const missingZarinPalCredentials = buildZarinPalPaymentOperationRequest(operation);
  assert.equal('status' in missingZarinPalCredentials && missingZarinPalCredentials.status, 'unavailable');
  assert.equal('errorCategory' in missingZarinPalCredentials && missingZarinPalCredentials.errorCategory, 'provider_credentials_missing');

  const missingZarinPalReference = buildZarinPalPaymentOperationRequest({ ...operation, providerReference: '' }, 'merchant-123');
  assert.equal('status' in missingZarinPalReference && missingZarinPalReference.status, 'failed');
  assert.equal('errorCategory' in missingZarinPalReference && missingZarinPalReference.errorCategory, 'provider_reference_required');
  assert.equal('retryable' in missingZarinPalReference && missingZarinPalReference.retryable, false);

  const zarinpalRequest = buildZarinPalPaymentOperationRequest(operation, 'merchant-123');
  assert.equal('method' in zarinpalRequest && zarinpalRequest.method, 'POST');
  assert.equal('endpoint' in zarinpalRequest && zarinpalRequest.endpoint, 'zarinpal.payment.refund');
  assert.ok('body' in zarinpalRequest && zarinpalRequest.body.includes('merchant-123'));
  assert.ok('body' in zarinpalRequest && zarinpalRequest.body.includes('pi_123'));
  assert.equal('headers' in zarinpalRequest && zarinpalRequest.headers['Idempotency-Key'], 'payment-operation:op_123');

  const zarinpalVoidRequest = buildZarinPalPaymentOperationRequest({ ...operation, operationKind: 'void', reason: '  ' }, 'merchant-123');
  assert.equal('endpoint' in zarinpalVoidRequest && zarinpalVoidRequest.endpoint, 'zarinpal.payment.reverse');
  assert.ok('body' in zarinpalVoidRequest && zarinpalVoidRequest.body.includes('Golara void op_123'));

  const zarinpalSuccess = normalizeZarinPalPaymentOperationResponse(operation, { ok: true, status: 200, body: { data: { ref_id: 'zp_ref_123', code: 100 } } });
  assert.equal(zarinpalSuccess.status, 'succeeded');
  assert.equal(zarinpalSuccess.providerOperationReference, 'zp_ref_123');
  assert.equal(zarinpalSuccess.providerStatus, '100');
  assert.equal(zarinpalSuccess.retryable, false);

  const zarinpalAlreadySettled = normalizeZarinPalPaymentOperationResponse(operation, { ok: true, status: 200, body: { data: { refId: 'zp_ref_101', code: 101 } } });
  assert.equal(zarinpalAlreadySettled.status, 'succeeded');
  assert.equal(zarinpalAlreadySettled.providerOperationReference, 'zp_ref_101');
  assert.equal(zarinpalAlreadySettled.providerStatus, '101');

  const zarinpalOkStatus = normalizeZarinPalPaymentOperationResponse(operation, { ok: true, status: 200, body: { data: { authority: 'zp_auth_123', status: 'ok' } } });
  assert.equal(zarinpalOkStatus.status, 'succeeded');
  assert.equal(zarinpalOkStatus.providerOperationReference, 'zp_auth_123');
  assert.equal(zarinpalOkStatus.providerStatus, 'ok');

  const zarinpalRejected = normalizeZarinPalPaymentOperationResponse(operation, { ok: false, status: 400, body: { message: 'Rejected' } });
  assert.equal(zarinpalRejected.status, 'failed');
  assert.equal(zarinpalRejected.errorCategory, 'provider_rejected_operation');
  assert.equal(zarinpalRejected.retryable, false);
  assert.equal(zarinpalRejected.message, 'Rejected');

  const zarinpalRetryableFallback = normalizeZarinPalPaymentOperationResponse(operation, { ok: false, status: 502, body: null });
  assert.equal(zarinpalRetryableFallback.status, 'failed');
  assert.equal(zarinpalRetryableFallback.errorCategory, 'provider_retryable_error');
  assert.equal(zarinpalRetryableFallback.retryable, true);
  assert.equal(zarinpalRetryableFallback.message, 'ZarinPal returned HTTP 502.');

  const stripeHttpMissing = await createStripePaymentOperationHttpAdapter({ secretKey: 'configured-secret' }).execute(operation);
  assert.equal(stripeHttpMissing.status, 'unavailable');
  assert.equal(stripeHttpMissing.errorCategory, 'provider_http_client_missing');

  const stripeHttpRequests: ProviderPaymentOperationRequest[] = [];
  const stripeHttp = createStripePaymentOperationHttpAdapter({
    secretKey: 'configured-secret',
    httpClient: async (request) => {
      stripeHttpRequests.push(request);
      return { ok: true, status: 200, body: { id: 're_http_123', status: 'succeeded' } };
    }
  });
  const stripeHttpResult = await stripeHttp.execute(operation);
  assert.equal(stripeHttpResult.status, 'succeeded');
  assert.equal(stripeHttpResult.providerOperationReference, 're_http_123');
  assert.equal(stripeHttpRequests.length, 1);
  assert.equal(stripeHttpRequests[0].endpoint, 'stripe.refunds.create');

  const stripeHttpNoCredentials = await createStripePaymentOperationHttpAdapter({ httpClient: async () => ({ ok: true, status: 200, body: { id: 'unused' } }) }).execute(operation);
  assert.equal(stripeHttpNoCredentials.status, 'unavailable');
  assert.equal(stripeHttpNoCredentials.errorCategory, 'provider_credentials_missing');

  const zarinpalHttpMissing = await createZarinPalPaymentOperationHttpAdapter({ merchantId: 'merchant-123' }).execute(operation);
  assert.equal(zarinpalHttpMissing.status, 'unavailable');
  assert.equal(zarinpalHttpMissing.errorCategory, 'provider_http_client_missing');

  const zarinpalHttpRequests: ProviderPaymentOperationRequest[] = [];
  const zarinpalHttp = createZarinPalPaymentOperationHttpAdapter({
    merchantId: 'merchant-123',
    httpClient: async (request) => {
      zarinpalHttpRequests.push(request);
      return { ok: true, status: 200, body: { data: { ref_id: 'zp_http_123', code: 100 } } };
    }
  });
  const zarinpalHttpResult = await zarinpalHttp.execute(operation);
  assert.equal(zarinpalHttpResult.status, 'succeeded');
  assert.equal(zarinpalHttpResult.providerOperationReference, 'zp_http_123');
  assert.equal(zarinpalHttpRequests.length, 1);
  assert.equal(zarinpalHttpRequests[0].endpoint, 'zarinpal.payment.refund');

  const zarinpalHttpNoCredentials = await createZarinPalPaymentOperationHttpAdapter({ httpClient: async () => ({ ok: true, status: 200, body: { data: { code: 100 } } }) }).execute(operation);
  assert.equal(zarinpalHttpNoCredentials.status, 'unavailable');
  assert.equal(zarinpalHttpNoCredentials.errorCategory, 'provider_credentials_missing');

  assert.ok(adapterSource.includes('PaymentOperationAdapter'));
  assert.ok(adapterSource.includes('PaymentOperationAdapterResult'));
  assert.ok(adapterSource.includes('ProviderPaymentOperationRequest'));
  assert.ok(adapterSource.includes('ProviderPaymentOperationHttpClient'));
  assert.ok(adapterSource.includes('buildStripePaymentOperationRequest'));
  assert.ok(adapterSource.includes('normalizeStripePaymentOperationResponse'));
  assert.ok(adapterSource.includes('buildZarinPalPaymentOperationRequest'));
  assert.ok(adapterSource.includes('normalizeZarinPalPaymentOperationResponse'));
  assert.ok(adapterSource.includes('createStripePaymentOperationHttpAdapter'));
  assert.ok(adapterSource.includes('createZarinPalPaymentOperationHttpAdapter'));
  assert.ok(adapterSource.includes('provider_http_client_missing'));
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

  assert.ok(methodBoundarySource.includes('GATEWAY_REFUND_VOID_ADAPTER_BOUNDARY_VERSION'));
  assert.ok(methodBoundarySource.includes('METHOD_KEY_REFUND_VOID_ADAPTERS'));
  assert.ok(methodBoundarySource.includes('PROVIDER_REFUND_VOID_ADAPTERS'));
  assert.ok(methodBoundarySource.includes('resolvePaymentOperationAdapterProviderForMethod'));
  assert.ok(methodBoundarySource.includes('refundVoidAdapterBoundaryMetadata'));
  assert.equal(methodBoundarySource.includes('@prisma/client'), false);
  assert.equal(methodBoundarySource.includes('prisma.'), false);

  assert.ok(phase33Docs.includes('provider operation adapter contract'));
  assert.ok(phase33Docs.includes('provider-specific request/response mappers'));
  assert.ok(phase33Docs.includes('symbolic provider endpoints'));
  assert.ok(phase33Docs.includes('injected provider HTTP client boundary'));
  assert.ok(phase33Docs.includes('lib/checkout/payment-operation-adapters.ts'));
  assert.ok(phase33Docs.includes('tests/unit/payment-operation-adapters.test.ts'));
  assert.ok(phase33Docs.includes('raising the runner count from 118 to 119 files'));
  assert.ok(phase33Docs.includes('no live Stripe or ZarinPal refund/void HTTP calls'));

  assert.ok(paymentRoadmap.includes('Gateway refund/void adapter boundary maps selected method metadata to the existing refund/void provider adapters.'));
  assert.ok(paymentRoadmap.includes('Start **Phase P6 — manual-transfer refund tracking**'));

  console.log('payment-operation-adapters.test.ts passed');
}
