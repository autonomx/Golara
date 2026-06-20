import { NextResponse } from 'next/server';

import { assertAdminRole } from '@/lib/admin-auth';
import {
  buildAdminAnalyticsSavedViewRoutePlan,
  savedViewRouteGateStateFromEnv,
  type AdminAnalyticsSavedViewRouteAction
} from '@/lib/analytics/admin-analytics-saved-view-route-plan';

export const dynamic = 'force-dynamic';

const ACTION_BY_SEGMENT: Record<string, AdminAnalyticsSavedViewRouteAction> = {
  create: 'create-view',
  update: 'update-view',
  remove: 'remove-view',
  'record-owner-approval': 'record-owner-approval'
};

export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  try {
    const params = await context.params;
    const action = ACTION_BY_SEGMENT[params.action];
    if (!action) return NextResponse.json({ ok: false, error: 'Unknown saved-view action.' }, { status: 404 });
    const identity = await assertAdminRole('owner');
    const plan = buildAdminAnalyticsSavedViewRoutePlan({
      action,
      actorRole: identity.role,
      payload: await request.formData(),
      gateState: savedViewRouteGateStateFromEnv()
    });
    return NextResponse.json({ ok: plan.ok, savedView: plan }, { status: plan.ok ? 202 : 409 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Owner admin session required.' }, { status: 403 });
  }
}
