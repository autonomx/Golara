import { NextResponse } from 'next/server';

import { assertAdminRole } from '@/lib/admin-auth';
import { normalizeAdminAnalyticsRangeDays } from '@/lib/analytics/admin-analytics-range';
import { orderRevenueSummaryService } from '@/lib/analytics/order-revenue-summary';
import { siteAnalyticsSummaryService } from '@/lib/analytics/site-analytics-summary';

type AnalyticsExportReport = 'business' | 'site';

function csvCell(value: unknown) {
  const text = value instanceof Date ? value.toISOString() : String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function csvRow(values: unknown[]) {
  return values.map(csvCell).join(',');
}

function normalizeReport(value: string | null): AnalyticsExportReport {
  return value === 'site' ? 'site' : 'business';
}

function analyticsFilename(report: AnalyticsExportReport, rangeDays: number) {
  return `golara-analytics-${report}-${rangeDays}d.csv`;
}

function buildBusinessAnalyticsCsv(rangeDays: number, summary: Awaited<ReturnType<typeof orderRevenueSummaryService.summary>>) {
  const rows: unknown[][] = [
    ['report', 'section', 'metric', 'label', 'value', 'currency', 'notes'],
    ['business', 'metadata', 'range_days', 'selected range', rangeDays, '', ''],
    ['business', 'metadata', 'generated_at', 'generated at', summary.generatedAt, '', ''],
    ['business', 'summary', 'total_orders', 'Total orders', summary.totalOrders, '', ''],
    ['business', 'summary', 'total_revenue_cents', 'Total revenue cents', summary.totalRevenueCents, summary.primaryCurrency, 'Revenue excludes cancelled/refunded/voided orders'],
    ['business', 'summary', 'average_order_value_cents', 'Average order value cents', summary.averageOrderValueCents, summary.primaryCurrency, ''],
    ['business', 'summary', 'open_orders', 'Open orders', summary.openOrders, '', ''],
    ['business', 'summary', 'completed_orders', 'Completed orders', summary.completedOrders, '', ''],
    ['business', 'summary', 'cancelled_orders', 'Cancelled orders', summary.cancelledOrders, '', ''],
    ['business', 'comparison', 'total_orders_delta', 'Total orders vs previous range', summary.comparison.totalOrders.delta, '', `${summary.comparison.totalOrders.percentChange ?? ''}`],
    ['business', 'comparison', 'total_revenue_delta_cents', 'Revenue vs previous range', summary.comparison.totalRevenueCents.delta, summary.primaryCurrency, `${summary.comparison.totalRevenueCents.percentChange ?? ''}`],
    ['business', 'comparison', 'average_order_value_delta_cents', 'AOV vs previous range', summary.comparison.averageOrderValueCents.delta, summary.primaryCurrency, `${summary.comparison.averageOrderValueCents.percentChange ?? ''}`]
  ];

  for (const point of summary.recentDaily) {
    rows.push(['business', 'daily', 'order_count', point.date, point.orderCount, '', '']);
    rows.push(['business', 'daily', 'revenue_cents', point.date, point.revenueCents, summary.primaryCurrency, '']);
    rows.push(['business', 'daily', 'average_order_value_cents', point.date, point.averageOrderValueCents, summary.primaryCurrency, '']);
  }

  for (const [status, count] of Object.entries(summary.byStatus)) {
    rows.push(['business', 'orders_by_status', 'order_count', status, count, '', '']);
  }

  for (const row of summary.byCurrency) {
    rows.push(['business', 'revenue_by_currency', 'order_count', row.currency, row.orderCount, row.currency, '']);
    rows.push(['business', 'revenue_by_currency', 'revenue_cents', row.currency, row.revenueCents, row.currency, '']);
    rows.push(['business', 'revenue_by_currency', 'average_order_value_cents', row.currency, row.averageOrderValueCents, row.currency, '']);
  }

  for (const row of summary.byFulfillmentStatus) {
    rows.push(['business', 'fulfillment_by_status', 'order_count', row.status, row.orderCount, summary.primaryCurrency, '']);
    rows.push(['business', 'fulfillment_by_status', 'revenue_cents', row.status, row.revenueCents, summary.primaryCurrency, '']);
  }

  for (const row of summary.byPaymentProvider) {
    rows.push(['business', 'payment_method_mix', 'attempt_count', row.provider, row.attemptCount, row.currency, '']);
    rows.push(['business', 'payment_method_mix', 'order_count', row.provider, row.orderCount, row.currency, '']);
    rows.push(['business', 'payment_method_mix', 'amount_cents', row.provider, row.amountCents, row.currency, '']);
  }

  rows.push(['business', 'discount_impact', 'discounted_orders', 'Discounted orders', summary.discountImpact.discountedOrders, '', '']);
  rows.push(['business', 'discount_impact', 'undiscounted_orders', 'Undiscounted orders', summary.discountImpact.undiscountedOrders, '', '']);
  rows.push(['business', 'discount_impact', 'total_discount_cents', 'Total discount cents', summary.discountImpact.totalDiscountCents, summary.primaryCurrency, '']);
  rows.push(['business', 'discount_impact', 'discounted_revenue_cents', 'Discounted revenue cents', summary.discountImpact.discountedRevenueCents, summary.primaryCurrency, '']);
  rows.push(['business', 'discount_impact', 'undiscounted_revenue_cents', 'Undiscounted revenue cents', summary.discountImpact.undiscountedRevenueCents, summary.primaryCurrency, '']);

  return rows.map(csvRow).join('\n');
}

function buildSiteAnalyticsCsv(rangeDays: number, summary: Awaited<ReturnType<typeof siteAnalyticsSummaryService.summary>>) {
  const rows: unknown[][] = [
    ['report', 'section', 'metric', 'label', 'value', 'notes'],
    ['site', 'metadata', 'range_days', 'selected range', rangeDays, ''],
    ['site', 'metadata', 'generated_at', 'generated at', summary.generatedAt, ''],
    ['site', 'summary', 'total_events', 'Total events', summary.totalEvents, ''],
    ['site', 'summary', 'recent_events', 'Recent events', summary.recentEvents, ''],
    ['site', 'summary', 'unique_paths', 'Unique paths', summary.uniquePaths, ''],
    ['site', 'comparison', 'total_events_delta', 'Total events vs previous range', summary.comparison.totalEvents.delta, `${summary.comparison.totalEvents.percentChange ?? ''}`],
    ['site', 'comparison', 'page_views_delta', 'Page views vs previous range', summary.comparison.pageViews.delta, `${summary.comparison.pageViews.percentChange ?? ''}`],
    ['site', 'comparison', 'product_views_delta', 'Product views vs previous range', summary.comparison.productViews.delta, `${summary.comparison.productViews.percentChange ?? ''}`],
    ['site', 'comparison', 'checkout_completed_delta', 'Checkout completed vs previous range', summary.comparison.checkoutCompleted.delta, `${summary.comparison.checkoutCompleted.percentChange ?? ''}`],
    ['site', 'funnel', 'page_views', 'Page views', summary.checkoutFunnel.pageViews, ''],
    ['site', 'funnel', 'product_views', 'Product views', summary.checkoutFunnel.productViews, ''],
    ['site', 'funnel', 'add_to_cart', 'Add to cart', summary.checkoutFunnel.addToCart, ''],
    ['site', 'funnel', 'checkout_started', 'Checkout started', summary.checkoutFunnel.checkoutStarted, ''],
    ['site', 'funnel', 'checkout_completed', 'Checkout completed', summary.checkoutFunnel.checkoutCompleted, '']
  ];

  for (const point of summary.recentDaily) {
    rows.push(['site', 'daily', 'event_count', point.date, point.eventCount, '']);
  }

  for (const row of summary.byEventType) {
    rows.push(['site', 'events_by_type', 'event_count', row.label, row.count, '']);
  }

  for (const row of summary.topPages) {
    rows.push(['site', 'top_pages', 'event_count', row.label, row.count, 'Aggregate path only; no raw session export']);
  }

  for (const row of summary.topProductViews) {
    rows.push(['site', 'top_product_views', 'event_count', row.label, row.count, 'Aggregate product id/path only']);
  }

  for (const row of summary.topCategoryViews) {
    rows.push(['site', 'top_category_views', 'event_count', row.label, row.count, 'Aggregate category id/path only']);
  }

  for (const row of summary.topSearchTerms) {
    rows.push(['site', 'top_search_terms', 'event_count', row.label, row.count, 'Aggregate search term only']);
  }

  return rows.map(csvRow).join('\n');
}

export async function GET(request: Request) {
  try {
    await assertAdminRole('owner');
  } catch {
    return NextResponse.json({ status: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const rangeDays = normalizeAdminAnalyticsRangeDays(url.searchParams.get('range'));
  const report = normalizeReport(url.searchParams.get('report'));
  const csv = report === 'site'
    ? buildSiteAnalyticsCsv(rangeDays, await siteAnalyticsSummaryService.summary({ rangeDays }))
    : buildBusinessAnalyticsCsv(rangeDays, await orderRevenueSummaryService.summary({ rangeDays }));

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${analyticsFilename(report, rangeDays)}"`
    }
  });
}
