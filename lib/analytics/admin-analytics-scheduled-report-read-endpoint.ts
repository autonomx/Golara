import {
  buildAdminAnalyticsScheduledReportRuntimeReadGateDecision,
  createGatedAdminAnalyticsScheduledReportPrismaReaderFactory,
  readAdminAnalyticsScheduledReportsFromGatedRepository,
  type AdminAnalyticsScheduledReportGeneratedClientReadDelegate,
  type AdminAnalyticsScheduledReportRepositoryPreview,
  type AdminAnalyticsScheduledReportRuntimeReadGateDecision,
  type AdminAnalyticsScheduledReportRuntimeReadGateState
} from './admin-analytics-scheduled-report-repository';

export type AdminAnalyticsScheduledReportReadEndpointStatus = 'read_endpoint_owner_only_runtime_gated';

export type AdminAnalyticsScheduledReportReadEndpointFlagName =
  | 'ADMIN_ANALYTICS_SCHEDULED_REPORT_READ_ENDPOINT_ENABLED'
  | 'ADMIN_ANALYTICS_SCHEDULED_REPORT_READER_FACTORY_RUNTIME_ENABLED'
  | 'ADMIN_ANALYTICS_SCHEDULED_REPORT_GENERATED_CLIENT_RUNTIME_ACCESS_ENABLED'
  | 'ADMIN_ANALYTICS_SCHEDULED_REPORT_REPOSITORY_READS_ENABLED'
  | 'ADMIN_ANALYTICS_SCHEDULED_REPORT_GLOBAL_KILL_SWITCH_VALIDATED'
  | 'ADMIN_ANALYTICS_SCHEDULED_REPORT_OWNER_APPROVAL_POLICY_VALIDATED'
  | 'ADMIN_ANALYTICS_SCHEDULED_REPORT_DRY_RUN_EVIDENCE_VALIDATED';

export type AdminAnalyticsScheduledReportReadEndpointEnv = Partial<Record<AdminAnalyticsScheduledReportReadEndpointFlagName, string>>;

export type AdminAnalyticsScheduledReportReadEndpointModel = {
  status: AdminAnalyticsScheduledReportReadEndpointStatus;
  routePath: '/admin/analytics/scheduled-reports/read';
  pagePath: '/admin/analytics/scheduled-reports';
  ownerOnly: true;
  ownerAuthorized: boolean;
  readEndpointAvailable: boolean;
  readEndpointRuntimeEnabled: boolean;
  repositoryReadGate: AdminAnalyticsScheduledReportRuntimeReadGateDecision;
  preview: AdminAnalyticsScheduledReportRepositoryPreview;
  rows: AdminAnalyticsScheduledReportRepositoryPreview['rows'];
  omittedRowCount: number;
  blockers: string[];
};

const REQUIRED_RUNTIME_FLAGS: AdminAnalyticsScheduledReportReadEndpointFlagName[] = [
  'ADMIN_ANALYTICS_SCHEDULED_REPORT_READ_ENDPOINT_ENABLED',
  'ADMIN_ANALYTICS_SCHEDULED_REPORT_READER_FACTORY_RUNTIME_ENABLED',
  'ADMIN_ANALYTICS_SCHEDULED_REPORT_GENERATED_CLIENT_RUNTIME_ACCESS_ENABLED',
  'ADMIN_ANALYTICS_SCHEDULED_REPORT_REPOSITORY_READS_ENABLED',
  'ADMIN_ANALYTICS_SCHEDULED_REPORT_GLOBAL_KILL_SWITCH_VALIDATED',
  'ADMIN_ANALYTICS_SCHEDULED_REPORT_OWNER_APPROVAL_POLICY_VALIDATED',
  'ADMIN_ANALYTICS_SCHEDULED_REPORT_DRY_RUN_EVIDENCE_VALIDATED'
];

function flagEnabled(env: AdminAnalyticsScheduledReportReadEndpointEnv, name: AdminAnalyticsScheduledReportReadEndpointFlagName) {
  return env[name] === 'true';
}

export function buildScheduledReportReadEndpointRuntimeState(
  env: AdminAnalyticsScheduledReportReadEndpointEnv = process.env
): AdminAnalyticsScheduledReportRuntimeReadGateState {
  return {
    readerFactoryRuntimeEnabled: flagEnabled(env, 'ADMIN_ANALYTICS_SCHEDULED_REPORT_READER_FACTORY_RUNTIME_ENABLED'),
    generatedClientRuntimeAccessEnabled: flagEnabled(
      env,
      'ADMIN_ANALYTICS_SCHEDULED_REPORT_GENERATED_CLIENT_RUNTIME_ACCESS_ENABLED'
    ),
    repositoryReadsEnabled: flagEnabled(env, 'ADMIN_ANALYTICS_SCHEDULED_REPORT_REPOSITORY_READS_ENABLED'),
    repositoryWritesEnabled: false,
    globalKillSwitchValidated: flagEnabled(env, 'ADMIN_ANALYTICS_SCHEDULED_REPORT_GLOBAL_KILL_SWITCH_VALIDATED'),
    ownerApprovalPolicyValidated: flagEnabled(env, 'ADMIN_ANALYTICS_SCHEDULED_REPORT_OWNER_APPROVAL_POLICY_VALIDATED'),
    dryRunEvidenceValidated: flagEnabled(env, 'ADMIN_ANALYTICS_SCHEDULED_REPORT_DRY_RUN_EVIDENCE_VALIDATED'),
    deliveryExecutionEnabled: false,
    readEndpointEnabled: false,
    managementUiEnabled: false,
    schedulerEnabled: false
  };
}

export function isScheduledReportReadEndpointRuntimeEnabled(
  env: AdminAnalyticsScheduledReportReadEndpointEnv = process.env
) {
  return REQUIRED_RUNTIME_FLAGS.every((name) => flagEnabled(env, name));
}

export function shouldAttachScheduledReportReadDelegate(env: AdminAnalyticsScheduledReportReadEndpointEnv = process.env) {
  return isScheduledReportReadEndpointRuntimeEnabled(env);
}

export async function loadScheduledReportReadEndpointPreview(options: {
  isOwner: boolean;
  env?: AdminAnalyticsScheduledReportReadEndpointEnv;
  delegate?: AdminAnalyticsScheduledReportGeneratedClientReadDelegate | null;
  maxRows?: number;
}): Promise<AdminAnalyticsScheduledReportReadEndpointModel> {
  const env = options.env ?? process.env;
  const readEndpointRuntimeEnabled = flagEnabled(env, 'ADMIN_ANALYTICS_SCHEDULED_REPORT_READ_ENDPOINT_ENABLED');
  const runtimeState = buildScheduledReportReadEndpointRuntimeState(env);
  const decision = buildAdminAnalyticsScheduledReportRuntimeReadGateDecision(runtimeState, options.maxRows ?? 25);
  const delegate = options.isOwner && isScheduledReportReadEndpointRuntimeEnabled(env) ? options.delegate ?? null : null;
  const factory = createGatedAdminAnalyticsScheduledReportPrismaReaderFactory(delegate, runtimeState, options.maxRows ?? 25);
  const preview = await readAdminAnalyticsScheduledReportsFromGatedRepository(factory);
  const ownerBlockers = options.isOwner ? [] : ['owner admin role required'];

  return {
    status: 'read_endpoint_owner_only_runtime_gated',
    routePath: '/admin/analytics/scheduled-reports/read',
    pagePath: '/admin/analytics/scheduled-reports',
    ownerOnly: true,
    ownerAuthorized: options.isOwner,
    readEndpointAvailable: true,
    readEndpointRuntimeEnabled,
    repositoryReadGate: decision,
    preview,
    rows: preview.rows,
    omittedRowCount: preview.omittedRowCount,
    blockers: [...ownerBlockers, ...decision.blockers]
  };
}
