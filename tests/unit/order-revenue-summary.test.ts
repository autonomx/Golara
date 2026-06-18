import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildOrderRevenueSummary,
  formatRevenueCents,
  isCancelledOrderStatus,
  isCompletedOrderStatus,
  isRevenueEligibleStatus,
  normalizeRevenueCents
} from '../../lib/analytics/order-revenue-summary';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runOrderRevenueSummaryTests() {
  const service = source('lib/analytics/order-revenue-summary.ts');
  const panel = source('components/admin/AdminOrderRevenueSummaryPanel.tsx');
  const consolePage = source('app/admin/AdminConsolePage.tsx');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  assert.equal(normalizeRevenueCents(-10), 0);
  assert.equal(normalizeRevenueCents(123.8), 123);
  assert.equal(isRevenueEligibleStatus('completed'), true);
  assert.equal(isRevenueEligibleStatus('cancelled'), false);
  assert.equal(isRevenueEligibleStatus('refunded'), false);
  assert.equal(isCompletedOrderStatus('Delivered'), true);
  assert.equal(isCancelledOrderStatus('Canceled'), true);
  assert.equal(formatRevenueCents(12345, 'CAD'), '$123.45');
  assert.equal(formatRevenueCents(250000, 'TOMAN'), '2500.00 TOMAN');

  const now = new Date('2026-06-02T12:00:00Z');
  const summary = buildOrderRevenueSummary([
    { id: '1', status: 'completed', currency: 'CAD', totalCents: 10000, createdAt: new Date('2026-06-01T12:00:00Z') },
    { id: '2', status: 'pending', currency: 'CAD', totalCents: 5000, createdAt: new Date('2026-05-20T12:00:00Z') },
    { id: '3', status: 'cancelled', currency: 'CAD', totalCents: 2500, createdAt: new Date('2026-05-31T12:00:00Z') },
    { id: '4', status: 'fulfilled', currency: 'USD', totalCents: 2000, createdAt: new Date('2026-04-01T12:00:00Z') }
  ], now);

  assert.equal(summary.totalOrders, 4);
  assert.equal(summary.totalRevenueCents, 17000);
  assert.equal(summary.averageOrderValueCents, 4250);
  assert.equal(summary.recentOrders, 3);
  assert.equal(summary.recentRevenueCents, 15000);
  assert.equal(summary.openOrders, 1);
  assert.equal(summary.completedOrders, 2);
  assert.equal(summary.cancelledOrders, 1);
  assert.equal(summary.byStatus.cancelled, 1);
  assert.equal(summary.byCurrency[0].currency, 'CAD');
  assert.equal(summary.byCurrency[0].revenueCents, 15000);
  assert.equal(summary.byCurrency[1].currency, 'USD');
  assert.equal(summary.recentDaily.length, 30);
  assert.equal(summary.recentDaily[0].date, '2026-05-04');
  assert.equal(summary.recentDaily[29].date, '2026-06-02');
  const juneFirst = summary.recentDaily.find((point) => point.date === '2026-06-01');
  assert.equal(juneFirst?.orderCount, 1);
  assert.equal(juneFirst?.revenueCents, 10000);
  assert.equal(juneFirst?.averageOrderValueCents, 10000);
  const mayThirtyFirst = summary.recentDaily.find((point) => point.date === '2026-05-31');
  assert.equal(mayThirtyFirst?.orderCount, 1);
  assert.equal(mayThirtyFirst?.revenueCents, 0);

  assert.match(service, /export type OrderRevenueSummary/);
  assert.match(service, /export type OrderRevenueDailyPoint/);
  assert.match(service, /buildRecentDailyPoints/);
  assert.match(service, /RECENT_DAILY_POINT_COUNT = 30/);
  assert.match(service, /recentDaily: buildRecentDailyPoints\(rows, now\)/);
  assert.match(service, /buildOrderRevenueSummary/);
  assert.match(service, /orderRevenueSummaryService = \{/);
  assert.match(service, /prisma\.checkoutOrder\.findMany/);
  assert.match(service, /REVENUE_EXCLUDED_STATUSES/);

  assert.match(panel, /export async function AdminOrderRevenueSummaryPanel/);
  assert.match(panel, /Order count and revenue/);
  assert.match(panel, /formatRevenueCents/);
  assert.match(panel, /Recent revenue/);
  assert.match(panel, /summary\.recentDaily\.map/);
  assert.match(panel, /AdminAnalyticsTrendChart/);
  assert.match(panel, /Orders over time/);
  assert.match(panel, /Revenue over time/);
  assert.match(panel, /Average order value over time/);

  assert.match(consolePage, /AdminOrderRevenueSummaryPanel/);
  assert.match(consolePage, /EMPTY_ORDER_REVENUE_SUMMARY/);
  assert.match(consolePage, /authenticated \? orderRevenueSummaryService\.summary\(\) : Promise\.resolve\(EMPTY_ORDER_REVENUE_SUMMARY\)/);
  assert.match(consolePage, /const showOverviewExtras = activeTab === 'overview' && overviewSection === 'all'/);
  assert.match(consolePage, /showOverviewExtras && authenticated \? <AdminOrderRevenueSummaryPanel/);

  assert.match(roadmap, /- \[x\] Add order count and revenue summaries\./);

  console.log('order-revenue-summary.test.ts passed');
}