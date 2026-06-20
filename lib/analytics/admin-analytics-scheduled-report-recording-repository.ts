import type { AdminAnalyticsScheduledReport as PrismaAdminAnalyticsScheduledReport } from '@prisma/client';
import type { AdminAnalyticsScheduledReportRecordingTarget } from './admin-analytics-scheduled-report-recording-readiness';

export type AdminAnalyticsScheduledReportRecordingRepositoryStatus = 'recording_repository_runtime_gated';

export type AdminAnalyticsScheduledReportRecordingRepositoryGateState = {
  generatedClientRuntimeAccessEnabled: boolean;
  repositoryWritesEnabled: boolean;
  dryRunEvidenceRecordingEnabled: boolean;
  ownerApprovalRecordingEnabled: boolean;
  globalDisableStateRecordingEnabled: boolean;
  globalKillSwitchValidated: boolean;
  ownerApprovalPolicyValidated: boolean;
  deliveryExecutionEnabled: boolean;
  writeEndpointEnabled: boolean;
  managementUiEnabled: boolean;
  schedulerEnabled: boolean;
};

export type AdminAnalyticsScheduledReportRecordingRepositoryDecision = {
  status: AdminAnalyticsScheduledReportRecordingRepositoryStatus;
  target: AdminAnalyticsScheduledReportRecordingTarget;
  enabled: boolean;
  canRecord: boolean;
  state: AdminAnalyticsScheduledReportRecordingRepositoryGateState;
  blockers: string[];
};

export type AdminAnalyticsScheduledReportRecordingUpdateArgs = {
  where: { id: string };
  data: Record<string, unknown>;
  select: {
    id: true;
    reportKey: true;
    ownerApproved: true;
    isActive: true;
    deliveryEnabled: true;
    lastDryRunAt: true;
    lastDryRunSummary: true;
    metadata: true;
    updatedAt: true;
  };
};

export type AdminAnalyticsScheduledReportRecordingDelegate = {
  update: (args: AdminAnalyticsScheduledReportRecordingUpdateArgs) => Promise<PrismaAdminAnalyticsScheduledReport>;
};

export type AdminAnalyticsScheduledReportRecordingRepository = {
  recordDryRunEvidence: (
    id: string,
    evidence: Record<string, unknown>,
    recordedAt: Date
  ) => Promise<PrismaAdminAnalyticsScheduledReport>;
  recordOwnerApproval: (
    id: string,
    approval: Record<string, unknown>
  ) => Promise<PrismaAdminAnalyticsScheduledReport>;
  recordGlobalDisableState: (
    id: string,
    state: Record<string, unknown>
  ) => Promise<PrismaAdminAnalyticsScheduledReport>;
};

export type AdminAnalyticsScheduledReportGatedRecordingRepositoryFactory = {
  decisionFor: (target: AdminAnalyticsScheduledReportRecordingTarget) => AdminAnalyticsScheduledReportRecordingRepositoryDecision;
  createRepository: (target: AdminAnalyticsScheduledReportRecordingTarget) => AdminAnalyticsScheduledReportRecordingRepository | null;
};

const DEFAULT_RECORDING_GATE_STATE: AdminAnalyticsScheduledReportRecordingRepositoryGateState = {
  generatedClientRuntimeAccessEnabled: false,
  repositoryWritesEnabled: false,
  dryRunEvidenceRecordingEnabled: false,
  ownerApprovalRecordingEnabled: false,
  globalDisableStateRecordingEnabled: false,
  globalKillSwitchValidated: false,
  ownerApprovalPolicyValidated: false,
  deliveryExecutionEnabled: false,
  writeEndpointEnabled: false,
  managementUiEnabled: false,
  schedulerEnabled: false
};

const RECORDING_SELECT = {
  id: true,
  reportKey: true,
  ownerApproved: true,
  isActive: true,
  deliveryEnabled: true,
  lastDryRunAt: true,
  lastDryRunSummary: true,
  metadata: true,
  updatedAt: true
} as const;

function blockersForTarget(
  target: AdminAnalyticsScheduledReportRecordingTarget,
  state: AdminAnalyticsScheduledReportRecordingRepositoryGateState
): string[] {
  const blockers: string[] = [];
  if (!state.generatedClientRuntimeAccessEnabled) blockers.push('generated Prisma client runtime access not enabled');
  if (!state.repositoryWritesEnabled) blockers.push('repository writes not enabled');
  if (!state.globalKillSwitchValidated) blockers.push('global disable control not validated');
  if (!state.ownerApprovalPolicyValidated) blockers.push('owner approval policy not validated');
  if (state.deliveryExecutionEnabled) blockers.push('delivery execution must remain disabled');
  if (state.writeEndpointEnabled) blockers.push('write endpoint must remain disabled');
  if (state.managementUiEnabled) blockers.push('management UI must remain disabled');
  if (state.schedulerEnabled) blockers.push('scheduler must remain disabled');
  if (target === 'dry-run-evidence' && !state.dryRunEvidenceRecordingEnabled) {
    blockers.push('dry-run evidence recording not enabled');
  }
  if (target === 'owner-approval' && !state.ownerApprovalRecordingEnabled) {
    blockers.push('owner approval recording not enabled');
  }
  if (target === 'global-disable-state' && !state.globalDisableStateRecordingEnabled) {
    blockers.push('global disable state recording not enabled');
  }
  return blockers;
}

export function buildAdminAnalyticsScheduledReportRecordingRepositoryDecision(
  target: AdminAnalyticsScheduledReportRecordingTarget,
  state: Partial<AdminAnalyticsScheduledReportRecordingRepositoryGateState> = {}
): AdminAnalyticsScheduledReportRecordingRepositoryDecision {
  const resolvedState = { ...DEFAULT_RECORDING_GATE_STATE, ...state };
  const blockers = blockersForTarget(target, resolvedState);
  const canRecord = blockers.length === 0;
  return {
    status: 'recording_repository_runtime_gated',
    target,
    enabled: canRecord,
    canRecord,
    state: resolvedState,
    blockers
  };
}

function dryRunEvidenceArgs(
  id: string,
  evidence: Record<string, unknown>,
  recordedAt: Date
): AdminAnalyticsScheduledReportRecordingUpdateArgs {
  return {
    where: { id },
    data: {
      lastDryRunAt: recordedAt,
      lastDryRunSummary: evidence
    },
    select: RECORDING_SELECT
  };
}

function ownerApprovalArgs(
  id: string,
  approval: Record<string, unknown>
): AdminAnalyticsScheduledReportRecordingUpdateArgs {
  return {
    where: { id },
    data: {
      ownerApproved: true,
      metadata: approval
    },
    select: RECORDING_SELECT
  };
}

function globalDisableStateArgs(
  id: string,
  state: Record<string, unknown>
): AdminAnalyticsScheduledReportRecordingUpdateArgs {
  return {
    where: { id },
    data: {
      isActive: false,
      deliveryEnabled: false,
      metadata: state
    },
    select: RECORDING_SELECT
  };
}

export function createGatedAdminAnalyticsScheduledReportRecordingRepositoryFactory(
  delegate: AdminAnalyticsScheduledReportRecordingDelegate | null,
  state: Partial<AdminAnalyticsScheduledReportRecordingRepositoryGateState> = {}
): AdminAnalyticsScheduledReportGatedRecordingRepositoryFactory {
  return {
    decisionFor: (target) => buildAdminAnalyticsScheduledReportRecordingRepositoryDecision(target, state),
    createRepository: (target) => {
      const decision = buildAdminAnalyticsScheduledReportRecordingRepositoryDecision(target, state);
      if (!decision.canRecord || delegate === null) return null;
      return {
        recordDryRunEvidence: (id, evidence, recordedAt) => delegate.update(dryRunEvidenceArgs(id, evidence, recordedAt)),
        recordOwnerApproval: (id, approval) => delegate.update(ownerApprovalArgs(id, approval)),
        recordGlobalDisableState: (id, disableState) => delegate.update(globalDisableStateArgs(id, disableState))
      };
    }
  };
}
