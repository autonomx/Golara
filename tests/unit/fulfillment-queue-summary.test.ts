import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildFulfillmentQueueSummary,
  isFulfillmentQueueOrder,
  normalizeFulfillmentQueueStatus
} from '../../lib/analytics/fulfillment-queue-summary';
import type { CheckoutOrderSummary } from '../../lib/catalog';
import {
  createAdminFulfillmentQueueTranslator,
  humanizeAdminFulfillmentValue
} from '../../lib/localization/admin-fulfillment-copy';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function order(partial: Partial<CheckoutOrderSummary> & Pick<CheckoutOrderSummary, 'id' | 'orderNumber' | 'createdAt'>): CheckoutOrderSummary {
  return {
    status: 'confirmed',
    checkoutMode: 'delivery',
    fulfillmentStatus: 'unfulfilled',
    currency: 'CAD',
    totalCents: 1000,
    itemCount: 1,
    ...partial
  };
}

export async function runFulfillmentQueueSummaryTests() {
  const service = source('lib/analytics/fulfillment-queue-summary.ts');
  const panel = source('components/admin/AdminFulfillmentQueueSummaryPanel.tsx');
  const orderPanel = source('components/admin/AdminOrderRevenueSummaryPanel.tsx');
  const adminOrderPanel = source('components/admin/AdminOrderPanel.tsx');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  assert.equal(normalizeFulfillmentQueueStatus('Ready for Pickup'), 'ready_for_pickup');
  assert.equal(isFulfillmentQueueOrder(order({ id: 'complete', orderNumber: 'G-1', fulfillmentStatus: 'delivered', createdAt: new Date('2026-06-01T12:00:00Z') })), false);
  assert.equal(isFulfillmentQueueOrder(order({ id: 'cancelled', orderNumber: 'G-2', status: 'cancelled', createdAt: new Date('2026-06-01T12:00:00Z') })), false);
  assert.equal(isFulfillmentQueueOrder(order({ id: 'open', orderNumber: 'G-3', fulfillmentStatus: 'packing', createdAt: new Date('2026-06-01T12:00:00Z') })), true);

  const now = new Date('2026-06-02T12:00:00Z');
  const summary = buildFulfillmentQueueSummary([
    order({ id: 'old', orderNumber: 'G-100', fulfillmentStatus: 'unfulfilled', customerName: 'Ava', itemCount: 3, createdAt: new Date('2026-05-30T12:00:00Z') }),
    order({ id: 'today', orderNumber: 'G-101', fulfillmentStatus: 'processing', customerPhone: '555-0100', itemCount: 2, createdAt: new Date('2026-06-02T08:00:00Z') }),
    order({ id: 'ready', orderNumber: 'G-102', fulfillmentStatus: 'ready_for_pickup', checkoutMode: 'pickup', itemCount: 1, createdAt: new Date('2026-06-01T12:00:00Z') }),
    order({ id: 'done', orderNumber: 'G-103', fulfillmentStatus: 'fulfilled', itemCount: 1, createdAt: new Date('2026-06-01T12:00:00Z') }),
    order({ id: 'void', orderNumber: 'G-104', status: 'voided', fulfillmentStatus: 'unfulfilled', itemCount: 1, createdAt: new Date('2026-06-01T12:00:00Z') })
  ], now);

  assert.equal(summary.totalOrdersReviewed, 5);
  assert.equal(summary.queueCount, 3);
  assert.equal(summary.overdueCount, 1);
  assert.equal(summary.dueTodayCount, 1);
  assert.equal(summary.inProgressCount, 1);
  assert.equal(summary.readyOrScheduledCount, 1);
  assert.equal(summary.unfulfilledCount, 1);
  assert.equal(summary.queuedOrders[0].id, 'old');
  assert.equal(summary.queuedOrders[0].priority, 'overdue');
  assert.equal(summary.queuedOrders.find((row) => row.id === 'today')?.customerLabel, '555-0100');
  assert.equal(summary.byFulfillmentStatus.find((row) => row.status === 'ready_for_pickup')?.count, 1);

  const fa = createAdminFulfillmentQueueTranslator('fa-IR');
  assert.equal(fa.orderStatus('paid'), 'پرداخت شده');
  assert.equal(fa.paymentStatus('partially_refunded'), 'استرداد جزئی');
  assert.equal(fa.fulfillmentStatus('ready_for_pickup'), 'آماده تحویل حضوری');
  assert.equal(fa.checkoutMode('local_delivery'), 'ارسال محلی');
  assert.equal(fa.priority('overdue'), 'معوق');
  assert.equal(fa.customerLabel('Guest checkout'), 'پرداخت مهمان');
  assert.equal(fa.fulfillmentStatus('custom_internal_status'), 'نامشخص');

  const en = createAdminFulfillmentQueueTranslator('en-CA');
  assert.equal(en.fulfillmentStatus('ready_for_pickup'), 'Ready for pickup');
  assert.equal(en.paymentStatus('partially_paid'), 'Partially paid');
  assert.equal(en.fulfillmentStatus('custom_internal_status'), 'Custom Internal Status');
  assert.equal(humanizeAdminFulfillmentValue('in_progress'), 'In Progress');

  assert.match(service, /export type FulfillmentQueueSummary/);
  assert.match(service, /buildFulfillmentQueueSummary/);
  assert.match(service, /fulfillmentQueueSummaryService = \{/);
  assert.match(service, /listAdminCheckoutOrders\(\{\}, 50\)/);
  assert.match(service, /COMPLETE_FULFILLMENT_STATUSES/);

  assert.match(panel, /export function AdminFulfillmentQueueSummaryPanel/);
  assert.match(panel, /createAdminFulfillmentQueueTranslator\(locale\)/);
  assert.match(panel, /rowCopy\.orderStatus\(row\.orderStatus\)/);
  assert.match(panel, /rowCopy\.fulfillmentStatus\(row\.fulfillmentStatus\)/);
  assert.match(panel, /rowCopy\.priority\(row\.priority\)/);
  assert.match(panel, /No open fulfillment queue items/);

  assert.match(adminOrderPanel, /createAdminFulfillmentQueueTranslator\(activeLocale\)/);
  assert.match(adminOrderPanel, /valueLabels\.orderStatus\(order\.status\)/);
  assert.match(adminOrderPanel, /valueLabels\.paymentStatus\(order\.latestPaymentStatus\)/);
  assert.match(adminOrderPanel, /valueLabels\.checkoutMode\(order\.checkoutMode\)/);

  assert.match(orderPanel, /AdminFulfillmentQueueSummaryPanel/);
  assert.match(orderPanel, /fulfillmentQueueSummaryService\.summary\(\)/);
  assert.match(orderPanel, /AdminFulfillmentQueueSummaryPanel summary=\{fulfillmentQueueSummary\}/);
  assert.match(roadmap, /fulfillment queue summary/i);

  console.log('fulfillment-queue-summary.test.ts passed');
}
