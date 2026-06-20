import {
  buildAdminAnalyticsSavedViewMutationPlan,
  type AdminAnalyticsSavedViewMutationInput,
  type AdminAnalyticsSavedViewMutationPlan
} from './admin-analytics-saved-view-mutation-policy';

export type AdminAnalyticsSavedViewAdapterPlanStatus = 'saved_view_adapter_plan_runtime_gated';

export type AdminAnalyticsSavedViewAdapterGateState = {
  generatedClientRuntimeAccessEnabled: boolean;
  metadataReadsEnabled: boolean;
  metadataChangesEnabled: boolean;
  readEndpointEnabled: boolean;
  changeEndpointEnabled: boolean;
  rolePolicyEnforced: boolean;
};

export type AdminAnalyticsSavedViewAdapterDecision = {
  status: AdminAnalyticsSavedViewAdapterPlanStatus;
  purpose: 'read-metadata' | 'change-metadata';
  enabled: boolean;
  gateState: AdminAnalyticsSavedViewAdapterGateState;
  blockers: string[];
};

export type AdminAnalyticsSavedViewReadPlan = {
  where: {
    ownerApproved: true;
    isActive: true;
    audience?: 'staff';
  };
  orderBy: Array<{ viewKey: 'asc' } | { label: 'asc' }>;
  take: number;
  metadataOnly: true;
};

export type AdminAnalyticsSavedViewChangePlan = {
  operation: 'none' | 'create' | 'update' | 'deactivate' | 'record-owner-approval';
  where: { viewKey: string; scope: string } | null;
  data: NonNullable<AdminAnalyticsSavedViewMutationPlan['data']> | null;
  metadataOnly: true;
  accepted: boolean;
  blockers: string[];
};

const DEFAULT_GATE_STATE: AdminAnalyticsSavedViewAdapterGateState = {
  generatedClientRuntimeAccessEnabled: false,
  metadataReadsEnabled: false,
  metadataChangesEnabled: false,
  readEndpointEnabled: false,
  changeEndpointEnabled: false,
  rolePolicyEnforced: false
};

function blockersFor(purpose: 'read-metadata' | 'change-metadata', state: AdminAnalyticsSavedViewAdapterGateState) {
  const blockers: string[] = [];
  if (!state.generatedClientRuntimeAccessEnabled) blockers.push('saved-view generated client runtime access disabled');
  if (purpose === 'read-metadata') {
    if (!state.metadataReadsEnabled) blockers.push('saved-view metadata reads disabled');
    if (!state.readEndpointEnabled) blockers.push('saved-view read endpoint disabled');
  }
  if (purpose === 'change-metadata') {
    if (!state.metadataChangesEnabled) blockers.push('saved-view metadata changes disabled');
    if (!state.changeEndpointEnabled) blockers.push('saved-view change endpoint disabled');
  }
  if (!state.rolePolicyEnforced) blockers.push('saved-view role policy not enforced');
  return blockers;
}

export function buildAdminAnalyticsSavedViewAdapterDecision(
  purpose: 'read-metadata' | 'change-metadata',
  gateState: Partial<AdminAnalyticsSavedViewAdapterGateState> = {}
): AdminAnalyticsSavedViewAdapterDecision {
  const state = { ...DEFAULT_GATE_STATE, ...gateState };
  const blockers = blockersFor(purpose, state);
  return {
    status: 'saved_view_adapter_plan_runtime_gated',
    purpose,
    enabled: blockers.length === 0,
    gateState: state,
    blockers
  };
}

export function buildAdminAnalyticsSavedViewReadPlan(options: {
  actorRole: 'owner' | 'staff';
  maxRows?: number;
}): AdminAnalyticsSavedViewReadPlan {
  return {
    where: {
      ownerApproved: true,
      isActive: true,
      ...(options.actorRole === 'staff' ? { audience: 'staff' as const } : {})
    },
    orderBy: [{ viewKey: 'asc' }, { label: 'asc' }],
    take: Math.min(Math.max(options.maxRows ?? 25, 0), 25),
    metadataOnly: true
  };
}

export function buildAdminAnalyticsSavedViewChangePlan(options: {
  input: AdminAnalyticsSavedViewMutationInput;
  gateState?: Partial<AdminAnalyticsSavedViewAdapterGateState>;
}): AdminAnalyticsSavedViewChangePlan {
  const decision = buildAdminAnalyticsSavedViewAdapterDecision('change-metadata', options.gateState);
  const plan = buildAdminAnalyticsSavedViewMutationPlan({
    ...options.input,
    repositoryWritesEnabled: decision.gateState.metadataChangesEnabled,
    writeEndpointsEnabled: decision.gateState.changeEndpointEnabled,
    rolePolicyEnforced: decision.gateState.rolePolicyEnforced
  });
  const blockers = [...decision.blockers, ...plan.blockers];
  const accepted = decision.enabled && plan.accepted && plan.data !== null;

  return {
    operation: accepted ? plan.repositoryOperation : 'none',
    where: accepted && plan.data ? { viewKey: plan.data.viewKey, scope: plan.data.scope } : null,
    data: accepted ? plan.data : null,
    metadataOnly: true,
    accepted,
    blockers
  };
}
