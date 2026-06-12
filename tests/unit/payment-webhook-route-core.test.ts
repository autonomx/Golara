import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  handlePaymentWebhookRoute,
  validatePaymentWebhookRawBody
} from '../../lib/checkout/payment-webhook-route-core';
import type { PaymentWebhookEventInput } from '../../lib/checkout/payment-webhook-core';
import type { PaymentWebhookServiceResult } from '../../lib/checkout/payment-webhook-service';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentWebhookRouteCoreTests() {
  const routeCore = source('lib/checkout/payment-webhook-route-core.ts');
  const stripeRoute = source('app/api/webhooks/payments/stripe/route.ts');
  const zarinpalRoute = source('app/api/webhooks/payments/zarinpal/route.ts');

  assert.match(routeCore, /export async function handlePaymentWebhookRoute/);
  assert.match(routeCore, /Webhook payload must be a JSON object/);
  assert.match(routeCore, /MAX_PAYMENT_WEBHOOK_BODY_BYTES/);
  assert.match(routeCore, /validatePaymentWebhookRawBody/);
  assert.match(routeCore, /status === 'duplicate'\) return 409/);
  assert.match(routeCore, /Duplicate webhook replay was rejected by idempotency key/);
  assert.match(routeCore, /status === 'recorded'/);
  assert.match(routeCore, /provider: input\.provider/);
  assert.match(routeCore, /paymentEventId: result\.paymentEventId/);
  assert.doesNotMatch(routeCore, /checkoutOrder\.update/);
  assert.doesNotMatch(routeCore, /checkoutPaymentAttempt\.update/);

  assert.match(stripeRoute, /provider: 'stripe'/);
  assert.match(stripeRoute, /validatePaymentWebhookRawBody/);
  assert.match(stripeRoute, /paymentWebhookService\.record/);
  assert.match(stripeRoute, /NextResponse\.json/);
  assert.match(zarinpalRoute, /provider: 'zarinpal'/);
  assert.match(zarinpalRoute, /validatePaymentWebhookRawBody/);
  assert.match(zarinpalRoute, /eventType: 'zarinpal\.payment'/);
  assert.match(zarinpalRoute, /paymentWebhookService\.record/);

  const recordedInputs: PaymentWebhookEventInput[] = [];
  const record = async (input: PaymentWebhookEventInput): Promise<PaymentWebhookServiceResult> => {
    recordedInputs.push(input);
    return {
      status: 'recorded',
      paymentAttemptId: 'attempt-1',
      paymentEventId: 'event-1',
      idempotencyKey: 'stripe:checkout.session.completed:cs_test_123:digest',
      plan: {
        idempotencyKey: 'stripe:checkout.session.completed:cs_test_123:digest',
        provider: 'stripe',
        eventName: 'checkout.session.completed',
        providerReference: 'cs_test_123',
        status: 'paid',
        persistenceStatus: 'recorded',
        shouldApplyPaymentState: true,
        shouldReconcileSettlement: true,
        needsAttention: false,
        metadata: {}
      }
    };
  };

  const success = await handlePaymentWebhookRoute({
    provider: 'stripe',
    payload: { type: 'checkout.session.completed', data: { object: { id: 'cs_test_123' } } },
    headers: { 'stripe-signature': 'sig-test' },
    record
  });
  assert.equal(success.statusCode, 200);
  assert.equal(success.body.ok, true);
  assert.equal(success.body.provider, 'stripe');
  assert.equal(success.body.status, 'recorded');
  assert.equal(success.body.paymentAttemptId, 'attempt-1');
  assert.equal(success.body.paymentEventId, 'event-1');
  assert.equal(recordedInputs[0].provider, 'stripe');
  assert.equal(recordedInputs[0].eventType, 'checkout.session.completed');

  const invalid = await handlePaymentWebhookRoute({
    provider: 'zarinpal',
    payload: null,
    record
  });
  assert.equal(invalid.statusCode, 400);
  assert.equal(invalid.body.ok, false);
  assert.equal(invalid.body.status, 'invalid');

  const oversized = validatePaymentWebhookRawBody({
    provider: 'stripe',
    rawBody: '{}',
    headers: { 'content-length': String(65 * 1024) }
  });
  assert.equal(oversized?.statusCode, 413);
  assert.equal(oversized?.body.status, 'invalid');

  const empty = validatePaymentWebhookRawBody({
    provider: 'stripe',
    rawBody: '   ',
    headers: {}
  });
  assert.equal(empty?.statusCode, 400);
  assert.equal(empty?.body.status, 'invalid');

  const duplicate = await handlePaymentWebhookRoute({
    provider: 'stripe',
    payload: { type: 'checkout.session.completed', data: { object: { id: 'cs_test_123' } } },
    record: async () => ({
      status: 'duplicate',
      paymentAttemptId: 'attempt-1',
      paymentEventId: 'event-1',
      idempotencyKey: 'stripe:checkout.session.completed:cs_test_123:digest',
      plan: {
        idempotencyKey: 'stripe:checkout.session.completed:cs_test_123:digest',
        provider: 'stripe',
        eventName: 'checkout.session.completed',
        providerReference: 'cs_test_123',
        status: 'paid',
        persistenceStatus: 'duplicate',
        shouldApplyPaymentState: false,
        shouldReconcileSettlement: false,
        needsAttention: false,
        metadata: {}
      }
    })
  });
  assert.equal(duplicate.statusCode, 409);
  assert.equal(duplicate.body.ok, false);
  assert.equal(duplicate.body.status, 'duplicate');

  const needsAttention = await handlePaymentWebhookRoute({
    provider: 'zarinpal',
    payload: { Status: 'NOK', Authority: 'A0001' },
    eventType: 'zarinpal.payment',
    record: async () => ({
      status: 'needs_attention',
      idempotencyKey: 'zarinpal:zarinpal.payment:A0001:digest',
      plan: {
        idempotencyKey: 'zarinpal:zarinpal.payment:A0001:digest',
        provider: 'zarinpal',
        eventName: 'zarinpal.payment',
        providerReference: 'A0001',
        status: 'failed',
        persistenceStatus: 'needs_attention',
        shouldApplyPaymentState: false,
        shouldReconcileSettlement: false,
        needsAttention: true,
        metadata: {}
      }
    })
  });
  assert.equal(needsAttention.statusCode, 202);
  assert.equal(needsAttention.body.ok, false);
  assert.equal(needsAttention.body.status, 'needs_attention');

  console.log('payment-webhook-route-core.test.ts passed');
}
