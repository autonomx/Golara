import assert from 'node:assert/strict';
import {
  createInquiryGatewayAdapter,
  createIranianGatewayMockAdapter,
  createManualGatewayAdapter,
  createMockPaymentGatewayAdapters,
  createStripeGatewayMockAdapter,
  createWhatsAppGatewayAdapter,
  initiatePaymentGateway,
  type PaymentGatewayInitiationInput
} from '../../lib/checkout/payment-gateway-adapters';

const basePayment: PaymentGatewayInitiationInput = {
  orderId: 'order-1',
  orderNumber: 'GOL-1001',
  amountCents: 250000,
  currency: 'TOMAN',
  customerPhone: '+989121234567',
  returnUrl: 'https://golara.example/checkout/return',
  metadata: { source: 'unit-test' }
};

export async function runPaymentGatewayAdaptersTests() {
  await assert.rejects(
    () => createManualGatewayAdapter().initiate({ ...basePayment, amountCents: 0 }),
    /positive amount/
  );

  assert.deepEqual(await createManualGatewayAdapter().initiate(basePayment), {
    provider: 'manual',
    status: 'manual',
    reference: 'manual:GOL-1001',
    message: 'Manual checkout selected; staff will confirm payment and fulfillment details.'
  });

  assert.deepEqual(await createIranianGatewayMockAdapter().initiate(basePayment), {
    provider: 'iranian',
    status: 'redirect',
    reference: 'iranian:GOL-1001',
    redirectUrl: '/checkout/mock/iranian?order=order-1&return=https%3A%2F%2Fgolara.example%2Fcheckout%2Freturn',
    message: 'Iranian gateway mock redirect prepared.'
  });

  assert.deepEqual(await createIranianGatewayMockAdapter().initiate({ ...basePayment, currency: 'USD' }), {
    provider: 'iranian',
    status: 'unavailable',
    reference: 'iranian:GOL-1001',
    message: 'Iranian gateway mock only supports Toman orders.'
  });

  assert.deepEqual(await createStripeGatewayMockAdapter().initiate({ ...basePayment, currency: 'USD' }), {
    provider: 'stripe',
    status: 'redirect',
    reference: 'stripe:GOL-1001',
    redirectUrl: '/checkout/mock/stripe?order=order-1&return=https%3A%2F%2Fgolara.example%2Fcheckout%2Freturn',
    message: 'Stripe mock redirect prepared.'
  });

  assert.deepEqual(await createStripeGatewayMockAdapter().initiate(basePayment), {
    provider: 'stripe',
    status: 'unavailable',
    reference: 'stripe:GOL-1001',
    message: 'Stripe mock does not support Toman orders.'
  });

  assert.deepEqual(await createWhatsAppGatewayAdapter().initiate(basePayment), {
    provider: 'whatsapp',
    status: 'manual',
    reference: 'whatsapp:GOL-1001',
    redirectUrl: 'https://wa.me/?text=Order%20GOL-1001',
    message: 'WhatsApp assisted checkout selected.'
  });

  assert.deepEqual(await createInquiryGatewayAdapter().initiate({ ...basePayment, orderNumber: undefined }), {
    provider: 'inquiry',
    status: 'manual',
    reference: 'inquiry:order-1',
    message: 'Inquiry fallback selected; staff will follow up before payment.'
  });

  const adapters = createMockPaymentGatewayAdapters();
  assert.equal(adapters.manual.provider, 'manual');
  assert.equal(adapters.iranian.provider, 'iranian');
  assert.equal(adapters.stripe.provider, 'stripe');
  assert.equal(adapters.whatsapp.provider, 'whatsapp');
  assert.equal(adapters.inquiry.provider, 'inquiry');

  assert.equal((await initiatePaymentGateway({ provider: 'manual', payment: basePayment })).provider, 'manual');
  assert.equal((await initiatePaymentGateway({ provider: 'stripe', payment: { ...basePayment, currency: 'CAD' } })).status, 'redirect');

  console.log('payment-gateway-adapters.test.ts passed');
}
