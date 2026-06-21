import assert from 'node:assert/strict';
import type { Product } from '../../lib/catalog';
import type { PaymentGatewayReadiness } from '../../lib/checkout/payment-gateway-config';
import { getProductCheckoutPolicy } from '../../lib/checkout/product-checkout-policy';

const baseProduct: Product = {
  id: 'product-1',
  slug: 'rose-box',
  code: 'RB-1',
  title: 'Rose Box',
  category: 'roses',
  price: 120,
  currency: 'CAD',
  availableToday: true,
  image: '/rose.jpg',
  description: 'A rose arrangement.'
};

const inquiryReadiness: PaymentGatewayReadiness = {
  ready: true,
  mode: 'inquiry',
  providers: ['manual'],
  blockers: [],
  warnings: []
};

const assistedReadiness: PaymentGatewayReadiness = {
  ready: true,
  mode: 'assisted',
  providers: ['manual'],
  blockers: [],
  warnings: []
};

const gatewayReady: PaymentGatewayReadiness = {
  ready: true,
  mode: 'gateway',
  providers: ['iranian', 'stripe'],
  blockers: [],
  warnings: []
};

const gatewayBlocked: PaymentGatewayReadiness = {
  ready: false,
  mode: 'gateway',
  providers: ['iranian'],
  blockers: [{ code: 'provider_missing', severity: 'blocker', summary: 'Missing provider config.', detail: 'Provider config is missing.' }],
  warnings: []
};

export async function runProductCheckoutPolicyTests() {
  assert.deepEqual(getProductCheckoutPolicy({ product: { ...baseProduct, requiresQuote: true }, dbReady: true, checkoutReadiness: gatewayReady }), {
    experience: 'inquiry-only',
    canAddToCart: false,
    showOrderDraftForm: false,
    showInquiryForm: true,
    summary: 'Inquiry required',
    detail: 'This product requires staff confirmation before ordering.',
    reasonCode: 'product_requires_quote'
  });

  assert.equal(getProductCheckoutPolicy({ product: { ...baseProduct, price: 0 }, dbReady: true, checkoutReadiness: gatewayReady }).reasonCode, 'product_requires_quote');
  assert.equal(getProductCheckoutPolicy({ product: { ...baseProduct, id: undefined }, dbReady: true, checkoutReadiness: gatewayReady }).reasonCode, 'database_or_product_id_missing');
  assert.equal(getProductCheckoutPolicy({ product: baseProduct, dbReady: false, checkoutReadiness: gatewayReady }).reasonCode, 'database_or_product_id_missing');

  const inquiryPolicy = getProductCheckoutPolicy({ product: baseProduct, dbReady: true, checkoutReadiness: inquiryReadiness });
  assert.equal(inquiryPolicy.experience, 'inquiry-cart');
  assert.equal(inquiryPolicy.canAddToCart, true);
  assert.equal(inquiryPolicy.showOrderDraftForm, false);
  assert.equal(inquiryPolicy.showInquiryForm, true);
  assert.equal(inquiryPolicy.reasonCode, 'checkout_mode_inquiry');

  const blockedGatewayPolicy = getProductCheckoutPolicy({ product: baseProduct, dbReady: true, checkoutReadiness: gatewayBlocked });
  assert.equal(blockedGatewayPolicy.experience, 'inquiry-cart');
  assert.equal(blockedGatewayPolicy.canAddToCart, true);
  assert.equal(blockedGatewayPolicy.showOrderDraftForm, false);
  assert.equal(blockedGatewayPolicy.showInquiryForm, true);
  assert.equal(blockedGatewayPolicy.reasonCode, 'gateway_not_ready');

  const assistedPolicy = getProductCheckoutPolicy({ product: baseProduct, dbReady: true, checkoutReadiness: assistedReadiness });
  assert.equal(assistedPolicy.experience, 'assisted-draft');
  assert.equal(assistedPolicy.canAddToCart, true);
  assert.equal(assistedPolicy.showOrderDraftForm, true);
  assert.equal(assistedPolicy.showInquiryForm, true);
  assert.equal(assistedPolicy.reasonCode, 'checkout_mode_assisted');

  const gatewayPolicy = getProductCheckoutPolicy({ product: baseProduct, dbReady: true, checkoutReadiness: gatewayReady });
  assert.equal(gatewayPolicy.experience, 'gateway-capable');
  assert.equal(gatewayPolicy.canAddToCart, true);
  assert.equal(gatewayPolicy.showOrderDraftForm, true);
  assert.equal(gatewayPolicy.showInquiryForm, true);
  assert.equal(gatewayPolicy.reasonCode, 'gateway_ready');

  console.log('product-checkout-policy.test.ts passed');
}
