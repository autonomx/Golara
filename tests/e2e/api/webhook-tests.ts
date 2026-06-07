import assert from 'node:assert/strict';
import { postSignedStripe, postSignedZarinpal, request, type ApiFixture } from './shared';

export async function runOrderReturnRouteTests(fixture: ApiFixture) {
  const response = await request(`/orders/return?order=${encodeURIComponent(fixture.orderNumber)}&token=${encodeURIComponent(fixture.publicLookupToken)}&status=cancelled`, {
    redirect: 'manual'
  });
  assert.equal([302, 303, 307, 308].includes(response.status), true);
  assert.match(response.headers.get('location') ?? '', /orders\/confirmation|orders\//);
}

export async function runWebhookRouteTests(fixture: ApiFixture) {
  const invalid = await request('/api/webhooks/payments/stripe', {
    method: 'POST',
    body: JSON.stringify({ ok: true }),
    headers: { 'content-type': 'application/json' }
  });
  assert.equal(invalid.status, 401);
  assert.equal((await invalid.json()).status, 'invalid_signature');

  const paidPayload = {
    id: 'evt_api_e2e_paid_1001',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: fixture.stripeProviderReference,
        payment_status: 'paid',
        amount_total: 250000,
        currency: 'toman',
        metadata: {
          orderNumber: fixture.orderNumber,
          publicLookupToken: fixture.publicLookupToken
        }
      }
    }
  };
  const first = await postSignedStripe('/api/webhooks/payments/stripe', paidPayload);
  assert.equal(first.status, 200);
  assert.equal((await first.json()).status, 'recorded');

  const duplicate = await postSignedStripe('/api/webhooks/payments/stripe', paidPayload);
  assert.equal(duplicate.status, 200);
  assert.equal((await duplicate.json()).status, 'duplicate');

  const attempt = await fixture.prisma.checkoutPaymentAttempt.findFirstOrThrow({ where: { providerReference: fixture.stripeProviderReference } });
  assert.equal(attempt.status, 'verified_paid');
  const eventCount = await fixture.prisma.checkoutPaymentEvent.count({
    where: { paymentAttemptId: attempt.id, eventType: 'checkout.session.completed' }
  });
  assert.equal(eventCount, 1);

  const zarinpalPayload = {
    Authority: 'A000000000000000000000000000api',
    Status: 'OK',
    orderNumber: fixture.orderNumber,
    amount: 250000,
    currency: 'IRT'
  };
  const zarinpal = await postSignedZarinpal('/api/webhooks/payments/zarinpal', zarinpalPayload);
  assert.equal([200, 202].includes(zarinpal.status), true);
  const zarinpalBody = await zarinpal.json();
  assert.equal(['recorded', 'needs_attention'].includes(zarinpalBody.status), true);
}
