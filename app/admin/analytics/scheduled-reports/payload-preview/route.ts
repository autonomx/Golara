import { NextResponse } from 'next/server';

import { assertAdminRole } from '@/lib/admin-auth';
import { resolveAdminAnalyticsRange, type AdminAnalyticsRangeInput } from '@/lib/analytics/admin-analytics-range';
import { buildBusinessAnalyticsCsv, buildSiteAnalyticsCsv } from '@/lib/analytics/admin-analytics-export-csv';
import {
  buildScheduledReportDeliveryPayloadPreview,
  isScheduledReportDeliveryPayloadPreviewRuntimeEnabled,
  loadScheduledReportDeliveryPayloadPreviewEndpointPreview
} from '@/lib/analytics/admin-analytics-scheduled-report-delivery-payload';
import { categorySalesAnalyticsService } from '@/lib/analytics/category-sales-analytics';
import { orderRevenueSummaryService } from '@/lib/analytics/order-revenue-summary';
import { productSalesAnalyticsService } from '@/lib/analytics/product-sales-analytics';
import { siteAnalyticsSummaryService } from '@/lib/analytics/site-analytics-summary';

export const dynamic = 'force-dynamic';

type PayloadPreviewBody = {
  id?: unknown;
  cadence?: unknown;
  range?: AdminAnalyticsRangeInput;
  start?: AdminAnalyticsRangeInput;
  end?: AdminAnalyticsRangeInput;
};

function objectValue(value: unknown): PayloadPreviewBody {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as PayloadPreviewBody : {};
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function cadenceValue(value: unknown) {
  return value === 'monthly' ? 'monthly' : 'weekly';
}

export async function POST(request: Request) {
  try {
    const identity = await assertAdminRole('owner');
    const endpointPreview = loadScheduledReportDeliveryPayloadPreviewEndpointPreview({ isOwner: identity.role === 'owner' });
    if (!isScheduledReportDeliveryPayloadPreviewRuntimeEnabled()) {
      return NextResponse.json({ ok: false, preview: endpointPreview }, { status: 423 });
    }

    const payload = objectValue(await request.json().catch(() => null));
    const analyticsRange = resolveAdminAnalyticsRange(new Date(), {
      range: payload.range,
      start: payload.start,
      end: payload.end
    });
    const [orderSummary, productSalesSummary, categorySalesSummary, siteSummary] = await Promise.all([
      orderRevenueSummaryService.summary({ analyticsRange }),
      productSalesAnalyticsService.summary({ analyticsRange }),
      categorySalesAnalyticsService.summary({ analyticsRange }),
      siteAnalyticsSummaryService.summary({ analyticsRange })
    ]);

    const preview = buildScheduledReportDeliveryPayloadPreview({
      isOwner: identity.role === 'owner',
      reportId: stringValue(payload.id),
      cadence: cadenceValue(payload.cadence),
      range: analyticsRange,
      businessCsv: buildBusinessAnalyticsCsv(analyticsRange, orderSummary, productSalesSummary, categorySalesSummary),
      siteCsv: buildSiteAnalyticsCsv(analyticsRange, siteSummary)
    });

    return NextResponse.json({ ok: preview.canMaterialize, preview }, { status: preview.canMaterialize ? 200 : 400 });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: 'Owner admin session required for scheduled-report payload preview.'
      },
      { status: 403 }
    );
  }
}
