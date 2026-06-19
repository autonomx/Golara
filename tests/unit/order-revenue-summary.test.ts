import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildAnalyticsComparisonDelta } from '../../lib/analytics/analytics-comparison';
import {
  adminAnalyticsRangeQueryString,
  getAdminAnalyticsPreviousRangeEnd,
  getAdminAnalyticsPreviousRangeStart,
  getAdminAnalyticsRangeStart,
  normalizeAdminAnalyticsRangeDays,
  resolveAdminAnalyticsRange
} from '../../lib/analytics/admin-analytics-range';
import { buildCategorySalesAnalyticsSummary } from '../../lib/analytics/category-sales-analytics';
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
  const categorySalesService = source('lib/analytics/category-sales-analytics.ts');
  const productSalesPanel = source('components/admin/AdminProductSalesAnalyticsPanel.tsx');
  const categorySalesPanel = source('components/admin/AdminCategorySalesAnalyticsPanel.tsx');
  const analyticsPage = source('app/admin/analytics/page.tsx');
  const exportRoute = source('app/admin/analytics/export/route.ts');
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
  assert.equal(normalizeAdminAnalyticsRangeDays('365'), 365);
  assert.equal(normalizeAdminAnalyticsRangeDays('999'), 30);
  assert.equal(getAdminAnalyticsRangeStart(new Date('2026-06-02T12:00:00Z'), 7).toISOString(), '2026-05-27T00:00:00.000Z');
  assert.equal(getAdminAnalyticsRangeStart(new Date('2026-06-02T12:00:00Z'), 365).toISOString(), '2025-06-03T00:00:00.000Z');
  assert.equal(getAdminAnalyticsPreviousRangeStart(new Date('2026-06-02T12:00:00Z'), 7).toISOString(), '2026-05-20T00:00:00.000Z');
  assert.equal(getAdminAnalyticsPreviousRangeEnd(new Date('2026-06-02T12:00:00Z'), 7).toISOString(), '2026-05-26T00:00:00.000Z');
  const customRange = resolveAdminAnalyticsRange(new Date('2026-06-02T12:00:00Z'), { start: '2026-05-31', end: '2026-06-01' });
  assert.equal(customRange.mode, 'custom');
  assert.equal(customRange.rangeDays, 2);
  assert.equal(customRange.label, '2026-05-31 to 2026-06-01');
  assert.equal(customRange.startDate.toISOString(), '2026-05-31T00:00:00.000Z');
  assert.equal(customRange.endDate.toISOString(), '2026-06-01T00:00:00.000Z');
  assert.equal(customRange.previousStartDate.toISOString(), '2026-05-29T00:00:00.000Z');
  assert.equal(customRange.previousEndDate.toISOString(), '2026-05-30T00:00:00.000Z');
  assert.equal(adminAnalyticsRangeQueryString(customRange, { report: 'business' }), 'start=2026-05-31&end=2026-06-01&report=business');
  assert.equal(resolveAdminAnalyticsRange(new Date('2026-06-02T12:00:00Z'), { start: '2026-06-03', end: '2026-06-01' }).mode, 'preset');
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
  assert.equal(summary.analyticsRangeLabel, 'Last 30 days');
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
  assert.equal(summary.byFulfillmentStatus.some((row) => row.status === 'not_scheduled'), true);
  assert.equal(summary.byPaymentProvider.length, 2);
  assert.equal(summary.discountImpact.discountedOrders, 1);
  assert.equal(summary.discountImpact.undiscountedOrders, 2);
  assert.equal(summary.comparison.totalOrders.previousValue, 1);
  assert.equal(summary.comparison.totalOrders.absoluteChange, 2);
  assert.equal(summary.comparison.totalRevenueCents.percentChange, 200);
  assert.equal(summary.recentDaily.length, 30);
  assert.equal(summary.recentDaily[0].date, '2026-05-04');
  assert.equal(summary.recentDaily[29].date, '2026-06-02');

  const sevenDaySummary = buildOrderRevenueSummary(rows, now, { rangeDays: 7 });
  assert.equal(sevenDaySummary.analyticsRangeDays, 7);
  assert.equal(sevenDaySummary.totalOrders, 2);
  assert.equal(sevenDaySummary.totalRevenueCents, 10000);
  assert.equal(sevenDaySummary.recentDaily.length, 7);

  const customSummary = buildOrderRevenueSummary(rows, now, { analyticsRange: customRange });
  assert.equal(customSummary.analyticsRangeMode, 'custom');
  assert.equal(customSummary.analyticsRangeDays, 2);
  assert.equal(customSummary.analyticsRangeLabel, '2026-05-31 to 2026-06-01');
  assert.equal(customSummary.totalOrders, 2);
  assert.equal(customSummary.totalRevenueCents, 10000);
  assert.equal(customSummary.recentDaily.length, 2);
  assert.equal(customSummary.recentDaily[0].date, '2026-05-31');
  assert.equal(customSummary.recentDaily[1].date, '2026-06-01');

  const annualSummary = buildOrderRevenueSummary(rows, now, { rangeDays: 365 });
  assert.equal(annualSummary.analyticsRangeDays, 365);
  assert.equal(annualSummary.totalOrders, 5);
  assert.equal(annualSummary.recentDaily.length, 365);

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
  assert.equal(productSalesSummary.rows.some((row) => row.label === 'Old Product'), false);
  assert.equal(productSalesSummary.rows.some((row) => row.revenueCents === 90000), false);
  const customProductSalesSummary = buildProductSalesAnalyticsSummary(productSalesRows, now, { start: '2026-05-29', end: '2026-05-30' });
  assert.equal(customProductSalesSummary.analyticsRangeMode, 'custom');
  assert.equal(customProductSalesSummary.rows[0].label, 'Orchid');

  const categorySalesRows = [
    { orderId: '1', orderStatus: 'completed', currency: 'CAD', categoryId: 'flowers-id', categoryTitle: 'Fresh Flowers', categorySlug: 'fresh-flowers', quantity: 2, lineTotalCents: 12000, createdAt: new Date('2026-06-01T12:00:00Z') },
    { orderId: '2', orderStatus: 'pending', currency: 'CAD', categoryId: 'flowers-id', categoryTitle: 'Fresh Flowers', categorySlug: 'fresh-flowers', quantity: 1, lineTotalCents: 6000, createdAt: new Date('2026-05-30T12:00:00Z') },
    { orderId: '3', orderStatus: 'completed', currency: 'CAD', categoryId: 'plants-id', categoryTitle: 'Plants', categorySlug: 'plants', quantity: 1, lineTotalCents: 9000, createdAt: new Date('2026-05-29T12:00:00Z') },
    { orderId: '4', orderStatus: 'voided', currency: 'CAD', categoryId: 'plants-id', categoryTitle: 'Plants', categorySlug: 'plants', quantity: 8, lineTotalCents: 72000, createdAt: new Date('2026-05-29T12:00:00Z') },
    { orderId: '5', orderStatus: 'completed', currency: 'CAD', categoryId: 'old-id', categoryTitle: 'Old Category', categorySlug: 'old-category', quantity: 2, lineTotalCents: 4000, createdAt: new Date('2026-04-01T12:00:00Z') }
  ];
  const categorySalesSummary = buildCategorySalesAnalyticsSummary(categorySalesRows, now);
  assert.equal(categorySalesSummary.analyticsRangeDays, 30);
  assert.equal(categorySalesSummary.rows[0].label, 'Fresh Flowers');
  assert.equal(categorySalesSummary.rows[0].quantitySold, 3);
  assert.equal(categorySalesSummary.rows[0].orderCount, 2);
  assert.equal(categorySalesSummary.rows[0].revenueCents, 18000);
  assert.equal(categorySalesSummary.rows.some((row) => row.label === 'Old Category'), false);
  assert.equal(categorySalesSummary.rows.some((row) => row.revenueCents === 72000), false);
  const customCategorySalesSummary = buildCategorySalesAnalyticsSummary(categorySalesRows, now, { start: '2026-05-29', end: '2026-05-30' });
  assert.equal(customCategorySalesSummary.analyticsRangeMode, 'custom');
  assert.equal(customCategorySalesSummary.rows[0].label, 'Plants');

  assert.match(comparisonHelper, /export type AnalyticsComparisonDelta/);
  assert.match(comparisonHelper, /buildAnalyticsComparisonDelta/);
  assert.match(comparisonHelper, /percentChange = previous > 0/);
  assert.match(rangeHelper, /ADMIN_ANALYTICS_RANGE_DAYS = \[7, 30, 90, 365\]/);
  assert.match(rangeHelper, /MAX_ADMIN_ANALYTICS_CUSTOM_RANGE_DAYS = 365/);
  assert.match(rangeHelper, /export type AdminAnalyticsResolvedRange/);
  assert.match(rangeHelper, /resolveAdminAnalyticsRange/);
  assert.match(rangeHelper, /adminAnalyticsRangeQueryString/);
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
  assert.match(service, /analyticsRangeDays: number/);
  assert.match(service, /analyticsRangeLabel: string/);
  assert.match(service, /buildRecentDailyPoints/);
  assert.match(service, /paymentAttempts/);
  assert.match(service, /getAdminAnalyticsPreviousRangeStart/);
  assert.match(service, /summary\(options: OrderRevenueSummaryOptions/);
  assert.match(service, /take: 2000/);
  assert.match(productSalesService, /buildProductSalesAnalyticsSummary/);
  assert.match(productSalesService, /checkoutOrderItem\.findMany/);
  assert.match(productSalesService, /productTitle/);
  assert.match(productSalesService, /averageUnitRevenueCents/);
  assert.match(productSalesService, /isRevenueEligibleStatus/);
  assert.match(productSalesService, /analyticsRange/);
  assert.match(categorySalesService, /buildCategorySalesAnalyticsSummary/);
  assert.match(categorySalesService, /checkoutOrderItem\.findMany/);
  assert.match(categorySalesService, /categoryId/);
  assert.match(categorySalesService, /categoryTitle/);
  assert.match(categorySalesService, /averageUnitRevenueCents/);
  assert.match(categorySalesService, /isRevenueEligibleStatus/);
  assert.match(categorySalesService, /analyticsRange/);
  assert.match(productSalesPanel, /id="product-sales-analytics"/);
  assert.match(productSalesPanel, /Product sales performance/);
  assert.match(productSalesPanel, /Units sold by product/);
  assert.match(productSalesPanel, /Revenue by product/);
  assert.match(categorySalesPanel, /id="category-sales-analytics"/);
  assert.match(categorySalesPanel, /Category sales performance/);
  assert.match(categorySalesPanel, /Units sold by category/);
  assert.match(categorySalesPanel, /Revenue by category/);
  assert.match(analyticsPage, /resolveAdminAnalyticsRange/);
  assert.match(analyticsPage, /name="start"/);
  assert.match(analyticsPage, /name="end"/);
  assert.match(analyticsPage, /productSalesAnalyticsService\.summary\(\{ analyticsRange \}\)/);
  assert.match(analyticsPage, /categorySalesAnalyticsService\.summary\(\{ analyticsRange \}\)/);
  assert.match(analyticsPage, /sectionHref\('product-sales-analytics', analyticsRange\)/);
  assert.match(analyticsPage, /sectionHref\('category-sales-analytics', analyticsRange\)/);
  assert.match(exportRoute, /resolveAdminAnalyticsRange/);
  assert.match(exportRoute, /range_start/);
  assert.match(exportRoute, /range_end/);
  assert.match(exportRoute, /orderRevenueSummaryService\.summary\(\{ analyticsRange \}\)/);
  assert.match(panel, /summary\.comparison\.totalOrders/);
  assert.match(panel, /summary\.byFulfillmentStatus\.map/);
  assert.match(panel, /summary\.byPaymentProvider\.map/);
  assert.match(panel, /summary\.discountImpact/);
  assert.match(panel, /Payment method mix/);
  assert.match(panel, /Discount usage impact/);
  assert.match(panel, /vs previous range/);
  assert.match(consolePage, /AdminOrderRevenueSummaryPanel/);
  assert.match(consolePage, /orderRevenueSummaryService\.summary\(\)/);
  assert.match(roadmap, /order count and revenue summaries/i);

  console.log('order-revenue-summary.test.ts passed');
}
