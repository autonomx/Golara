import { NextResponse } from 'next/server';

import { assertAdminRole } from '@/lib/admin-auth';
import {
  loadScheduledReportReadEndpointPreview,
  shouldAttachScheduledReportReadDelegate
} from '@/lib/analytics/admin-analytics-scheduled-report-read-endpoint';
import type { AdminAnalyticsScheduledReportGeneratedClientReadDelegate } from '@/lib/analytics/admin-analytics-scheduled-report-repository';

export const dynamic = 'force-dynamic';

async function scheduledReportReadDelegate(): Promise<AdminAnalyticsScheduledReportGeneratedClientReadDelegate | null> {
  if (!shouldAttachScheduledReportReadDelegate()) return null;
  const { prisma } = await import('@/lib/prisma');
  return prisma.adminAnalyticsScheduledReport;
}

export async function GET() {
  try {
    const identity = await assertAdminRole('owner');
    const model = await loadScheduledReportReadEndpointPreview({
      isOwner: identity.role === 'owner',
      delegate: await scheduledReportReadDelegate()
    });

    return NextResponse.json({ ok: true, scheduledReports: model });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Owner admin session required for scheduled-report reads.'
      },
      { status: 403 }
    );
  }
}
