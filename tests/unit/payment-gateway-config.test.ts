import assert from 'node:assert/strict';
import {
  getPaymentGatewayConfig,
  getPaymentGatewayReadiness,
  selectPaymentGatewayForOrder
} from '../../lib/checkout/payment-gateway-config';

export async function runPaymentGatewayConfigTests() {
  assert.deepEqual(getPaymentGatewayConfig({}), {
    checkoutMode: 'inquiry',
    domesticProvider: 'manual',
    overseasProvider: undefined,
    domesticCurrency: 'TOMAN',
    overseasCurrency: 'USD',
    overseasFallback: 'whatsapp'
  });

  const multiGatewayConfig = getPaymentGatewayConfig({
    CHECKOUT_MODE: ' gateway ',
    CHECKOUT_DOMESTIC_GATEWAY_PROVIDER: ' iranian ',
    CHECKOUT_OVERSEAS_GATEWAY_PROVIDER: ' stripe ',
    CHECKOUT_DOMESTIC_CURRENCY: ' toman ',
    CHECKOUT_OVERSEAS_CURRENCY: ' cad ',
    CHECKOUT_OVERSEAS_FALLBACK: ' stripe '
  });
  assert.deepEqual(multiGatewayConfig, {
    checkoutMode: 'gateway',
    domesticProvider: 'iranian',
    overseasProvider: 'stripe',
    domesticCurrency: 'TOMAN',
    overseasCurrency: 'CAD',
    overseasFallback: 'stripe'
  });
  assert.equal(selectPaymentGatewayForOrder({ region: 'domestic', config: multiGatewayConfig }), 'iranian');
  assert.equal(selectPaymentGatewayForOrder({ region: 'overseas', config: multiGatewayConfig }), 'stripe');

  assert.deepEqual(getPaymentGatewayReadiness(multiGatewayConfig, {
    IRANIAN_GATEWAY_MERCHANT_ID: 'merchant-1',
    STRIPE_SECRET_KEY: 'sk_test_example'
  }), {
    ready: true,
    mode: 'gateway',
    providers: ['iranian', 'stripe'],
    blockers: [],
    warnings: []
  });

  const inquiryReadiness = getPaymentGatewayReadiness(getPaymentGatewayConfig({ CHECKOUT_MODE: 'inquiry' }), {});
  assert.equal(inquiryReadiness.ready, true);
  assert.deepEqual(inquiryReadiness.blockers, []);
  assert.deepEqual(inquiryReadiness.warnings.map((issue) => issue.code), ['checkout_inquiry_mode', 'overseas_whatsapp_fallback']);

  const assistedReadiness = getPaymentGatewayReadiness(getPaymentGatewayConfig({ CHECKOUT_MODE: 'assisted' }), {});
  assert.equal(assistedReadiness.ready, true);
  assert.deepEqual(assistedReadiness.warnings.map((issue) => issue.code), ['checkout_assisted_mode', 'overseas_whatsapp_fallback']);

  const blockedGateway = getPaymentGatewayReadiness(getPaymentGatewayConfig({ CHECKOUT_MODE: 'gateway' }), {});
  assert.equal(blockedGateway.ready, false);
  assert.deepEqual(blockedGateway.blockers.map((issue) => issue.code), ['gateway_mode_without_online_provider']);

  const missingProviderConfig = getPaymentGatewayReadiness(multiGatewayConfig, {});
  assert.equal(missingProviderConfig.ready, false);
  assert.deepEqual(missingProviderConfig.blockers.map((issue) => issue.code), ['iranian_gateway_merchant_missing', 'stripe_secret_missing']);

  const invalidCurrencyConfig = getPaymentGatewayConfig({
    CHECKOUT_MODE: 'gateway',
    CHECKOUT_DOMESTIC_GATEWAY_PROVIDER: 'iranian',
    CHECKOUT_DOMESTIC_CURRENCY: 'USD',
    CHECKOUT_OVERSEAS_GATEWAY_PROVIDER: 'stripe',
    CHECKOUT_OVERSEAS_CURRENCY: 'TOMAN',
    CHECKOUT_OVERSEAS_FALLBACK: 'stripe',
    IRANIAN_GATEWAY_MERCHANT_ID: 'merchant-1',
    STRIPE_SECRET_KEY: 'sk_test_example'
  });
  const invalidCurrencyReadiness = getPaymentGatewayReadiness(invalidCurrencyConfig, {
    IRANIAN_GATEWAY_MERCHANT_ID: 'merchant-1',
    STRIPE_SECRET_KEY: 'sk_test_example'
  });
  assert.equal(invalidCurrencyReadiness.ready, false);
  assert.deepEqual(invalidCurrencyReadiness.blockers.map((issue) => issue.code), ['iranian_gateway_currency_invalid', 'stripe_currency_invalid']);

  const fallbackConfig = getPaymentGatewayConfig({
    CHECKOUT_MODE: 'gateway',
    CHECKOUT_DOMESTIC_GATEWAY_PROVIDER: 'iranian',
    CHECKOUT_OVERSEAS_FALLBACK: 'whatsapp'
  });
  assert.equal(selectPaymentGatewayForOrder({ region: 'overseas', config: fallbackConfig }), 'whatsapp');

  console.log('payment-gateway-config.test.ts passed');
}
