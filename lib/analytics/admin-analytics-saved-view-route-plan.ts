import {
  buildAdminAnalyticsSavedViewChangePlan,
  type AdminAnalyticsSavedViewAdapterGateState
} from './admin-analytics-saved-view-adapter-plan';
import type { AdminAnalyticsSavedViewManagementActionKey } from './admin-analytics-saved-view-management';
import type {
  AdminAnalyticsSavedViewActorRole,
  AdminAnalyticsSavedViewMutationInput
} from './admin-analytics-saved-view-mutation-policy';

export type AdminAnalyticsSavedViewRouteAction = AdminAnalyticsSavedViewManagementActionKey;

export type AdminAnalyticsSavedViewRoutePlan = {
  ok: boolean;
  action: AdminAnalyticsSavedViewRouteAction;
  persisted: false;
  metadataOnly: true;
  blockers: string[];
  operation: 'none' | 'create' | 'update' | 'deactivate' | 'record-owner-approval';
  where: { viewKey: string; scope: string } | null;
  preview: {
    viewKey: string | null;
    label: string | null;
    scope: string | null;
    audience: string | null;
    ownerApproved: boolean;
    isActive: false;
  } | null;
};

const ACTION_PATHS: Record<AdminAnalyticsSavedViewRouteAction, string> = {
  'create-view': '/admin/analytics/saved-views/create',
  'update-view': '/admin/analytics/saved-views/update',
  'remove-view': '/admin/analytics/saved-views/remove',
  'record-owner-approval': '/admin/analytics/saved-views/record-owner-approval'
};

function valueFrom(payload: FormData | Record<string, unknown>, key: string): unknown {
  if (payload instanceof FormData) return payload.getAll(key).length > 1 ? payload.getAll(key) : payload.get(key);
  return payload[key];
}

function stringArrayFrom(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map((entry) => entry.trim()).filter(Boolean);
  return [];
}

export function buildAdminAnalyticsSavedViewRouteInput(options: {
  action: AdminAnalyticsSavedViewRouteAction;
  actorRole: AdminAnalyticsSavedViewActorRole;
  payload: FormData | Record<string, unknown>;
}): AdminAnalyticsSavedViewMutationInput {
  const payload = options.payload;
  return {
    action: options.action,
    actorRole: options.actorRole,
    actionPath: ACTION_PATHS[options.action],
    viewKey: valueFrom(payload, 'viewKey'),
    label: valueFrom(payload, 'label'),
    description: valueFrom(payload, 'description'),
    scope: valueFrom(payload, 'scope'),
    audience: valueFrom(payload, 'audience'),
    rangeMode: valueFrom(payload, 'rangeMode'),
    rangeQuery: valueFrom(payload, 'rangeQuery'),
    sectionAnchors: stringArrayFrom(valueFrom(payload, 'sectionAnchors')),
    ownerApprovalNote: valueFrom(payload, 'ownerApprovalNote'),
    requestedByLabel: valueFrom(payload, 'requestedByLabel')
  };
}

export function buildAdminAnalyticsSavedViewRoutePlan(options: {
  action: AdminAnalyticsSavedViewRouteAction;
  actorRole: AdminAnalyticsSavedViewActorRole;
  payload: FormData | Record<string, unknown>;
  gateState?: Partial<AdminAnalyticsSavedViewAdapterGateState>;
}): AdminAnalyticsSavedViewRoutePlan {
  const input = buildAdminAnalyticsSavedViewRouteInput(options);
  const changePlan = buildAdminAnalyticsSavedViewChangePlan({ input, gateState: options.gateState });
  const data = changePlan.data;
  return {
    ok: changePlan.accepted,
    action: options.action,
    persisted: false,
    metadataOnly: true,
    blockers: changePlan.blockers,
    operation: changePlan.operation,
    where: changePlan.where,
    preview: data
      ? {
          viewKey: data.viewKey,
          label: data.label,
          scope: data.scope,
          audience: data.audience,
          ownerApproved: data.ownerApproved,
          isActive: false
        }
      : null
  };
}

export function savedViewRouteGateStateFromEnv(env: Record<string, string | undefined> = process.env) {
  return {
    generatedClientRuntimeAccessEnabled: env.ADMIN_ANALYTICS_SAVED_VIEW_GENERATED_CLIENT_RUNTIME_ACCESS_ENABLED === 'true',
    metadataReadsEnabled: env.ADMIN_ANALYTICS_SAVED_VIEW_REPOSITORY_READS_ENABLED === 'true',
    metadataChangesEnabled: env.ADMIN_ANALYTICS_SAVED_VIEW_REPOSITORY_WRITES_ENABLED === 'true',
    readEndpointEnabled: env.ADMIN_ANALYTICS_SAVED_VIEW_READ_ENDPOINT_ENABLED === 'true',
    changeEndpointEnabled: env.ADMIN_ANALYTICS_SAVED_VIEW_WRITE_ENDPOINTS_ENABLED === 'true',
    rolePolicyEnforced: env.ADMIN_ANALYTICS_SAVED_VIEW_ROLE_POLICY_ENFORCED === 'true'
  };
}
