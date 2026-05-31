import assert from 'node:assert/strict';
import { mapAdapterAliasAttempt } from '../../lib/checkout/checkout-adapter-alias-attempt';
import type { PaymentAttemptOrder } from '../../lib/checkout/payment-attempt-core';
import type { PaymentGatewayInitiationResult } from '../../lib/checkout/payment-gateway-adapters';

const baseOrder: PaymentAttemptOrder = {
  id: 'order-1',
  orderNumber: 'GOL-1001',
  totalCents: 250000,
  currency: 'TOMAN',
  status: 'draft',
  publicLookupToken: 'lookup-token'
};

function gatewayResult(overrides: Partial<PaymentGatewayInitiationResult>): PaymentGatewayInitiationResult {
  return {
    provider: 'manual',
    status: 'manual',
    reference: 'manual:GOL-1001',
    message: 'Manual checkout selected.',
    ...overrides
  };
}

export async function runCheckoutAdapterAliasAttemptTests() {
  assert.deepEqual(mapAdapterAliasAttempt({
    order: baseOrder,
    result: gatewayResult({
      provider: 'iranian',
      status: 'redirect',
      reference: 'iranian:GOL-1001',
      redirectUrl: '/checkout/mock/iranian?order=order-1',
      message: 'Iranian gateway mock redirect prepared.'
    })
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

  assert.deepEqual(mapAdapterAliasAttempt({
    order: baseOrder,
    result: gatewayResult({
      provider: 'stripe',
      status: 'started',
      reference: 'stripe:GOL-1001',
      message: 'Stripe payment intent created.'
    })
  }), {
    provider: 'stripe',
    status: 'created',
    providerReference: 'stripe:GOL-1001',
    metadata: {
      gatewayStatus: 'started',
      gatewayMessage: 'Stripe payment intent created.',
      orderNumber: 'GOL-1001'
    }
  });

  assert.deepEqual(mapAdapterAliasAttempt({
    order: baseOrder,
    result: gatewayResult({
      provider: 'manual',
      status: 'manual',
      reference: 'manual:GOL-1001',
      message: 'Manual checkout selected; staff will confirm payment and fulfillment details.'
    })
  }), {
    provider: 'manual',
    status: 'manual_pending',
    providerReference: 'manual:GOL-1001',
    metadata: {
      gatewayStatus: 'manual',
      gatewayMessage: 'Manual checkout selected; staff will confirm payment and fulfillment details.',
      orderNumber: 'GOL-1001'
    }
  });

  assert.deepEqual(mapAdapterAliasAttempt({
    order: baseOrder,
    result: gatewayResult({
      provider: 'inquiry',
      status: 'unavailable',
      reference: 'inquiry:GOL-1001',
      message: 'Gateway unavailable; inquiry fallback selected.'
    })
  }), {
    provider: 'inquiry',
    status: 'manual_pending',
    providerReference: 'inquiry:GOL-1001',
    metadata: {
      gatewayStatus: 'unavailable',
      gatewayMessage: 'Gateway unavailable; inquiry fallback selected.',
      orderNumber: 'GOL-1001'
    }
  });

  const optionalFieldsAttempt = mapAdapterAliasAttempt({
    order: baseOrder,
    result: gatewayResult({
      provider: 'whatsapp',
      status: 'manual',
      reference: '',
      redirectUrl: '',
      message: 'WhatsApp assisted checkout selected.'
    })
  });
  assert.equal('providerReference' in optionalFieldsAttempt, false);
  assert.equal('redirectUrl' in optionalFieldsAttempt, false);
  assert.deepEqual(optionalFieldsAttempt, {
    provider: 'whatsapp',
    status: 'manual_pending',
    metadata: {
      gatewayStatus: 'manual',
      gatewayMessage: 'WhatsApp assisted checkout selected.',
      orderNumber: 'GOL-1001'
    }
  });

  console.log('checkout-adapter-alias-attempt.test.ts passed');
}
