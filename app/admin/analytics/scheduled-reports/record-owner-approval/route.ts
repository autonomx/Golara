import { NextResponse } from 'next/server';

import { assertAdminRole } from '@/lib/admin-auth';
import {
  recordScheduledReportEndpointRequest,
  shouldAttachScheduledReportRecordingDelegate
} from '@/lib/analytics/admin-analytics-scheduled-report-recording-endpoint';

export const dynamic = 'force-dynamic';

async function scheduledReportRecordingDelegate() {
  if (!shouldAttachScheduledReportRecordingDelegate('owner-approval')) return null;
  const { prisma } = await import('@/lib/prisma');
  return {
    update: (args: { where: { id: string }; data: Record<string, unknown> }) =>
      prisma.adminAnalyticsScheduledReport.update({ where: args.where, data: args.data })
  };
}

export async function POST(request: Request) {
  try {
    const identity = await assertAdminRole('owner');
    const result = await recordScheduledReportEndpointRequest({
      target: 'owner-approval',
      isOwner: identity.role === 'owner',
      payload: await request.json().catch(() => null),
      delegate: await scheduledReportRecordingDelegate()
    });

    return NextResponse.json(result, { status: result.httpStatus });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Owner admin session required for scheduled-report recording.'
      },
      { status: 403 }
    );
  }
}
