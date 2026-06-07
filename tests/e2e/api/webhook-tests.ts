import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { WEBHOOK_SECRET, postSignedStripe, postSignedZarinpal, request, type ApiFixture } from './shared';

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

  await runZarinpalInvalidSignatureTest();
  await runStripeMalformedJsonWithValidSignatureTest();
  await runStripeMissingReferenceAttentionTest();
  await runStripeMissingMetadataAttentionTest(fixture);
  await runStripeAmountMismatchSettlementTest(fixture);
  await runStripeCurrencyMismatchSettlementTest(fixture);
  await runStripeDuplicateFailedPayloadTest(fixture);
  const targetAttempt = await fixture.prisma.checkoutPaymentAttempt.findFirstOrThrow({ where: { providerReference: fixture.stripeProviderReference } });
  const beforePaidCompletedCount = await fixture.prisma.checkoutPaymentEvent.count({
    where: { paymentAttemptId: targetAttempt.id, eventType: 'checkout.session.completed' }
  });

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
  assert.equal(eventCount, beforePaidCompletedCount + 1);

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

async function runZarinpalInvalidSignatureTest() {
  const response = await request('/api/webhooks/payments/zarinpal', {
    method: 'POST',
    body: JSON.stringify({ Authority: 'api-e2e-invalid-zarinpal-signature', Status: 'OK' }),
    headers: {
      'content-type': 'application/json',
      'x-zarinpal-signature': 'not-a-valid-signature'
    }
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).status, 'invalid_signature');
}

async function runStripeMalformedJsonWithValidSignatureTest() {
  const rawBody = '{"not valid json"';
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${rawBody}`;
  const signature = createHmac('sha256', WEBHOOK_SECRET).update(signedPayload).digest('hex');
  const response = await request('/api/webhooks/payments/stripe', {
    method: 'POST',
    body: rawBody,
    headers: {
      'content-type': 'application/json',
      'stripe-signature': `t=${timestamp},v1=${signature}`
    }
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).status, 'invalid');
}

async function runStripeMissingReferenceAttentionTest() {
  const payload = {
    id: 'evt_api_e2e_missing_reference',
    type: 'checkout.session.completed',
    data: {
      object: {
        payment_status: 'paid',
        amount_total: 250000,
        currency: 'toman',
        metadata: {
          orderNumber: 'API-E2E-MISSING-REFERENCE'
        }
      }
    }
  };
  const response = await postSignedStripe('/api/webhooks/payments/stripe', payload);
  assert.equal(response.status, 202);
  const body = await response.json();
  assert.equal(body.status, 'needs_attention');
  assert.match(body.idempotencyKey, /evt_api_e2e_missing_reference/);
}

async function runStripeMissingMetadataAttentionTest(fixture: ApiFixture) {
  const payload = {
    id: 'evt_api_e2e_missing_metadata',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_api_e2e_missing_metadata',
        payment_status: 'paid',
        amount_total: 250000,
        currency: 'toman',
        metadata: {}
      }
    }
  };
  const beforeCount = await fixture.prisma.checkoutPaymentEvent.count();
  const response = await postSignedStripe('/api/webhooks/payments/stripe', payload);
  assert.equal(response.status, 202);
  assert.equal((await response.json()).status, 'needs_attention');
  assert.equal(await fixture.prisma.checkoutPaymentEvent.count(), beforeCount);
}

async function runStripeAmountMismatchSettlementTest(fixture: ApiFixture) {
  const payload = {
    id: 'evt_api_e2e_amount_mismatch',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: fixture.stripeProviderReference,
        payment_status: 'paid',
        amount_total: 12345,
        currency: 'toman',
        metadata: {
          orderNumber: fixture.orderNumber,
          publicLookupToken: fixture.publicLookupToken
        }
      }
    }
  };
  const response = await postSignedStripe('/api/webhooks/payments/stripe', payload);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, 'recorded');
  const reconciliation = await fixture.prisma.$queryRaw<Array<{ status: string; needsAttention: boolean; actualAmountCents: number }>>`
    SELECT "status", "needsAttention", "actualAmountCents"
    FROM "PaymentSettlementReconciliation"
    WHERE "paymentEventId" = ${body.paymentEventId}
    LIMIT 1
  `;
  assert.equal(reconciliation[0]?.status, 'amount_mismatch');
  assert.equal(reconciliation[0]?.needsAttention, true);
  assert.equal(reconciliation[0]?.actualAmountCents, 12345);
}

async function runStripeCurrencyMismatchSettlementTest(fixture: ApiFixture) {
  const payload = {
    id: 'evt_api_e2e_currency_mismatch',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: fixture.stripeProviderReference,
        payment_status: 'paid',
        amount_total: 250000,
        currency: 'cad',
        metadata: {
          orderNumber: fixture.orderNumber,
          publicLookupToken: fixture.publicLookupToken
        }
      }
    }
  };
  const response = await postSignedStripe('/api/webhooks/payments/stripe', payload);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, 'recorded');
  const reconciliation = await fixture.prisma.$queryRaw<Array<{ status: string; needsAttention: boolean; actualCurrency: string }>>`
    SELECT "status", "needsAttention", "actualCurrency"
    FROM "PaymentSettlementReconciliation"
    WHERE "paymentEventId" = ${body.paymentEventId}
    LIMIT 1
  `;
  assert.equal(reconciliation[0]?.status, 'currency_mismatch');
  assert.equal(reconciliation[0]?.needsAttention, true);
  assert.equal(reconciliation[0]?.actualCurrency, 'CAD');
}

async function runStripeDuplicateFailedPayloadTest(fixture: ApiFixture) {
  const payload = {
    id: 'evt_api_e2e_duplicate_failed',
    type: 'checkout.session.async_payment_failed',
    data: {
      object: {
        id: fixture.stripeProviderReference,
        payment_status: 'failed',
        amount_total: 250000,
        currency: 'toman',
        metadata: {
          orderNumber: fixture.orderNumber,
          publicLookupToken: fixture.publicLookupToken
        }
      }
    }
  };
  const first = await postSignedStripe('/api/webhooks/payments/stripe', payload);
  assert.equal(first.status, 202);
  assert.equal((await first.json()).status, 'needs_attention');
  const second = await postSignedStripe('/api/webhooks/payments/stripe', payload);
  assert.equal(second.status, 200);
  assert.equal((await second.json()).status, 'duplicate');
}
