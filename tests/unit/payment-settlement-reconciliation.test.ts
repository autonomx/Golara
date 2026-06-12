import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  planPaymentSettlementReconciliation,
  summarizePaymentSettlementPlans
} from '../../lib/checkout/payment-settlement-reconciliation';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentSettlementReconciliationTests() {
  const helper = source('lib/checkout/payment-settlement-reconciliation.ts');
  assert.match(helper, /export function planPaymentSettlementReconciliation/);
  assert.match(helper, /export function summarizePaymentSettlementPlans/);
  assert.doesNotMatch(helper, /checkoutOrder\.update/);
  assert.doesNotMatch(helper, /checkoutPaymentAttempt\.update/);
  assert.doesNotMatch(helper, /checkoutPaymentEvent\.create/);

  const webhookService = source('lib/checkout/payment-webhook-service.ts');
  assert.match(
    webhookService,
    /function shouldApplyWebhookStateChange/,
    'payment webhook service should centralize settlement-gated state application'
  );
  assert.match(
    webhookService,
    /if \(input\.eventStatus !== 'paid'\) return true;/,
    'non-paid trusted webhooks may still update failed/cancelled state without settlement amount matching'
  );
  assert.match(
    webhookService,
    /return input\.settlementReconciliation\?\.status === 'settled';/,
    'paid webhooks must require settled reconciliation before state changes are applied'
  );
  assert.match(
    webhookService,
    /const settlementReconciliation = await paymentSettlementRepository\.upsertForPaymentEvent\(created\.id\);[\s\S]*const shouldApplyState = shouldApplyWebhookStateChange/,
    'webhook service should reconcile settlement before deciding whether to apply paid state'
  );
  assert.match(
    webhookService,
    /if \(shouldApplyState\) \{[\s\S]*await applyTrustedWebhookStateChange/,
    'webhook service should only apply payment\/order state when the settlement gate passes'
  );
  assert.match(
    webhookService,
    /webhookSettlementStatus: settlementReconciliation\?\.status \|\| 'missing'/,
    'webhook event metadata should record settlement status for incident review'
  );

  const settled = planPaymentSettlementReconciliation({
    provider: 'stripe',
    providerReference: 'cs_test_123',
    webhookStatus: 'paid',
    orderNumber: 'GOL-1001',
    orderTotalCents: 420000,
    orderCurrency: 'usd',
    webhookAmountCents: 420000,
    webhookCurrency: 'USD',
    eventId: 'event-1',
    idempotencyKey: 'stripe:event'
  });
  assert.equal(settled.status, 'settled');
  assert.equal(settled.needsAttention, false);
  assert.equal(settled.expectedCurrency, 'USD');
  assert.equal(settled.actualCurrency, 'USD');
  assert.equal(settled.metadata.hasProviderReference, true);

  const amountMismatch = planPaymentSettlementReconciliation({
    provider: 'stripe',
    providerReference: 'cs_test_456',
    webhookStatus: 'paid',
    orderNumber: 'GOL-1002',
    orderTotalCents: 420000,
    orderCurrency: 'USD',
    webhookAmountCents: 419999,
    webhookCurrency: 'USD'
  });
  assert.equal(amountMismatch.status, 'amount_mismatch');
  assert.equal(amountMismatch.needsAttention, true);

  const currencyMismatch = planPaymentSettlementReconciliation({
    provider: 'zarinpal',
    providerReference: '123456',
    webhookStatus: 'paid',
    orderNumber: 'GOL-1003',
    orderTotalCents: 850000,
    orderCurrency: 'TOMAN',
    webhookAmountCents: 850000,
    webhookCurrency: 'CAD'
  });
  assert.equal(currencyMismatch.status, 'currency_mismatch');

  const pending = planPaymentSettlementReconciliation({
    provider: 'stripe',
    providerReference: 'cs_test_pending',
    webhookStatus: 'pending',
    orderNumber: 'GOL-1004'
  });
  assert.equal(pending.status, 'pending');
  assert.equal(pending.needsAttention, true);

  const needsAttention = planPaymentSettlementReconciliation({
    provider: 'zarinpal',
    webhookStatus: 'failed',
    orderNumber: 'GOL-1005'
  });
  assert.equal(needsAttention.status, 'needs_attention');
  assert.equal(needsAttention.metadata.hasProviderReference, false);

  assert.deepEqual(summarizePaymentSettlementPlans([
    settled,
    amountMismatch,
    currencyMismatch,
    pending,
    needsAttention
  ]), {
    total: 5,
    settled: 1,
    amountMismatch: 1,
    currencyMismatch: 1,
    pending: 1,
    needsAttention: 1
  });

  console.log('payment-settlement-reconciliation.test.ts passed');
}
