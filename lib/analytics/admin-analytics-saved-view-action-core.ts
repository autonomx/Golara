import {
  applyAdminAnalyticsSavedViewStorage,
  type AdminAnalyticsSavedViewStorageApplyResult,
  type AdminAnalyticsSavedViewStorageDelegate
} from './admin-analytics-saved-view-storage-apply';
import {
  buildAdminAnalyticsSavedViewRouteInput,
  buildAdminAnalyticsSavedViewRoutePlan,
  type AdminAnalyticsSavedViewRouteAction,
  type AdminAnalyticsSavedViewRoutePlan
} from './admin-analytics-saved-view-route-plan';
import type { AdminAnalyticsSavedViewAdapterGateState } from './admin-analytics-saved-view-adapter-plan';
import type { AdminAnalyticsSavedViewActorRole } from './admin-analytics-saved-view-mutation-policy';

export type AdminAnalyticsSavedViewActionCoreResult = {
  ok: boolean;
  status: 202 | 409;
  mode: 'plan-only' | 'storage-applied';
  plan: AdminAnalyticsSavedViewRoutePlan;
  storage: AdminAnalyticsSavedViewStorageApplyResult | null;
};

export async function runAdminAnalyticsSavedViewActionCore(options: {
  action: AdminAnalyticsSavedViewRouteAction;
  actorRole: AdminAnalyticsSavedViewActorRole;
  payload: FormData | Record<string, unknown>;
  gateState?: Partial<AdminAnalyticsSavedViewAdapterGateState>;
  delegate?: AdminAnalyticsSavedViewStorageDelegate | null;
}): Promise<AdminAnalyticsSavedViewActionCoreResult> {
  const plan = buildAdminAnalyticsSavedViewRoutePlan(options);
  const delegate = options.delegate ?? null;

  if (delegate === null) {
    return {
      ok: plan.ok,
      status: plan.ok ? 202 : 409,
      mode: 'plan-only',
      plan,
      storage: null
    };
  }

  const storage = await applyAdminAnalyticsSavedViewStorage({
    input: buildAdminAnalyticsSavedViewRouteInput(options),
    gateState: options.gateState,
    delegate
  });

  return {
    ok: storage.accepted && storage.stored,
    status: storage.accepted && storage.stored ? 202 : 409,
    mode: storage.accepted && storage.stored ? 'storage-applied' : 'plan-only',
    plan,
    storage
  };
}
