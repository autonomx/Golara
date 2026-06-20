import {
  buildAdminAnalyticsSavedViewReadModelPreview,
  type AdminAnalyticsSavedViewReadDto,
  type AdminAnalyticsSavedViewReadRow
} from './admin-analytics-saved-view-read-model';

export type AdminAnalyticsSavedViewReadEndpointStatus = 'saved_view_read_endpoint_runtime_gated';

export type AdminAnalyticsSavedViewReadEndpointEnv = Readonly<Record<string, string | undefined>>;

export type AdminAnalyticsSavedViewReadDelegateArgs = {
  where: {
    ownerApproved: boolean;
    isActive: boolean;
    audience?: 'owner' | 'staff';
  };
  orderBy: Array<{ viewKey: 'asc' } | { label: 'asc' }>;
  take: number;
};

export type AdminAnalyticsSavedViewGeneratedClientReadDelegate = {
  findMany(args: AdminAnalyticsSavedViewReadDelegateArgs): Promise<AdminAnalyticsSavedViewReadRow[]>;
};

export type AdminAnalyticsSavedViewReadEndpointRuntimeState = {
  readEndpointRuntimeEnabled: boolean;
  readerFactoryRuntimeEnabled: boolean;
  generatedClientRuntimeAccessEnabled: boolean;
  repositoryReadsEnabled: boolean;
  rolePolicyEnforced: boolean;
};

export type AdminAnalyticsSavedViewReadEndpointModel = {
  status: AdminAnalyticsSavedViewReadEndpointStatus;
  routePath: '/admin/analytics/saved-views/read';
  ownerOnlyWrites: true;
  actorRole: 'owner' | 'staff' | 'public';
  readEndpointAvailable: boolean;
  readEndpointRuntimeEnabled: boolean;
  repositoryReadsEnabled: boolean;
  metadataOnly: true;
  rows: AdminAnalyticsSavedViewReadDto[];
  omittedRowCount: number;
  blockers: string[];
};

export type AdminAnalyticsSavedViewReadEndpointFlagName =
  | 'ADMIN_ANALYTICS_SAVED_VIEW_READ_ENDPOINT_ENABLED'
  | 'ADMIN_ANALYTICS_SAVED_VIEW_READER_FACTORY_RUNTIME_ENABLED'
  | 'ADMIN_ANALYTICS_SAVED_VIEW_GENERATED_CLIENT_RUNTIME_ACCESS_ENABLED'
  | 'ADMIN_ANALYTICS_SAVED_VIEW_REPOSITORY_READS_ENABLED'
  | 'ADMIN_ANALYTICS_SAVED_VIEW_ROLE_POLICY_ENFORCED';

const REQUIRED_FLAGS: AdminAnalyticsSavedViewReadEndpointFlagName[] = [
  'ADMIN_ANALYTICS_SAVED_VIEW_READ_ENDPOINT_ENABLED',
  'ADMIN_ANALYTICS_SAVED_VIEW_READER_FACTORY_RUNTIME_ENABLED',
  'ADMIN_ANALYTICS_SAVED_VIEW_GENERATED_CLIENT_RUNTIME_ACCESS_ENABLED',
  'ADMIN_ANALYTICS_SAVED_VIEW_REPOSITORY_READS_ENABLED',
  'ADMIN_ANALYTICS_SAVED_VIEW_ROLE_POLICY_ENFORCED'
];

function flagEnabled(env: AdminAnalyticsSavedViewReadEndpointEnv, name: AdminAnalyticsSavedViewReadEndpointFlagName) {
  return env[name] === 'true';
}

export function buildAdminAnalyticsSavedViewReadEndpointRuntimeState(
  env: AdminAnalyticsSavedViewReadEndpointEnv = process.env
): AdminAnalyticsSavedViewReadEndpointRuntimeState {
  return {
    readEndpointRuntimeEnabled: flagEnabled(env, 'ADMIN_ANALYTICS_SAVED_VIEW_READ_ENDPOINT_ENABLED'),
    readerFactoryRuntimeEnabled: flagEnabled(env, 'ADMIN_ANALYTICS_SAVED_VIEW_READER_FACTORY_RUNTIME_ENABLED'),
    generatedClientRuntimeAccessEnabled: flagEnabled(env, 'ADMIN_ANALYTICS_SAVED_VIEW_GENERATED_CLIENT_RUNTIME_ACCESS_ENABLED'),
    repositoryReadsEnabled: flagEnabled(env, 'ADMIN_ANALYTICS_SAVED_VIEW_REPOSITORY_READS_ENABLED'),
    rolePolicyEnforced: flagEnabled(env, 'ADMIN_ANALYTICS_SAVED_VIEW_ROLE_POLICY_ENFORCED')
  };
}

export function isAdminAnalyticsSavedViewReadEndpointRuntimeEnabled(
  env: AdminAnalyticsSavedViewReadEndpointEnv = process.env
) {
  return REQUIRED_FLAGS.every((name) => flagEnabled(env, name));
}

export function shouldAttachAdminAnalyticsSavedViewReadDelegate(env: AdminAnalyticsSavedViewReadEndpointEnv = process.env) {
  return isAdminAnalyticsSavedViewReadEndpointRuntimeEnabled(env);
}

function buildBlockers(state: AdminAnalyticsSavedViewReadEndpointRuntimeState, actorRole: 'owner' | 'staff' | 'public') {
  const blockers: string[] = [];
  if (actorRole === 'public') blockers.push('admin role required for saved-view reads');
  if (!state.readEndpointRuntimeEnabled) blockers.push('saved-view read endpoint runtime disabled');
  if (!state.readerFactoryRuntimeEnabled) blockers.push('saved-view reader factory runtime disabled');
  if (!state.generatedClientRuntimeAccessEnabled) blockers.push('saved-view generated client runtime access disabled');
  if (!state.repositoryReadsEnabled) blockers.push('saved-view repository reads disabled');
  if (!state.rolePolicyEnforced) blockers.push('saved-view role policy not enforced');
  return blockers;
}

export async function loadAdminAnalyticsSavedViewReadEndpointModel(options: {
  actorRole: 'owner' | 'staff' | 'public';
  env?: AdminAnalyticsSavedViewReadEndpointEnv;
  delegate?: AdminAnalyticsSavedViewGeneratedClientReadDelegate | null;
  maxRows?: number;
}): Promise<AdminAnalyticsSavedViewReadEndpointModel> {
  const env = options.env ?? process.env;
  const state = buildAdminAnalyticsSavedViewReadEndpointRuntimeState(env);
  const maxRows = Math.min(Math.max(options.maxRows ?? 25, 0), 25);
  const blockers = buildBlockers(state, options.actorRole);
  const canRead = blockers.length === 0;
  const delegate = canRead ? options.delegate ?? null : null;
  const where = {
    ownerApproved: true,
    isActive: true,
    ...(options.actorRole === 'staff' ? { audience: 'staff' as const } : {})
  };
  const rows = delegate
    ? await delegate.findMany({
        where,
        orderBy: [{ viewKey: 'asc' }, { label: 'asc' }],
        take: maxRows
      })
    : [];
  const preview = buildAdminAnalyticsSavedViewReadModelPreview(rows, maxRows);

  return {
    status: 'saved_view_read_endpoint_runtime_gated',
    routePath: '/admin/analytics/saved-views/read',
    ownerOnlyWrites: true,
    actorRole: options.actorRole,
    readEndpointAvailable: true,
    readEndpointRuntimeEnabled: state.readEndpointRuntimeEnabled,
    repositoryReadsEnabled: state.repositoryReadsEnabled,
    metadataOnly: true,
    rows: preview.rows,
    omittedRowCount: preview.omittedRowCount,
    blockers
  };
}
