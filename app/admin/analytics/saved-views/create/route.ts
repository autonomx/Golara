import { NextResponse } from 'next/server';

import { assertAdminRole } from '@/lib/admin-auth';
import { runAdminAnalyticsSavedViewActionCore } from '@/lib/analytics/admin-analytics-saved-view-action-core';
import { savedViewRouteGateStateFromEnv } from '@/lib/analytics/admin-analytics-saved-view-route-plan';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const identity = await assertAdminRole('owner');
    const result = await runAdminAnalyticsSavedViewActionCore({
      action: 'create-view',
      actorRole: identity.role,
      payload: await request.formData(),
      gateState: savedViewRouteGateStateFromEnv()
    });
    return NextResponse.json({ ok: result.ok, savedView: result.plan, storage: result.storage }, { status: result.status });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Owner admin session required for saved-view create.' }, { status: 403 });
  }
}
