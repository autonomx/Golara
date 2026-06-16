import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import type { CheckoutOrderSummary } from '../../lib/catalog';
import { summarizeSettlementByPaymentMethod } from '../../lib/checkout/payment-method-settlement-summary';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function order(overrides: Partial<CheckoutOrderSummary>): CheckoutOrderSummary {
  return {
    id: overrides.id || `order-${Math.random().toString(16).slice(2)}`,
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

export async function runPaymentMethodSettlementSummaryTests() {
  const helper = source('lib/checkout/payment-method-settlement-summary.ts');
  assert.match(helper, /export type MethodSettlementSummary/);
  assert.match(helper, /export function summarizeSettlementByPaymentMethod/);
  assert.match(helper, /timelineEvidenceCount/);
  assert.match(helper, /latestCodCollectionStatus/);
  assert.match(helper, /latestCodSettlementMode/);
  assert.doesNotMatch(helper, /prisma\./, 'method-level settlement summary must remain read-only and pure');

  const roadmap = source('docs/digikala-style-payment-remaining-phases.md');
  assert.match(roadmap, /Method-level settlement summary groups orders by selected payment method/);
  assert.match(roadmap, /Start \*\*Phase P7 — manual transfer received\/pending totals\*\*/);

  const summaries = summarizeSettlementByPaymentMethod([
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

  const wallet = summaries.find((summary) => summary.methodKey === 'wallet');
  assert.ok(wallet, 'Expected wallet settlement summary');
  assert.equal(wallet.orderCount, 2);
  assert.equal(wallet.grossTotalCents, 8000);
  assert.equal(wallet.paidTotalCents, 5000);
  assert.equal(wallet.refundedTotalCents, 3000);
  assert.equal(wallet.statusCounts.paid, 1);
  assert.equal(wallet.statusCounts.refunded, 1);
  assert.equal(wallet.timelineEvidenceCount, 1);
  assert.deepEqual(wallet.latestEvidenceTitles, ['Wallet refund recorded']);

  const manual = summaries.find((summary) => summary.methodKey === 'manual_transfer');
  assert.ok(manual, 'Expected manual transfer settlement summary');
  assert.equal(manual.manualReviewRequiredCount, 1);
  assert.equal(manual.outstandingTotalCents, 7000);
  assert.equal(manual.statusCounts.pending, 1);

  const cod = summaries.find((summary) => summary.methodKey === 'cod');
  assert.ok(cod, 'Expected COD settlement summary');
  assert.deepEqual(cod.codCollectionStatuses, { collected: 1 });
  assert.deepEqual(cod.codSettlementModes, { driver_cash: 1 });
  assert.equal(cod.timelineEvidenceCount, 1);

  console.log('payment-method-settlement-summary.test.ts passed');
}
