import {
  buildAdminAnalyticsScheduledReportRecordingRepositoryDecision,
  createGatedAdminAnalyticsScheduledReportRecordingRepositoryFactory,
  type AdminAnalyticsScheduledReportRecordingDelegate,
  type AdminAnalyticsScheduledReportRecordingRepositoryGateState
} from './admin-analytics-scheduled-report-recording-repository';
import type { AdminAnalyticsScheduledReportRecordingTarget } from './admin-analytics-scheduled-report-recording-readiness';

export type AdminAnalyticsScheduledReportRecordingEndpointStatus =
  | 'recording_endpoint_owner_only_runtime_gated'
  | 'recording_endpoint_blocked'
  | 'recording_endpoint_recorded';

export type AdminAnalyticsScheduledReportRecordingEndpointFlagName =
  | 'ADMIN_ANALYTICS_SCHEDULED_REPORT_RECORDING_ENDPOINTS_ENABLED'
  | 'ADMIN_ANALYTICS_SCHEDULED_REPORT_GENERATED_CLIENT_RUNTIME_ACCESS_ENABLED'
  | 'ADMIN_ANALYTICS_SCHEDULED_REPORT_REPOSITORY_WRITES_ENABLED'
  | 'ADMIN_ANALYTICS_SCHEDULED_REPORT_DRY_RUN_EVIDENCE_RECORDING_ENABLED'
  | 'ADMIN_ANALYTICS_SCHEDULED_REPORT_OWNER_APPROVAL_RECORDING_ENABLED'
  | 'ADMIN_ANALYTICS_SCHEDULED_REPORT_GLOBAL_DISABLE_STATE_RECORDING_ENABLED'
  | 'ADMIN_ANALYTICS_SCHEDULED_REPORT_GLOBAL_KILL_SWITCH_VALIDATED'
  | 'ADMIN_ANALYTICS_SCHEDULED_REPORT_OWNER_APPROVAL_POLICY_VALIDATED';

export type AdminAnalyticsScheduledReportRecordingEndpointEnv = Readonly<Record<string, string | undefined>>;

export type AdminAnalyticsScheduledReportRecordingEndpointPreview = {
  status: AdminAnalyticsScheduledReportRecordingEndpointStatus;
  ownerOnly: true;
  ownerAuthorized: boolean;
  endpointsAvailable: true;
  runtimeEnabled: boolean;
  dryRunEvidence: ReturnType<typeof buildAdminAnalyticsScheduledReportRecordingRepositoryDecision>;
  ownerApproval: ReturnType<typeof buildAdminAnalyticsScheduledReportRecordingRepositoryDecision>;
  globalDisableState: ReturnType<typeof buildAdminAnalyticsScheduledReportRecordingRepositoryDecision>;
  blockers: string[];
};

export type AdminAnalyticsScheduledReportRecordingEndpointResult = {
  ok: boolean;
  status: AdminAnalyticsScheduledReportRecordingEndpointStatus;
  target: AdminAnalyticsScheduledReportRecordingTarget;
  httpStatus: 200 | 400 | 403 | 423;
  blockers: string[];
  recordedId: string | null;
};

const TARGET_FLAG: Record<AdminAnalyticsScheduledReportRecordingTarget, AdminAnalyticsScheduledReportRecordingEndpointFlagName> = {
  'dry-run-evidence': 'ADMIN_ANALYTICS_SCHEDULED_REPORT_DRY_RUN_EVIDENCE_RECORDING_ENABLED',
  'owner-approval': 'ADMIN_ANALYTICS_SCHEDULED_REPORT_OWNER_APPROVAL_RECORDING_ENABLED',
  'global-disable-state': 'ADMIN_ANALYTICS_SCHEDULED_REPORT_GLOBAL_DISABLE_STATE_RECORDING_ENABLED'
};

function flagEnabled(env: AdminAnalyticsScheduledReportRecordingEndpointEnv, name: AdminAnalyticsScheduledReportRecordingEndpointFlagName) {
  return env[name] === 'true';
}

function objectValue(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function idValue(payload: Record<string, unknown>): string | null {
  return typeof payload.id === 'string' && payload.id.trim().length > 0 ? payload.id : null;
}

export function buildScheduledReportRecordingEndpointGateState(
  env: AdminAnalyticsScheduledReportRecordingEndpointEnv = process.env
): AdminAnalyticsScheduledReportRecordingRepositoryGateState {
  return {
    generatedClientRuntimeAccessEnabled: flagEnabled(
      env,
      'ADMIN_ANALYTICS_SCHEDULED_REPORT_GENERATED_CLIENT_RUNTIME_ACCESS_ENABLED'
    ),
    repositoryWritesEnabled: flagEnabled(env, 'ADMIN_ANALYTICS_SCHEDULED_REPORT_REPOSITORY_WRITES_ENABLED'),
    dryRunEvidenceRecordingEnabled: flagEnabled(env, 'ADMIN_ANALYTICS_SCHEDULED_REPORT_DRY_RUN_EVIDENCE_RECORDING_ENABLED'),
    ownerApprovalRecordingEnabled: flagEnabled(env, 'ADMIN_ANALYTICS_SCHEDULED_REPORT_OWNER_APPROVAL_RECORDING_ENABLED'),
    globalDisableStateRecordingEnabled: flagEnabled(
      env,
      'ADMIN_ANALYTICS_SCHEDULED_REPORT_GLOBAL_DISABLE_STATE_RECORDING_ENABLED'
    ),
    globalKillSwitchValidated: flagEnabled(env, 'ADMIN_ANALYTICS_SCHEDULED_REPORT_GLOBAL_KILL_SWITCH_VALIDATED'),
    ownerApprovalPolicyValidated: flagEnabled(env, 'ADMIN_ANALYTICS_SCHEDULED_REPORT_OWNER_APPROVAL_POLICY_VALIDATED'),
    deliveryExecutionEnabled: false,
    writeEndpointEnabled: false,
    managementUiEnabled: false,
    schedulerEnabled: false
  };
}

export function isScheduledReportRecordingEndpointRuntimeEnabledFor(
  target: AdminAnalyticsScheduledReportRecordingTarget,
  env: AdminAnalyticsScheduledReportRecordingEndpointEnv = process.env
) {
  return (
    flagEnabled(env, 'ADMIN_ANALYTICS_SCHEDULED_REPORT_RECORDING_ENDPOINTS_ENABLED') &&
    flagEnabled(env, 'ADMIN_ANALYTICS_SCHEDULED_REPORT_GENERATED_CLIENT_RUNTIME_ACCESS_ENABLED') &&
    flagEnabled(env, 'ADMIN_ANALYTICS_SCHEDULED_REPORT_REPOSITORY_WRITES_ENABLED') &&
    flagEnabled(env, 'ADMIN_ANALYTICS_SCHEDULED_REPORT_GLOBAL_KILL_SWITCH_VALIDATED') &&
    flagEnabled(env, 'ADMIN_ANALYTICS_SCHEDULED_REPORT_OWNER_APPROVAL_POLICY_VALIDATED') &&
    flagEnabled(env, TARGET_FLAG[target])
  );
}

export function shouldAttachScheduledReportRecordingDelegate(
  target: AdminAnalyticsScheduledReportRecordingTarget,
  env: AdminAnalyticsScheduledReportRecordingEndpointEnv = process.env
) {
  const gateState = buildScheduledReportRecordingEndpointGateState(env);
  const decision = buildAdminAnalyticsScheduledReportRecordingRepositoryDecision(target, gateState);
  return isScheduledReportRecordingEndpointRuntimeEnabledFor(target, env) && decision.canRecord;
}

export function loadScheduledReportRecordingEndpointPreview(options: {
  isOwner: boolean;
  env?: AdminAnalyticsScheduledReportRecordingEndpointEnv;
}): AdminAnalyticsScheduledReportRecordingEndpointPreview {
  const env = options.env ?? process.env;
  const gateState = buildScheduledReportRecordingEndpointGateState(env);
  const runtimeEnabled = flagEnabled(env, 'ADMIN_ANALYTICS_SCHEDULED_REPORT_RECORDING_ENDPOINTS_ENABLED');
  const dryRunEvidence = buildAdminAnalyticsScheduledReportRecordingRepositoryDecision('dry-run-evidence', gateState);
  const ownerApproval = buildAdminAnalyticsScheduledReportRecordingRepositoryDecision('owner-approval', gateState);
  const globalDisableState = buildAdminAnalyticsScheduledReportRecordingRepositoryDecision('global-disable-state', gateState);
  const ownerBlockers = options.isOwner ? [] : ['owner admin role required'];

  return {
    status: runtimeEnabled ? 'recording_endpoint_owner_only_runtime_gated' : 'recording_endpoint_blocked',
    ownerOnly: true,
    ownerAuthorized: options.isOwner,
    endpointsAvailable: true,
    runtimeEnabled,
    dryRunEvidence,
    ownerApproval,
    globalDisableState,
    blockers: [...ownerBlockers, ...dryRunEvidence.blockers, ...ownerApproval.blockers, ...globalDisableState.blockers]
  };
}

export async function recordScheduledReportEndpointRequest(options: {
  target: AdminAnalyticsScheduledReportRecordingTarget;
  isOwner: boolean;
  payload: unknown;
  delegate: AdminAnalyticsScheduledReportRecordingDelegate | null;
  env?: AdminAnalyticsScheduledReportRecordingEndpointEnv;
  now?: Date;
}): Promise<AdminAnalyticsScheduledReportRecordingEndpointResult> {
  const env = options.env ?? process.env;
  const gateState = buildScheduledReportRecordingEndpointGateState(env);
  const decision = buildAdminAnalyticsScheduledReportRecordingRepositoryDecision(options.target, gateState);
  const payload = objectValue(options.payload);
  const id = payload ? idValue(payload) : null;

  if (!options.isOwner) {
    return {
      ok: false,
      status: 'recording_endpoint_blocked',
      target: options.target,
      httpStatus: 403,
      blockers: ['owner admin role required'],
      recordedId: null
    };
  }

  if (!isScheduledReportRecordingEndpointRuntimeEnabledFor(options.target, env) || !decision.canRecord) {
    return {
      ok: false,
      status: 'recording_endpoint_blocked',
      target: options.target,
      httpStatus: 423,
      blockers: decision.blockers,
      recordedId: null
    };
  }

  if (!payload || !id) {
    return {
      ok: false,
      status: 'recording_endpoint_blocked',
      target: options.target,
      httpStatus: 400,
      blockers: ['scheduled-report id required'],
      recordedId: null
    };
  }

  const repository = createGatedAdminAnalyticsScheduledReportRecordingRepositoryFactory(options.delegate, gateState).createRepository(
    options.target
  );
  if (!repository) {
    return {
      ok: false,
      status: 'recording_endpoint_blocked',
      target: options.target,
      httpStatus: 423,
      blockers: ['recording repository delegate not attached'],
      recordedId: null
    };
  }

  if (options.target === 'dry-run-evidence') {
    const evidence = objectValue(payload.evidence);
    if (!evidence) {
      return {
        ok: false,
        status: 'recording_endpoint_blocked',
        target: options.target,
        httpStatus: 400,
        blockers: ['dry-run evidence payload required'],
        recordedId: null
      };
    }
    await repository.recordDryRunEvidence(id, evidence, options.now ?? new Date());
  }

  if (options.target === 'owner-approval') {
    const approval = objectValue(payload.approval);
    if (!approval) {
      return {
        ok: false,
        status: 'recording_endpoint_blocked',
        target: options.target,
        httpStatus: 400,
        blockers: ['owner approval payload required'],
        recordedId: null
      };
    }
    await repository.recordOwnerApproval(id, approval);
  }

  if (options.target === 'global-disable-state') {
    const disableState = objectValue(payload.disableState);
    if (!disableState) {
      return {
        ok: false,
        status: 'recording_endpoint_blocked',
        target: options.target,
        httpStatus: 400,
        blockers: ['global disable state payload required'],
        recordedId: null
      };
    }
    await repository.recordGlobalDisableState(id, disableState);
  }

  return {
    ok: true,
    status: 'recording_endpoint_recorded',
    target: options.target,
    httpStatus: 200,
    blockers: [],
    recordedId: id
  };
}
