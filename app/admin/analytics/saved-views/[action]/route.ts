import { NextResponse } from 'next/server';

import { assertAdminRole } from '@/lib/admin-auth';
import { runAdminAnalyticsSavedViewActionCore } from '@/lib/analytics/admin-analytics-saved-view-action-core';
import { buildAdminAnalyticsSavedViewPreferredStorageDelegate } from '@/lib/analytics/admin-analytics-saved-view-generated-client-delegate';
import {
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
    const delegateAttachment = buildAdminAnalyticsSavedViewPreferredStorageDelegate();
    const result = await runAdminAnalyticsSavedViewActionCore({
      action,
      actorRole: identity.role,
      payload: await request.formData(),
      gateState: savedViewRouteGateStateFromEnv(),
      delegate: delegateAttachment.delegate
    });
    return NextResponse.json(
      {
        ok: result.ok,
        savedView: result.plan,
        storage: result.storage,
        delegate: delegateAttachment.state
      },
      { status: result.status }
    );
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Owner admin session required.' }, { status: 403 });
  }
}
