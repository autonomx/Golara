import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { buildPaymentSettlementPlanFromEvent } from '../../lib/checkout/payment-settlement-service';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentSettlementServiceTests() {
  const service = source('lib/checkout/payment-settlement-service.ts');
  const helper = source('lib/checkout/payment-settlement-reconciliation.ts');
  const schema = source('prisma/schema.prisma');

  assert.match(schema, /model CheckoutPaymentEvent/);
  assert.match(schema, /model CheckoutPaymentAttempt/);
  assert.match(schema, /model CheckoutOrder/);

  assert.match(helper, /export function planPaymentSettlementReconciliation/);
  assert.match(service, /import 'server-only'/);
  assert.match(service, /export function buildPaymentSettlementPlanFromEvent/);
  assert.match(service, /export async function paymentSettlementSummaryService/);
  assert.match(service, /prisma\.checkoutPaymentEvent\.findMany/);
  assert.match(service, /paymentAttempt: \{/);
  assert.match(service, /order: true/);
  assert.match(service, /summarizePaymentSettlementPlans/);
  assert.match(service, /paymentSettlementService = \{/);
  assert.doesNotMatch(service, /checkoutOrder\.update/);
  assert.doesNotMatch(service, /checkoutPaymentAttempt\.update/);
  assert.doesNotMatch(service, /checkoutPaymentEvent\.create/);

  const plan = buildPaymentSettlementPlanFromEvent({
    id: 'event-1',
    provider: 'stripe',
    idempotencyKey: 'stripe:event-1',
    status: 'paid',
    metadata: {
      providerReference: 'cs_test_123',
      orderNumber: 'GOL-1001',
      amountCents: 420000,
      currency: 'usd'
    },
    createdAt: new Date('2026-06-04T10:00:00.000Z'),
    paymentAttempt: {
      providerReference: 'cs_test_123',
      amountCents: 420000,
      currency: 'USD',
      order: {
        orderNumber: 'GOL-1001',
        totalCents: 420000,
        currency: 'USD'
      }
    }
  });
  assert.equal(plan.status, 'settled');
  assert.equal(plan.provider, 'stripe');
  assert.equal(plan.providerReference, 'cs_test_123');
  assert.equal(plan.orderNumber, 'GOL-1001');
  assert.equal(plan.expectedAmountCents, 420000);
  assert.equal(plan.actualAmountCents, 420000);
  assert.equal(plan.expectedCurrency, 'USD');
  assert.equal(plan.actualCurrency, 'USD');
  assert.equal(plan.needsAttention, false);

  const mismatch = buildPaymentSettlementPlanFromEvent({
    id: 'event-2',
    provider: 'zarinpal',
    idempotencyKey: 'zarinpal:event-2',
    status: 'paid',
    metadata: { amountCents: 700000, currency: 'TOMAN' },
    createdAt: new Date('2026-06-04T10:00:00.000Z'),
    paymentAttempt: {
      providerReference: '123456',
      amountCents: 850000,
      currency: 'TOMAN',
      order: {
        orderNumber: 'GOL-2001',
        totalCents: 850000,
        currency: 'TOMAN'
      }
    }
  });
  assert.equal(mismatch.status, 'amount_mismatch');
  assert.equal(mismatch.needsAttention, true);

  console.log('payment-settlement-service.test.ts passed');
}
