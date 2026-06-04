import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';

import {
  expectedWebhookSignature,
  stripeSignaturePayload,
  verifyPaymentWebhookSignature
} from '../../lib/checkout/payment-webhook-signature';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentWebhookSignatureTests() {
  const helper = source('lib/checkout/payment-webhook-signature.ts');
  const stripeRoute = source('app/api/webhooks/payments/stripe/route.ts');
  const zarinpalRoute = source('app/api/webhooks/payments/zarinpal/route.ts');

  assert.match(helper, /export function verifyPaymentWebhookSignature/);
  assert.match(helper, /STRIPE_WEBHOOK_SECRET/);
  assert.match(helper, /ZARINPAL_WEBHOOK_SECRET/);
  assert.match(helper, /timingSafeEqual/);
  assert.match(helper, /stripe-signature/);
  assert.match(helper, /x-zarinpal-signature/);
  assert.match(helper, /x-golara-signature/);

  assert.match(stripeRoute, /request\.text\(\)/);
  assert.match(stripeRoute, /verifyPaymentWebhookSignature/);
  assert.match(stripeRoute, /provider: 'stripe'/);
  assert.match(stripeRoute, /status: 'invalid_signature'/);
  assert.match(stripeRoute, /JSON\.parse\(rawBody\)/);

  assert.match(zarinpalRoute, /request\.text\(\)/);
  assert.match(zarinpalRoute, /verifyPaymentWebhookSignature/);
  assert.match(zarinpalRoute, /provider: 'zarinpal'/);
  assert.match(zarinpalRoute, /status: 'invalid_signature'/);
  assert.match(zarinpalRoute, /JSON\.parse\(rawBody\)/);

  const rawBody = JSON.stringify({ id: 'evt_1' });
  const secret = 'whsec_test';
  const timestamp = '1717478400';
  const expectedStripe = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  const stripeHeader = `t=${timestamp},v1=${expectedStripe}`;
  assert.deepEqual(stripeSignaturePayload({ rawBody, signatureHeader: stripeHeader }), {
    signature: stripeHeader,
    signedPayload: `${timestamp}.${rawBody}`
  });
  assert.equal(expectedWebhookSignature({ provider: 'stripe', rawBody, secret, signatureHeader: stripeHeader }), expectedStripe);
  assert.deepEqual(verifyPaymentWebhookSignature({
    provider: 'stripe',
    rawBody,
    secret,
    headers: { 'stripe-signature': stripeHeader }
  }), {
    ok: true,
    enforced: true,
    provider: 'stripe',
    reason: 'valid'
  });
  assert.equal(verifyPaymentWebhookSignature({
    provider: 'stripe',
    rawBody,
    secret,
    headers: { 'stripe-signature': 't=1717478400,v1=bad' }
  }).reason, 'invalid_signature');

  const zarinpalSecret = 'zarinpal-secret';
  const expectedZarinpal = createHmac('sha256', zarinpalSecret).update(rawBody).digest('hex');
  assert.deepEqual(verifyPaymentWebhookSignature({
    provider: 'zarinpal',
    rawBody,
    secret: zarinpalSecret,
    headers: { 'x-zarinpal-signature': expectedZarinpal }
  }), {
    ok: true,
    enforced: true,
    provider: 'zarinpal',
    reason: 'valid'
  });
  assert.equal(verifyPaymentWebhookSignature({
    provider: 'zarinpal',
    rawBody,
    secret: zarinpalSecret,
    headers: {}
  }).reason, 'missing_signature');
  assert.equal(verifyPaymentWebhookSignature({
    provider: 'zarinpal',
    rawBody,
    secret: undefined,
    headers: {}
  }).reason, 'not_configured');

  console.log('payment-webhook-signature.test.ts passed');
}
