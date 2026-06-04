import assert from 'node:assert/strict';
import type { PaymentAttemptOrder } from '../../lib/checkout/payment-attempt-core';
import type { PaymentGatewayInitiationInput, PaymentGatewayInitiationResult } from '../../lib/checkout/payment-gateway-adapters';
import type { AdapterPaymentProviderName, LegacyPaymentProviderName } from '../../lib/checkout/payment-provider-alias-core';
import {
  createCheckoutProviderRuntimeAttempt,
  type CheckoutPaymentProviderResult
} from '../../lib/checkout/payment-provider-runtime-core';

const baseOrder: PaymentAttemptOrder = {
  id: 'order-1',
  orderNumber: 'GOL-1001',
  totalCents: 250000,
  currency: 'TOMAN',
  status: 'draft',
  publicLookupToken: 'lookup-token'
};

function localAttempt(provider: LegacyPaymentProviderName, order: PaymentAttemptOrder): Promise<CheckoutPaymentProviderResult> {
  if (provider === 'domestic_redirect') {
    return Promise.resolve({
      provider,
      status: 'redirect_required',
      providerReference: order.orderNumber,
      redirectUrl: `https://local.example/start?order=${order.orderNumber}`,
      metadata: { orderNumber: order.orderNumber }
    });
  }

  return Promise.resolve({
    provider,
    status: 'manual_pending',
    providerReference: order.orderNumber,
    metadata: { orderNumber: order.orderNumber }
  });
}

function adapterAttempt(provider: AdapterPaymentProviderName, payment: PaymentGatewayInitiationInput): Promise<PaymentGatewayInitiationResult> {
  if (provider === 'stripe') {
    return Promise.resolve({
      provider,
      status: 'redirect',
      reference: `${provider}:${payment.orderNumber}`,
      redirectUrl: `/checkout/mock/${provider}?order=${payment.orderId}`,
      message: 'Stripe mock redirect prepared.'
    });
  }

  if (provider === 'zarinpal') {
    return Promise.resolve({
      provider,
      status: 'redirect',
      reference: 'A00000000000000000000000000000012345',
      redirectUrl: 'https://www.zarinpal.com/pg/StartPay/A00000000000000000000000000000012345',
      message: 'ZarinPal payment request created.'
    });
  }

  if (provider === 'iranian') {
    return Promise.resolve({
      provider,
      status: 'redirect',
      reference: `${provider}:${payment.orderNumber}`,
      redirectUrl: `/checkout/mock/${provider}?order=${payment.orderId}`,
      message: 'Iranian gateway mock redirect prepared.'
    });
  }

  return Promise.resolve({
    provider,
    status: 'manual',
    reference: `${provider}:${payment.orderNumber}`,
    message: `${provider} checkout selected.`
  });
}

async function runAttempt(provider: string | null | undefined, order: PaymentAttemptOrder = baseOrder) {
  return createCheckoutProviderRuntimeAttempt({
    order,
    provider,
    returnUrl: 'https://golara.example/orders/return',
    localAttempt,
    adapterAttempt
  });
}

export async function runPaymentProviderRuntimeCoreTests() {
  assert.deepEqual(await runAttempt(undefined), {
    provider: 'manual',
    status: 'manual_pending',
    providerReference: 'GOL-1001',
    metadata: { orderNumber: 'GOL-1001' }
  });

  assert.deepEqual(await runAttempt('unknown-provider'), {
    provider: 'manual',
    status: 'manual_pending',
    providerReference: 'GOL-1001',
    metadata: { orderNumber: 'GOL-1001' }
  });

  assert.deepEqual(await runAttempt('iranian'), {
    provider: 'iranian',
    status: 'redirect_required',
    providerReference: 'iranian:GOL-1001',
    redirectUrl: '/checkout/mock/iranian?order=order-1',
    metadata: {
      gatewayStatus: 'redirect',
      gatewayMessage: 'Iranian gateway mock redirect prepared.',
      orderNumber: 'GOL-1001'
    }
  });

  assert.deepEqual(await runAttempt('zarinpal'), {
    provider: 'zarinpal',
    status: 'redirect_required',
    providerReference: 'A00000000000000000000000000000012345',
    redirectUrl: 'https://www.zarinpal.com/pg/StartPay/A00000000000000000000000000000012345',
    metadata: {
      gatewayStatus: 'redirect',
      gatewayMessage: 'ZarinPal payment request created.',
      orderNumber: 'GOL-1001'
    }
  });

  assert.deepEqual(await runAttempt('stripe', { ...baseOrder, currency: 'USD' }), {
    provider: 'stripe',
    status: 'redirect_required',
    providerReference: 'stripe:GOL-1001',
    redirectUrl: '/checkout/mock/stripe?order=order-1',
    metadata: {
      gatewayStatus: 'redirect',
      gatewayMessage: 'Stripe mock redirect prepared.',
      orderNumber: 'GOL-1001'
    }
  });

  assert.equal((await runAttempt('whatsapp')).provider, 'whatsapp');
  assert.equal((await runAttempt('whatsapp')).status, 'manual_pending');
  assert.equal((await runAttempt('inquiry')).provider, 'inquiry');
  assert.equal((await runAttempt('inquiry')).status, 'manual_pending');

  assert.equal((await runAttempt('manual')).provider, 'manual');
  assert.equal((await runAttempt('domestic_redirect')).provider, 'domestic_redirect');

  console.log('payment-provider-runtime-core.test.ts passed');
}
