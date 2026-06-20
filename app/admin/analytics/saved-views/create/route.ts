import { NextResponse } from 'next/server';

import { assertAdminRole } from '@/lib/admin-auth';
import {
  buildAdminAnalyticsSavedViewRoutePlan,
  savedViewRouteGateStateFromEnv
} from '@/lib/analytics/admin-analytics-saved-view-route-plan';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const identity = await assertAdminRole('owner');
    const plan = buildAdminAnalyticsSavedViewRoutePlan({
      action: 'create-view',
      actorRole: identity.role,
      payload: await request.formData(),
      gateState: savedViewRouteGateStateFromEnv()
    });
    return NextResponse.json({ ok: plan.ok, savedView: plan }, { status: plan.ok ? 202 : 409 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Owner admin session required for saved-view create.' }, { status: 403 });
  }
}
