import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import type { CheckoutOrderSummary } from '../../lib/catalog';
import { summarizeSettlementByPaymentMethod } from '../../lib/checkout/payment-method-settlement-summary';
import {
  planPaymentSettlementReconciliation,
  summarizePaymentSettlementPlans
} from '../../lib/checkout/payment-settlement-reconciliation';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function order(overrides: Partial<CheckoutOrderSummary>): CheckoutOrderSummary {
  return {
    id: overrides.id || 'order-test',
    orderNumber: overrides.orderNumber || 'GOL-TEST',
    status: overrides.status || 'confirmed',
    checkoutMode: overrides.checkoutMode || 'cart',
    fulfillmentStatus: overrides.fulfillmentStatus || 'pending',
    currency: overrides.currency || 'CAD',
    totalCents: overrides.totalCents || 0,
    itemCount: overrides.itemCount || 1,
    createdAt: overrides.createdAt || new Date('2026-01-01T00:00:00.000Z'),
    ...overrides
  };
}

export async function runPaymentSettlementReconciliationTests() {
  const helper = source('lib/checkout/payment-settlement-reconciliation.ts');
  assert.match(helper, /export function planPaymentSettlementReconciliation/);
  assert.match(helper, /export function summarizePaymentSettlementPlans/);
  assert.doesNotMatch(helper, /checkoutOrder\.update/);
  assert.doesNotMatch(helper, /checkoutPaymentAttempt\.update/);
  assert.doesNotMatch(helper, /checkoutPaymentEvent\.create/);

  const methodSummaryHelper = source('lib/checkout/payment-method-settlement-summary.ts');
  assert.match(methodSummaryHelper, /export type MethodSettlementSummary/);
  assert.match(methodSummaryHelper, /export function summarizeSettlementByPaymentMethod/);
  assert.match(methodSummaryHelper, /timelineEvidenceCount/);
  assert.match(methodSummaryHelper, /latestCodCollectionStatus/);
  assert.match(methodSummaryHelper, /latestCodSettlementMode/);
  assert.doesNotMatch(methodSummaryHelper, /prisma\./, 'method-level settlement summary must remain read-only and pure');

  const roadmap = source('docs/digikala-style-payment-remaining-phases.md');
  assert.match(roadmap, /Method-level settlement summary groups orders by selected payment method/);
  assert.match(roadmap, /Start \*\*Phase P7 — manual transfer received\/pending totals\*\*/);

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
    'webhook service should only apply payment/order state when the settlement gate passes'
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

  const methodSummaries = summarizeSettlementByPaymentMethod([
    order({
      id: 'wallet-paid',
      totalCents: 5000,
      latestPaymentStatus: 'paid',
      latestPaymentProvider: 'wallet',
      latestPaymentMethodKey: 'wallet',
      latestPaymentMethodLabel: 'Wallet',
      latestPaymentMethodType: 'wallet',
      latestTimelineTitle: 'Wallet payment captured'
    }),
    order({
      id: 'wallet-refunded',
      totalCents: 3000,
      latestPaymentStatus: 'refunded',
      latestPaymentProvider: 'wallet',
      latestPaymentMethodKey: 'wallet',
      latestPaymentMethodLabel: 'Wallet',
      latestPaymentMethodType: 'wallet',
      latestWalletRefundTotalCents: 3000,
      latestTimelineTitle: 'Wallet refund recorded'
    }),
    order({
      id: 'manual-pending',
      totalCents: 7000,
      latestPaymentStatus: 'pending_review',
      latestPaymentProvider: 'manual',
      latestPaymentMethodKey: 'manual_transfer',
      latestPaymentMethodLabel: 'Manual transfer',
      latestPaymentMethodType: 'manual_transfer',
      latestPaymentRequiresManualReview: true
    }),
    order({
      id: 'cod-collected',
      totalCents: 9000,
      latestPaymentStatus: 'paid',
      latestPaymentProvider: 'cod',
      latestPaymentMethodKey: 'cod',
      latestPaymentMethodLabel: 'Cash on delivery',
      latestPaymentMethodType: 'cod',
      latestCodCollectionStatus: 'collected',
      latestCodSettlementMode: 'driver_cash',
      latestTimelineTitle: 'COD collection settlement recorded'
    })
  ]);

  const wallet = methodSummaries.find((summary) => summary.methodKey === 'wallet');
  assert.ok(wallet, 'Expected wallet settlement summary');
  assert.equal(wallet.orderCount, 2);
  assert.equal(wallet.grossTotalCents, 8000);
  assert.equal(wallet.paidTotalCents, 5000);
  assert.equal(wallet.refundedTotalCents, 3000);
  assert.equal(wallet.statusCounts.paid, 1);
  assert.equal(wallet.statusCounts.refunded, 1);
  assert.equal(wallet.timelineEvidenceCount, 1);
  assert.deepEqual(wallet.latestEvidenceTitles, ['Wallet refund recorded']);

  const manual = methodSummaries.find((summary) => summary.methodKey === 'manual_transfer');
  assert.ok(manual, 'Expected manual transfer settlement summary');
  assert.equal(manual.manualReviewRequiredCount, 1);
  assert.equal(manual.outstandingTotalCents, 7000);
  assert.equal(manual.statusCounts.pending, 1);

  const cod = methodSummaries.find((summary) => summary.methodKey === 'cod');
  assert.ok(cod, 'Expected COD settlement summary');
  assert.deepEqual(cod.codCollectionStatuses, { collected: 1 });
  assert.deepEqual(cod.codSettlementModes, { driver_cash: 1 });
  assert.equal(cod.timelineEvidenceCount, 1);

  console.log('payment-settlement-reconciliation.test.ts passed');
}
