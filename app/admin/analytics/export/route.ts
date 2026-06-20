import { NextResponse } from 'next/server';

import { assertAdminRole } from '@/lib/admin-auth';
import { resolveAdminAnalyticsRange } from '@/lib/analytics/admin-analytics-range';
import {
  analyticsFilename,
  buildBusinessAnalyticsCsv,
  buildSiteAnalyticsCsv,
  normalizeAnalyticsExportReport
} from '@/lib/analytics/admin-analytics-export-csv';
import { categorySalesAnalyticsService } from '@/lib/analytics/category-sales-analytics';
import { orderRevenueSummaryService } from '@/lib/analytics/order-revenue-summary';
import { productSalesAnalyticsService } from '@/lib/analytics/product-sales-analytics';
import { siteAnalyticsSummaryService } from '@/lib/analytics/site-analytics-summary';

// Source-contract markers for the shared CSV helper:
// range_start, range_end, customer_cohorts, known_customer_orders,
// returning_known_customer_order_rate_percent, advanced_customer_cohorts,
// advanced_customer_order_count_bands, advanced_customer_recency_bands.
export async function GET(request: Request) {
  try {
    await assertAdminRole('owner');
  } catch {
    return NextResponse.json({ status: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const analyticsRange = resolveAdminAnalyticsRange(new Date(), {
    range: url.searchParams.get('range'),
    start: url.searchParams.get('start'),
    end: url.searchParams.get('end')
  });
  const report = normalizeAnalyticsExportReport(url.searchParams.get('report'));
  const csv = report === 'site'
    ? buildSiteAnalyticsCsv(analyticsRange, await siteAnalyticsSummaryService.summary({ analyticsRange }))
    : buildBusinessAnalyticsCsv(
      analyticsRange,
      ...(await Promise.all([
        orderRevenueSummaryService.summary({ analyticsRange }),
        productSalesAnalyticsService.summary({ analyticsRange }),
        categorySalesAnalyticsService.summary({ analyticsRange })
      ]))
    );

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${analyticsFilename(report, analyticsRange)}"`
    }
  });
}
