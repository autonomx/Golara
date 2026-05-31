import assert from 'node:assert/strict';
import {
  isAdapterPaymentProviderName,
  isLegacyPaymentProviderName,
  mapAliasGatewayResultToLegacyAttempt,
  normalizeCheckoutProviderName,
  shouldUseDirectCheckoutProvider
} from '../../lib/checkout/payment-provider-alias-core';
import type { PaymentAttemptOrder } from '../../lib/checkout/payment-attempt-core';

const baseOrder: PaymentAttemptOrder = {
  id: 'order-1',
  orderNumber: 'GOL-1001',
  totalCents: 250000,
  currency: 'TOMAN',
  status: 'draft',
  publicLookupToken: 'lookup-token'
};

export async function runPaymentProviderAliasCoreTests() {
  assert.equal(isLegacyPaymentProviderName('manual'), true);
  assert.equal(isLegacyPaymentProviderName('domestic_redirect'), true);
  assert.equal(isLegacyPaymentProviderName('zarinpal'), true);
  assert.equal(isLegacyPaymentProviderName('iranian'), false);
  assert.equal(isLegacyPaymentProviderName(' MANUAL '), true);
  assert.equal(isLegacyPaymentProviderName('ZARINPAL'), true);

  assert.equal(isAdapterPaymentProviderName('iranian'), true);
  assert.equal(isAdapterPaymentProviderName('stripe'), true);
  assert.equal(isAdapterPaymentProviderName('whatsapp'), true);
  assert.equal(isAdapterPaymentProviderName('inquiry'), true);
  assert.equal(isAdapterPaymentProviderName('manual'), false);
  assert.equal(isAdapterPaymentProviderName(' STRIPE '), true);
  assert.equal(isAdapterPaymentProviderName('Inquiry'), true);

  assert.equal(normalizeCheckoutProviderName('manual'), 'manual');
  assert.equal(normalizeCheckoutProviderName('domestic_redirect'), 'domestic_redirect');
  assert.equal(normalizeCheckoutProviderName('zarinpal'), 'zarinpal');
  assert.equal(normalizeCheckoutProviderName('iranian'), 'iranian');
  assert.equal(normalizeCheckoutProviderName('stripe'), 'stripe');
  assert.equal(normalizeCheckoutProviderName('whatsapp'), 'whatsapp');
  assert.equal(normalizeCheckoutProviderName('inquiry'), 'inquiry');
  assert.equal(normalizeCheckoutProviderName(' STRIPE '), 'stripe');
  assert.equal(normalizeCheckoutProviderName('unknown-provider'), 'manual');
  assert.equal(normalizeCheckoutProviderName(''), 'manual');
  assert.equal(normalizeCheckoutProviderName(undefined), 'manual');
  assert.equal(normalizeCheckoutProviderName(null), 'manual');

  assert.equal(shouldUseDirectCheckoutProvider('manual'), true);
  assert.equal(shouldUseDirectCheckoutProvider('domestic_redirect'), true);
  assert.equal(shouldUseDirectCheckoutProvider('zarinpal'), true);
  assert.equal(shouldUseDirectCheckoutProvider('iranian'), false);
  assert.equal(shouldUseDirectCheckoutProvider('stripe'), false);
  assert.equal(shouldUseDirectCheckoutProvider('whatsapp'), false);
  assert.equal(shouldUseDirectCheckoutProvider('inquiry'), false);

  assert.deepEqual(mapAliasGatewayResultToLegacyAttempt({
    order: baseOrder,
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

  assert.deepEqual(mapAliasGatewayResultToLegacyAttempt({
    order: baseOrder,
    result: {
      provider: 'inquiry',
      status: 'unavailable',
      reference: 'inquiry:GOL-1001',
      message: 'Gateway unavailable; inquiry fallback selected.'
    }
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

  console.log('payment-provider-alias-core.test.ts passed');
}
