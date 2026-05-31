import assert from 'node:assert/strict';
import {
  mapGatewayResultToAttempt,
  selectProviderForCheckoutAttempt
} from '../../lib/checkout/payment-attempt-core';
import type { PaymentGatewayConfig } from '../../lib/checkout/payment-gateway-config';

const baseOrder = {
  id: 'order-1',
  orderNumber: 'GOL-1001',
  totalCents: 250000,
  currency: 'TOMAN',
  status: 'draft',
  publicLookupToken: 'lookup-token'
};

const baseConfig: PaymentGatewayConfig = {
  checkoutMode: 'gateway',
  domesticProvider: 'iranian',
  overseasProvider: 'stripe',
  domesticCurrency: 'TOMAN',
  overseasCurrency: 'USD',
  overseasFallback: 'whatsapp'
};

export async function runCheckoutPaymentProviderTests() {
  assert.equal(selectProviderForCheckoutAttempt({ order: baseOrder, config: { ...baseConfig, checkoutMode: 'inquiry' } }), 'inquiry');
  assert.equal(selectProviderForCheckoutAttempt({ order: baseOrder, config: { ...baseConfig, checkoutMode: 'assisted' } }), 'manual');
  assert.equal(selectProviderForCheckoutAttempt({ order: baseOrder, config: baseConfig, readinessBlockers: ['missing_config'] }), 'manual');
  assert.equal(selectProviderForCheckoutAttempt({ order: baseOrder, config: baseConfig }), 'iranian');
  assert.equal(selectProviderForCheckoutAttempt({ order: { ...baseOrder, currency: 'USD' }, config: baseConfig }), 'stripe');
  assert.equal(selectProviderForCheckoutAttempt({ order: { ...baseOrder, currency: 'CAD' }, config: { ...baseConfig, overseasProvider: undefined } }), 'whatsapp');

  assert.deepEqual(mapGatewayResultToAttempt({
    order: baseOrder,
    readinessBlockers: [],
    result: {
      provider: 'iranian',
      status: 'redirect',
      reference: 'iranian:GOL-1001',
      redirectUrl: '/checkout/mock/iranian?order=order-1',
      message: 'Iranian gateway mock redirect prepared.'
    }
  }), {
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

  assert.deepEqual(mapGatewayResultToAttempt({
    order: baseOrder,
    readinessBlockers: ['missing_config'],
    result: {
      provider: 'manual',
      status: 'manual',
      reference: 'manual:GOL-1001',
      message: 'Manual checkout selected; staff will confirm payment and fulfillment details.'
    }
  }), {
    provider: 'manual',
    status: 'manual_pending',
    providerReference: 'manual:GOL-1001',
    redirectUrl: undefined,
    metadata: {
      gatewayStatus: 'manual',
      gatewayMessage: 'Manual checkout selected; staff will confirm payment and fulfillment details.',
      orderNumber: 'GOL-1001',
      readinessBlockers: ['missing_config']
    }
  });

  console.log('checkout-payment-provider.test.ts passed');
}
