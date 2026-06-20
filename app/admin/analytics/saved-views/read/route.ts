import { NextResponse } from 'next/server';

import { assertAdminRole } from '@/lib/admin-auth';
import {
  loadAdminAnalyticsSavedViewReadEndpointModel,
  shouldAttachAdminAnalyticsSavedViewReadDelegate,
  type AdminAnalyticsSavedViewGeneratedClientReadDelegate
} from '@/lib/analytics/admin-analytics-saved-view-read-endpoint';

export const dynamic = 'force-dynamic';

async function savedViewReadDelegate() {
  if (!shouldAttachAdminAnalyticsSavedViewReadDelegate()) return null;
  const { prisma } = await import('@/lib/prisma');
  return (prisma as unknown as { adminAnalyticsSavedView?: unknown }).adminAnalyticsSavedView ?? null;
}

export async function GET() {
  try {
    const identity = await assertAdminRole('staff');
    const delegate = await savedViewReadDelegate();
    const model = await loadAdminAnalyticsSavedViewReadEndpointModel({
      actorRole: identity.role === 'owner' ? 'owner' : 'staff',
      delegate:
        delegate && typeof delegate === 'object' && 'findMany' in delegate
          ? (delegate as AdminAnalyticsSavedViewGeneratedClientReadDelegate)
          : null
    });

    return NextResponse.json({ ok: true, savedViews: model });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Owner or staff admin session required for saved-view reads.'
      },
      { status: 403 }
    );
  }
}
