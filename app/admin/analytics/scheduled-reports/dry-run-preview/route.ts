import { NextResponse } from 'next/server';

import { assertAdminRole } from '@/lib/admin-auth';
import { resolveAdminAnalyticsRange, type AdminAnalyticsRangeInput } from '@/lib/analytics/admin-analytics-range';
import { buildBusinessAnalyticsCsv, buildSiteAnalyticsCsv } from '@/lib/analytics/admin-analytics-export-csv';
import {
  buildScheduledReportDryRunPreview,
  isScheduledReportDryRunPreviewRuntimeEnabled,
  loadScheduledReportDryRunPreviewEndpointPreview
} from '@/lib/analytics/admin-analytics-scheduled-report-dry-run-preview';
import { recordScheduledReportEndpointRequest, shouldAttachScheduledReportRecordingDelegate } from '@/lib/analytics/admin-analytics-scheduled-report-recording-endpoint';
import { categorySalesAnalyticsService } from '@/lib/analytics/category-sales-analytics';
import { orderRevenueSummaryService } from '@/lib/analytics/order-revenue-summary';
import { productSalesAnalyticsService } from '@/lib/analytics/product-sales-analytics';
import { siteAnalyticsSummaryService } from '@/lib/analytics/site-analytics-summary';

export const dynamic = 'force-dynamic';

type DryRunPreviewPayload = {
  id?: unknown;
  cadence?: unknown;
  range?: AdminAnalyticsRangeInput;
  start?: AdminAnalyticsRangeInput;
  end?: AdminAnalyticsRangeInput;
};

function objectValue(value: unknown): DryRunPreviewPayload {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as DryRunPreviewPayload : {};
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function cadenceValue(value: unknown) {
  return value === 'monthly' ? 'monthly' : 'weekly';
}

async function scheduledReportDryRunRecordingDelegate() {
  if (!shouldAttachScheduledReportRecordingDelegate('dry-run-evidence')) return null;
  const { prisma } = await import('@/lib/prisma');
  return {
    update: (args: { where: { id: string }; data: Record<string, unknown> }) =>
      prisma.adminAnalyticsScheduledReport.update({ where: args.where, data: args.data })
  };
}

export async function POST(request: Request) {
  try {
    const identity = await assertAdminRole('owner');
    const endpointPreview = loadScheduledReportDryRunPreviewEndpointPreview({ isOwner: identity.role === 'owner' });
    if (!isScheduledReportDryRunPreviewRuntimeEnabled()) {
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
    const preview = buildScheduledReportDryRunPreview({
      isOwner: identity.role === 'owner',
      reportId: stringValue(payload.id),
      cadence: cadenceValue(payload.cadence),
      range: analyticsRange,
      businessCsv: buildBusinessAnalyticsCsv(analyticsRange, orderSummary, productSalesSummary, categorySalesSummary),
      siteCsv: buildSiteAnalyticsCsv(analyticsRange, siteSummary)
    });

    if (!preview.canRecord || !preview.reportId) {
      return NextResponse.json({ ok: false, preview }, { status: 400 });
    }

    const recording = await recordScheduledReportEndpointRequest({
      target: 'dry-run-evidence',
      isOwner: identity.role === 'owner',
      payload: { id: preview.reportId, evidence: preview.evidence },
      delegate: await scheduledReportDryRunRecordingDelegate()
    });

    return NextResponse.json({ ok: recording.ok, preview, recording }, { status: recording.httpStatus });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: 'Owner admin session required for scheduled-report dry-run preview.'
      },
      { status: 403 }
    );
  }
}
