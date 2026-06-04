import assert from 'node:assert/strict';
import {
  createInquiryGatewayAdapter,
  createIranianGatewayMockAdapter,
  createLivePaymentGatewayAdapters,
  createManualGatewayAdapter,
  createMockPaymentGatewayAdapters,
  createStripeCheckoutSessionAdapter,
  createStripeGatewayMockAdapter,
  createWhatsAppGatewayAdapter,
  createZarinPalGatewayMockAdapter,
  createZarinPalPaymentRequestAdapter,
  initiatePaymentGateway,
  type PaymentGatewayInitiationInput,
  type StripeCheckoutSessionHttpClient,
  type ZarinPalPaymentRequestHttpClient
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

  assert.deepEqual(await createZarinPalGatewayMockAdapter().initiate(basePayment), {
    provider: 'zarinpal',
    status: 'redirect',
    reference: 'zarinpal:GOL-1001',
    redirectUrl: '/checkout/mock/zarinpal?order=order-1&return=https%3A%2F%2Fgolara.example%2Fcheckout%2Freturn',
    message: 'ZarinPal mock redirect prepared.'
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

  assert.deepEqual(await createStripeCheckoutSessionAdapter({ secretKey: 'sk_test_123' }).initiate(basePayment), {
    provider: 'stripe',
    status: 'unavailable',
    reference: 'stripe:GOL-1001',
    message: 'Stripe checkout sessions do not support Toman orders.'
  });

  assert.deepEqual(await createStripeCheckoutSessionAdapter().initiate({ ...basePayment, currency: 'USD' }), {
    provider: 'stripe',
    status: 'unavailable',
    reference: 'stripe:GOL-1001',
    message: 'Stripe checkout requires STRIPE_SECRET_KEY.'
  });

  let capturedRequest: { url: string; headers: Record<string, string>; body: URLSearchParams } | undefined;
  const stripeHttpClient: StripeCheckoutSessionHttpClient = async (url, init) => {
    capturedRequest = { url, headers: init.headers, body: new URLSearchParams(init.body) };
    return {
      ok: true,
      status: 200,
      async json() {
        return { id: 'cs_test_123', url: 'https://checkout.stripe.com/c/pay/cs_test_123' };
      }
    };
  };

  assert.deepEqual(
    await createStripeCheckoutSessionAdapter({ secretKey: ' sk_live_example ', httpClient: stripeHttpClient }).initiate({
      ...basePayment,
      currency: 'CAD',
      customerEmail: 'customer@example.com',
      idempotencyKey: 'idem-order-1',
      successUrl: 'https://golara.example/checkout/success',
      cancelUrl: 'https://golara.example/checkout/cancel'
    }),
    {
      provider: 'stripe',
      status: 'redirect',
      reference: 'cs_test_123',
      redirectUrl: 'https://checkout.stripe.com/c/pay/cs_test_123',
      message: 'Stripe checkout session created.'
    }
  );

  assert.ok(capturedRequest);
  assert.equal(capturedRequest.url, 'https://api.stripe.com/v1/checkout/sessions');
  assert.equal(capturedRequest.headers.Authorization, 'Bearer sk_live_example');
  assert.equal(capturedRequest.headers['Content-Type'], 'application/x-www-form-urlencoded');
  assert.equal(capturedRequest.headers['Idempotency-Key'], 'idem-order-1');
  assert.equal(capturedRequest.body.get('mode'), 'payment');
  assert.equal(capturedRequest.body.get('success_url'), 'https://golara.example/checkout/success');
  assert.equal(capturedRequest.body.get('cancel_url'), 'https://golara.example/checkout/cancel');
  assert.equal(capturedRequest.body.get('client_reference_id'), 'order-1');
  assert.equal(capturedRequest.body.get('line_items[0][price_data][currency]'), 'cad');
  assert.equal(capturedRequest.body.get('line_items[0][price_data][unit_amount]'), '250000');
  assert.equal(capturedRequest.body.get('line_items[0][price_data][product_data][name]'), 'Golara order GOL-1001');
  assert.equal(capturedRequest.body.get('customer_email'), 'customer@example.com');
  assert.equal(capturedRequest.body.get('metadata[golara_order_id]'), 'order-1');
  assert.equal(capturedRequest.body.get('metadata[golara_order_number]'), 'GOL-1001');
  assert.equal(capturedRequest.body.get('metadata[source]'), 'unit-test');

  const failingStripeHttpClient: StripeCheckoutSessionHttpClient = async () => ({
    ok: false,
    status: 402,
    async json() {
      return { error: { message: 'card declined' } };
    }
  });
  assert.deepEqual(
    await createStripeCheckoutSessionAdapter({ secretKey: 'sk_test_123', httpClient: failingStripeHttpClient }).initiate({ ...basePayment, currency: 'USD' }),
    {
      provider: 'stripe',
      status: 'unavailable',
      reference: 'stripe:GOL-1001',
      message: 'Stripe checkout session could not be created: card declined'
    }
  );

  assert.deepEqual(await createZarinPalPaymentRequestAdapter({ merchantId: 'merchant-1' }).initiate({ ...basePayment, currency: 'USD' }), {
    provider: 'zarinpal',
    status: 'unavailable',
    reference: 'zarinpal:GOL-1001',
    message: 'ZarinPal checkout only supports Toman orders.'
  });

  assert.deepEqual(await createZarinPalPaymentRequestAdapter().initiate(basePayment), {
    provider: 'zarinpal',
    status: 'unavailable',
    reference: 'zarinpal:GOL-1001',
    message: 'ZarinPal checkout requires ZARINPAL_MERCHANT_ID.'
  });

  let capturedZarinPalRequest: { url: string; headers: Record<string, string>; body: Record<string, unknown> } | undefined;
  const zarinpalHttpClient: ZarinPalPaymentRequestHttpClient = async (url, init) => {
    capturedZarinPalRequest = { url, headers: init.headers, body: JSON.parse(init.body) as Record<string, unknown> };
    return {
      ok: true,
      status: 200,
      async json() {
        return { data: { code: 100, authority: 'A00000000000000000000000000000012345' } };
      }
    };
  };

  assert.deepEqual(
    await createZarinPalPaymentRequestAdapter({ merchantId: ' merchant-1 ', httpClient: zarinpalHttpClient }).initiate({
      ...basePayment,
      customerEmail: 'customer@example.com',
      idempotencyKey: 'idem-zarinpal-order-1'
    }),
    {
      provider: 'zarinpal',
      status: 'redirect',
      reference: 'A00000000000000000000000000000012345',
      redirectUrl: 'https://www.zarinpal.com/pg/StartPay/A00000000000000000000000000000012345',
      message: 'ZarinPal payment request created.'
    }
  );

  assert.ok(capturedZarinPalRequest);
  assert.equal(capturedZarinPalRequest.url, 'https://api.zarinpal.com/pg/v4/payment/request.json');
  assert.equal(capturedZarinPalRequest.headers['Content-Type'], 'application/json');
  assert.equal(capturedZarinPalRequest.headers['Idempotency-Key'], 'idem-zarinpal-order-1');
  assert.equal(capturedZarinPalRequest.body.merchant_id, 'merchant-1');
  assert.equal(capturedZarinPalRequest.body.amount, 250000);
  assert.equal(capturedZarinPalRequest.body.callback_url, 'https://golara.example/checkout/return?provider=zarinpal&order=order-1');
  assert.equal(capturedZarinPalRequest.body.description, 'Golara order GOL-1001');
  assert.deepEqual(capturedZarinPalRequest.body.metadata, {
    email: 'customer@example.com',
    mobile: '+989121234567',
    order_id: 'order-1',
    order_number: 'GOL-1001',
    source: 'unit-test'
  });

  const failingZarinPalHttpClient: ZarinPalPaymentRequestHttpClient = async () => ({
    ok: false,
    status: 400,
    async json() {
      return { errors: { message: 'merchant not found' } };
    }
  });
  assert.deepEqual(
    await createZarinPalPaymentRequestAdapter({ merchantId: 'merchant-1', httpClient: failingZarinPalHttpClient }).initiate(basePayment),
    {
      provider: 'zarinpal',
      status: 'unavailable',
      reference: 'zarinpal:GOL-1001',
      message: 'ZarinPal payment request could not be created: merchant not found'
    }
  );

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
  assert.equal(adapters.zarinpal.provider, 'zarinpal');
  assert.equal(adapters.stripe.provider, 'stripe');
  assert.equal(adapters.whatsapp.provider, 'whatsapp');
  assert.equal(adapters.inquiry.provider, 'inquiry');

  const liveAdapters = createLivePaymentGatewayAdapters({ stripeSecretKey: 'sk_test_123', zarinpalMerchantId: 'merchant-1' });
  assert.equal(liveAdapters.stripe.provider, 'stripe');
  assert.equal(liveAdapters.zarinpal.provider, 'zarinpal');

  assert.equal((await initiatePaymentGateway({ provider: 'manual', payment: basePayment })).provider, 'manual');
  assert.equal((await initiatePaymentGateway({ provider: 'stripe', payment: { ...basePayment, currency: 'CAD' } })).status, 'redirect');
  assert.equal((await initiatePaymentGateway({ provider: 'zarinpal', payment: basePayment })).status, 'redirect');

  console.log('payment-gateway-adapters.test.ts passed');
}
