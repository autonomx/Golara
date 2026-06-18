import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildAnalyticsComparisonDelta } from '../../lib/analytics/analytics-comparison';
import {
  getAdminAnalyticsPreviousRangeEnd,
  getAdminAnalyticsPreviousRangeStart,
  getAdminAnalyticsRangeStart,
  normalizeAdminAnalyticsRangeDays
} from '../../lib/analytics/admin-analytics-range';
import {
  buildOrderRevenueSummary,
  formatRevenueCents,
  isCancelledOrderStatus,
  isCompletedOrderStatus,
  isRevenueEligibleStatus,
  normalizeRevenueCents
} from '../../lib/analytics/order-revenue-summary';
import { buildProductSalesAnalyticsSummary } from '../../lib/analytics/product-sales-analytics';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runOrderRevenueSummaryTests() {
  const comparisonHelper = source('lib/analytics/analytics-comparison.ts');
  const rangeHelper = source('lib/analytics/admin-analytics-range.ts');
  const service = source('lib/analytics/order-revenue-summary.ts');
  const productSalesService = source('lib/analytics/product-sales-analytics.ts');
  const productSalesPanel = source('components/admin/AdminProductSalesAnalyticsPanel.tsx');
  const analyticsPage = source('app/admin/analytics/page.tsx');
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
  assert.equal(normalizeAdminAnalyticsRangeDays('7'), 7);
  assert.equal(normalizeAdminAnalyticsRangeDays('90'), 90);
  assert.equal(normalizeAdminAnalyticsRangeDays('999'), 30);
  assert.equal(getAdminAnalyticsRangeStart(new Date('2026-06-02T12:00:00Z'), 7).toISOString(), '2026-05-27T00:00:00.000Z');
  assert.equal(getAdminAnalyticsPreviousRangeStart(new Date('2026-06-02T12:00:00Z'), 7).toISOString(), '2026-05-20T00:00:00.000Z');
  assert.equal(getAdminAnalyticsPreviousRangeEnd(new Date('2026-06-02T12:00:00Z'), 7).toISOString(), '2026-05-26T00:00:00.000Z');
  assert.deepEqual(buildAnalyticsComparisonDelta(30, 20), {
    currentValue: 30,
    previousValue: 20,
    absoluteChange: 10,
    percentChange: 50,
    direction: 'up'
  });
  assert.equal(buildAnalyticsComparisonDelta(3, 0).percentChange, null);

  const now = new Date('2026-06-02T12:00:00Z');
  const rows = [
    {
      id: '1',
      status: 'completed',
      fulfillmentStatus: 'delivered',
      currency: 'CAD',
      totalCents: 10000,
      discountCents: 1000,
      createdAt: new Date('2026-06-01T12:00:00Z'),
      paymentAttempts: [{ provider: 'cash_on_delivery', status: 'paid', amountCents: 10000, currency: 'CAD' }]
    },
    {
      id: '2',
      status: 'pending',
      fulfillmentStatus: 'not_scheduled',
      currency: 'CAD',
      totalCents: 5000,
      createdAt: new Date('2026-05-20T12:00:00Z'),
      paymentAttempts: [{ provider: 'zarinpal', status: 'created', amountCents: 5000, currency: 'CAD' }]
    },
    { id: '3', status: 'cancelled', fulfillmentStatus: 'cancelled', currency: 'CAD', totalCents: 2500, createdAt: new Date('2026-05-31T12:00:00Z') },
    { id: '4', status: 'fulfilled', fulfillmentStatus: 'out_for_delivery', currency: 'USD', totalCents: 2000, createdAt: new Date('2026-04-01T12:00:00Z') },
    { id: '5', status: 'completed', fulfillmentStatus: 'delivered', currency: 'CAD', totalCents: 5000, createdAt: new Date('2026-05-02T12:00:00Z') }
  ];
  const summary = buildOrderRevenueSummary(rows, now);

  assert.equal(summary.analyticsRangeDays, 30);
  assert.equal(summary.totalOrders, 3);
  assert.equal(summary.totalRevenueCents, 15000);
  assert.equal(summary.averageOrderValueCents, 5000);
  assert.equal(summary.recentOrders, 3);
  assert.equal(summary.recentRevenueCents, 15000);
  assert.equal(summary.openOrders, 1);
  assert.equal(summary.completedOrders, 1);
  assert.equal(summary.cancelledOrders, 1);
  assert.equal(summary.byStatus.cancelled, 1);
  assert.equal(summary.byCurrency[0].currency, 'CAD');
  assert.equal(summary.byCurrency[0].revenueCents, 15000);
  assert.equal(summary.byFulfillmentStatus[0].orderCount, 1);
  assert.equal(summary.byFulfillmentStatus.some((row) => row.status === 'not_scheduled'), true);
  assert.equal(summary.byPaymentProvider.length, 2);
  assert.equal(summary.byPaymentProvider[0].attemptCount, 1);
  assert.equal(summary.discountImpact.discountedOrders, 1);
  assert.equal(summary.discountImpact.undiscountedOrders, 2);
  assert.equal(summary.discountImpact.totalDiscountCents, 1000);
  assert.equal(summary.discountImpact.discountedRevenueCents, 10000);
  assert.equal(summary.discountImpact.undiscountedRevenueCents, 5000);
  assert.equal(summary.comparison.totalOrders.previousValue, 1);
  assert.equal(summary.comparison.totalOrders.absoluteChange, 2);
  assert.equal(summary.comparison.totalRevenueCents.previousValue, 5000);
  assert.equal(summary.comparison.totalRevenueCents.percentChange, 200);
  assert.equal(summary.comparison.averageOrderValueCents.direction, 'flat');
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

  const sevenDaySummary = buildOrderRevenueSummary(rows, now, { rangeDays: 7 });
  assert.equal(sevenDaySummary.analyticsRangeDays, 7);
  assert.equal(sevenDaySummary.totalOrders, 2);
  assert.equal(sevenDaySummary.totalRevenueCents, 10000);
  assert.equal(sevenDaySummary.comparison.totalOrders.previousValue, 1);
  assert.equal(sevenDaySummary.comparison.totalRevenueCents.previousValue, 5000);
  assert.equal(sevenDaySummary.recentDaily.length, 7);
  assert.equal(sevenDaySummary.recentDaily[0].date, '2026-05-27');
  assert.equal(sevenDaySummary.recentDaily[6].date, '2026-06-02');

  const productSalesRows = [
    { orderId: '1', orderStatus: 'completed', currency: 'CAD', productId: 'rose-id', productTitle: 'Rose Bouquet', productCode: 'ROSE', quantity: 2, lineTotalCents: 12000, createdAt: new Date('2026-06-01T12:00:00Z') },
    { orderId: '2', orderStatus: 'pending', currency: 'CAD', productId: 'rose-id', productTitle: 'Rose Bouquet', productCode: 'ROSE', quantity: 1, lineTotalCents: 6000, createdAt: new Date('2026-05-30T12:00:00Z') },
    { orderId: '3', orderStatus: 'completed', currency: 'CAD', productId: 'orchid-id', productTitle: 'Orchid', productCode: 'ORCHID', quantity: 1, lineTotalCents: 9000, createdAt: new Date('2026-05-29T12:00:00Z') },
    { orderId: '4', orderStatus: 'cancelled', currency: 'CAD', productId: 'orchid-id', productTitle: 'Orchid', productCode: 'ORCHID', quantity: 10, lineTotalCents: 90000, createdAt: new Date('2026-05-29T12:00:00Z') },
    { orderId: '5', orderStatus: 'completed', currency: 'CAD', productId: 'old-id', productTitle: 'Old Product', productCode: 'OLD', quantity: 2, lineTotalCents: 4000, createdAt: new Date('2026-04-01T12:00:00Z') }
  ];
  const productSalesSummary = buildProductSalesAnalyticsSummary(productSalesRows, now);
  assert.equal(productSalesSummary.analyticsRangeDays, 30);
  assert.equal(productSalesSummary.rows[0].label, 'Rose Bouquet');
  assert.equal(productSalesSummary.rows[0].quantitySold, 3);
  assert.equal(productSalesSummary.rows[0].orderCount, 2);
  assert.equal(productSalesSummary.rows[0].revenueCents, 18000);
  assert.equal(productSalesSummary.rows[0].averageUnitRevenueCents, 6000);
  assert.equal(productSalesSummary.rows.some((row) => row.label === 'Old Product'), false);
  assert.equal(productSalesSummary.rows.some((row) => row.revenueCents === 90000), false);

  assert.match(comparisonHelper, /export type AnalyticsComparisonDelta/);
  assert.match(comparisonHelper, /buildAnalyticsComparisonDelta/);
  assert.match(comparisonHelper, /percentChange = previous > 0/);

  assert.match(rangeHelper, /ADMIN_ANALYTICS_RANGE_DAYS = \[7, 30, 90\]/);
  assert.match(rangeHelper, /normalizeAdminAnalyticsRangeDays/);
  assert.match(rangeHelper, /getAdminAnalyticsRangeStart/);
  assert.match(rangeHelper, /getAdminAnalyticsPreviousRangeStart/);
  assert.match(rangeHelper, /getAdminAnalyticsPreviousRangeEnd/);
  assert.match(rangeHelper, /isWithinAdminAnalyticsRange/);
  assert.match(rangeHelper, /isWithinAdminAnalyticsPreviousRange/);

  assert.match(service, /export type OrderRevenueSummary/);
  assert.match(service, /export type OrderRevenueDailyPoint/);
  assert.match(service, /export type OrderOperationalStatusSummary/);
  assert.match(service, /export type PaymentProviderRevenueSummary/);
  assert.match(service, /export type OrderDiscountImpactSummary/);
  assert.match(service, /export type OrderRevenueComparisonSummary/);
  assert.match(service, /comparison: OrderRevenueComparisonSummary/);
  assert.match(service, /analyticsRangeDays: AdminAnalyticsRangeDays/);
  assert.match(service, /buildRecentDailyPoints/);
  assert.match(service, /for \(let offset = 0; offset < rangeDays; offset \+= 1\)/);
  assert.match(service, /recentDaily: buildRecentDailyPoints\(scopedRows, now, analyticsRangeDays\)/);
  assert.match(service, /scopedRows = rows\.filter/);
  assert.match(service, /previousRows = rows\.filter/);
  assert.match(service, /buildOrderRevenueComparison/);
  assert.match(service, /getAdminAnalyticsPreviousRangeStart\(now, rangeDays\)/);
  assert.match(service, /createdAt: \{\s*gte: getAdminAnalyticsPreviousRangeStart\(now, rangeDays\)/s);
  assert.match(service, /take: 2000/);
  assert.match(service, /byFulfillmentStatus: buildOperationalStatusRows\(fulfillmentBuckets\)/);
  assert.match(service, /byPaymentProvider: buildPaymentProviderRows\(paymentProviderBuckets\)/);
  assert.match(service, /discountImpact: \{/);
  assert.match(service, /buildOrderRevenueSummary/);
  assert.match(service, /orderRevenueSummaryService = \{/);
  assert.match(service, /prisma\.checkoutOrder\.findMany/);
  assert.match(service, /paymentAttempts: \{/);
  assert.match(service, /discountCents: true/);
  assert.match(service, /fulfillmentStatus: true/);
  assert.match(service, /REVENUE_EXCLUDED_STATUSES/);

  assert.match(productSalesService, /export type ProductSalesAnalyticsSummary/);
  assert.match(productSalesService, /buildProductSalesAnalyticsSummary/);
  assert.match(productSalesService, /isRevenueEligibleStatus\(row\.orderStatus\)/);
  assert.match(productSalesService, /prisma\.checkoutOrderItem\.findMany/);
  assert.match(productSalesService, /lineTotalCents: true/);
  assert.match(productSalesService, /productTitle: true/);
  assert.match(productSalesService, /productSalesAnalyticsService/);
  assert.match(productSalesService, /take: 5000/);

  assert.match(productSalesPanel, /export async function AdminProductSalesAnalyticsPanel/);
  assert.match(productSalesPanel, /Product sales performance/);
  assert.match(productSalesPanel, /id="product-sales-analytics"/);
  assert.match(productSalesPanel, /Units sold by product/);
  assert.match(productSalesPanel, /Revenue by product/);
  assert.match(productSalesPanel, /AdminAnalyticsBarChart/);

  assert.match(analyticsPage, /AdminProductSalesAnalyticsPanel/);
  assert.match(analyticsPage, /productSalesAnalyticsService\.summary\(\{ rangeDays \}\)/);
  assert.match(analyticsPage, /EMPTY_PRODUCT_SALES_ANALYTICS_SUMMARY/);
  assert.match(analyticsPage, /sectionHref\('product-sales-analytics', rangeDays\)/);

  assert.match(panel, /export async function AdminOrderRevenueSummaryPanel/);
  assert.match(panel, /Order count and revenue/);
  assert.match(panel, /formatRangeLabel\(summary\.analyticsRangeDays/);
  assert.match(panel, /Range revenue/);
  assert.match(panel, /selected analytics range/);
  assert.match(panel, /summary\.recentDaily\.map/);
  assert.match(panel, /AdminAnalyticsTrendChart/);
  assert.match(panel, /Orders over time/);
  assert.match(panel, /Revenue over time/);
  assert.match(panel, /Average order value over time/);
  assert.match(panel, /Operational breakdown charts/);
  assert.match(panel, /Fulfillment by status/);
  assert.match(panel, /Payment method mix/);
  assert.match(panel, /Discount usage impact/);
  assert.match(panel, /summary\.byFulfillmentStatus\.map/);
  assert.match(panel, /summary\.byPaymentProvider\.map/);
  assert.match(panel, /summary\.discountImpact\.discountedOrders/);
  assert.match(panel, /formatComparisonDelta/);
  assert.match(panel, /vs previous range/);
  assert.match(panel, /summary\.comparison\.totalOrders/);
  assert.match(panel, /summary\.comparison\.totalRevenueCents/);
  assert.match(panel, /summary\.comparison\.averageOrderValueCents/);

  assert.match(consolePage, /AdminOrderRevenueSummaryPanel/);
  assert.match(consolePage, /EMPTY_ORDER_REVENUE_SUMMARY/);
  assert.match(consolePage, /authenticated \? orderRevenueSummaryService\.summary\(\) : Promise\.resolve\(EMPTY_ORDER_REVENUE_SUMMARY\)/);
  assert.match(consolePage, /const showOverviewExtras = activeTab === 'overview' && overviewSection === 'all'/);
  assert.match(consolePage, /showOverviewExtras && authenticated \? <AdminOrderRevenueSummaryPanel/);

  assert.match(roadmap, /- \[x\] Add order count and revenue summaries\./);

  console.log('order-revenue-summary.test.ts passed');
}
