import type { AdminAnalyticsScheduledReport as PrismaAdminAnalyticsScheduledReport } from '@prisma/client';

export type AdminAnalyticsScheduledReportActivationReadinessStatus = 'activation_readiness_runtime_gated';

export type AdminAnalyticsScheduledReportActivationGateState = {
  generatedClientRuntimeAccessEnabled: boolean;
  repositoryWritesEnabled: boolean;
  activationMetadataWritesEnabled: boolean;
  globalKillSwitchPermitsActivation: boolean;
  globalDisableStateValidated: boolean;
  ownerApprovalPolicyValidated: boolean;
  deliveryExecutionEnabled: boolean;
  deliveryTransportConfigured: boolean;
  schedulerEnabled: boolean;
  timerEnabled: boolean;
  backgroundJobEnabled: boolean;
};

export type AdminAnalyticsScheduledReportActivationCandidate = {
  id: string;
  ownerApproved: boolean;
  isActive: boolean;
  deliveryEnabled: boolean;
  lastDryRunAt: Date | string | null;
  lastDryRunSummary: unknown;
  metadata: unknown;
};

export type AdminAnalyticsScheduledReportActivationMetadata = {
  activation: {
    status: 'active_metadata_recorded_delivery_disabled';
    activatedAt: string;
    activatedByRole: 'owner';
    activatedByLabel: string | null;
    dryRunEvidenceRecorded: true;
    ownerApprovalRecorded: true;
    globalKillSwitchPermitted: true;
    globalDisableStateValidated: true;
    schedulerEnabled: false;
    deliveryExecutionEnabled: false;
    deliveryEnabled: false;
  };
};

export type AdminAnalyticsScheduledReportActivationUpdateArgs = {
  where: { id: string };
  data: {
    isActive: true;
    deliveryEnabled: false;
    metadata: AdminAnalyticsScheduledReportActivationMetadata;
  };
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

export type AdminAnalyticsScheduledReportActivationDecision = {
  status: AdminAnalyticsScheduledReportActivationReadinessStatus;
  ownerOnly: true;
  visibleToOwner: boolean;
  candidateId: string | null;
  enabled: boolean;
  canActivate: boolean;
  state: AdminAnalyticsScheduledReportActivationGateState;
  schedulerEnabled: false;
  timerEnabled: false;
  backgroundJobEnabled: false;
  deliveryExecutionEnabled: false;
  deliveryEnabledAfterActivation: false;
  blockers: string[];
  requiredEvidence: string[];
  activationMetadataFields: string[];
  updateArgs: AdminAnalyticsScheduledReportActivationUpdateArgs | null;
};

export type AdminAnalyticsScheduledReportActivationDelegate = {
  update: (args: AdminAnalyticsScheduledReportActivationUpdateArgs) => Promise<PrismaAdminAnalyticsScheduledReport>;
};

export type AdminAnalyticsScheduledReportActivationRepository = {
  activateMetadataOnly: (
    candidate: AdminAnalyticsScheduledReportActivationCandidate,
    options?: AdminAnalyticsScheduledReportActivationMetadataOptions
  ) => Promise<PrismaAdminAnalyticsScheduledReport>;
};

export type AdminAnalyticsScheduledReportActivationRepositoryFactory = {
  decisionFor: (
    candidate?: AdminAnalyticsScheduledReportActivationCandidate,
    options?: AdminAnalyticsScheduledReportActivationMetadataOptions
  ) => AdminAnalyticsScheduledReportActivationDecision;
  createRepository: (candidate?: AdminAnalyticsScheduledReportActivationCandidate) => AdminAnalyticsScheduledReportActivationRepository | null;
};

export type AdminAnalyticsScheduledReportActivationMetadataOptions = {
  activatedAt?: Date;
  activatedByLabel?: string | null;
};

const DEFAULT_ACTIVATION_GATE_STATE: AdminAnalyticsScheduledReportActivationGateState = {
  generatedClientRuntimeAccessEnabled: false,
  repositoryWritesEnabled: false,
  activationMetadataWritesEnabled: false,
  globalKillSwitchPermitsActivation: false,
  globalDisableStateValidated: false,
  ownerApprovalPolicyValidated: false,
  deliveryExecutionEnabled: false,
  deliveryTransportConfigured: false,
  schedulerEnabled: false,
  timerEnabled: false,
  backgroundJobEnabled: false
};

const ACTIVATION_SELECT = {
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

const REQUIRED_EVIDENCE = [
  'owner role confirmed',
  'global kill switch permits activation',
  'global disable state validated',
  'owner approval policy validated',
  'owner approval recorded on the scheduled report row',
  'dry-run evidence timestamp recorded on the scheduled report row',
  'dry-run evidence summary recorded on the scheduled report row',
  'delivery execution remains disabled',
  'scheduler, timer, and background jobs remain disabled'
];

const ACTIVATION_METADATA_FIELDS = [
  'activation.status',
  'activation.activatedAt',
  'activation.activatedByRole',
  'activation.activatedByLabel',
  'activation.dryRunEvidenceRecorded',
  'activation.ownerApprovalRecorded',
  'activation.globalKillSwitchPermitted',
  'activation.globalDisableStateValidated',
  'activation.schedulerEnabled',
  'activation.deliveryExecutionEnabled',
  'activation.deliveryEnabled'
];

function hasRecordedDryRunSummary(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.keys(value).length > 0;
}

function activationBlockers(
  isOwner: boolean,
  state: AdminAnalyticsScheduledReportActivationGateState,
  candidate?: AdminAnalyticsScheduledReportActivationCandidate
): string[] {
  const blockers: string[] = [];
  if (!isOwner) blockers.push('owner admin role required');
  if (!state.generatedClientRuntimeAccessEnabled) blockers.push('generated Prisma client runtime access not enabled');
  if (!state.repositoryWritesEnabled) blockers.push('repository writes not enabled');
  if (!state.activationMetadataWritesEnabled) blockers.push('activation metadata writes not enabled');
  if (!state.globalKillSwitchPermitsActivation) blockers.push('global kill switch does not permit activation');
  if (!state.globalDisableStateValidated) blockers.push('global disable state not validated');
  if (!state.ownerApprovalPolicyValidated) blockers.push('owner approval policy not validated');
  if (state.deliveryExecutionEnabled) blockers.push('delivery execution must remain disabled');
  if (state.deliveryTransportConfigured) blockers.push('delivery transport must remain unconfigured');
  if (state.schedulerEnabled) blockers.push('scheduler must remain disabled');
  if (state.timerEnabled) blockers.push('timer must remain disabled');
  if (state.backgroundJobEnabled) blockers.push('background jobs must remain disabled');
  if (!candidate) {
    blockers.push('scheduled report row not selected');
    return blockers;
  }
  if (candidate.deliveryEnabled) blockers.push('scheduled report deliveryEnabled must remain false');
  if (!candidate.ownerApproved) blockers.push('owner approval evidence not recorded');
  if (candidate.lastDryRunAt === null) blockers.push('dry-run evidence timestamp not recorded');
  if (!hasRecordedDryRunSummary(candidate.lastDryRunSummary)) blockers.push('dry-run evidence summary not recorded');
  return blockers;
}

function buildActivationUpdateArgs(
  candidate: AdminAnalyticsScheduledReportActivationCandidate,
  options: AdminAnalyticsScheduledReportActivationMetadataOptions = {}
): AdminAnalyticsScheduledReportActivationUpdateArgs {
  const activatedAt = options.activatedAt ?? new Date();
  return {
    where: { id: candidate.id },
    data: {
      isActive: true,
      deliveryEnabled: false,
      metadata: {
        activation: {
          status: 'active_metadata_recorded_delivery_disabled',
          activatedAt: activatedAt.toISOString(),
          activatedByRole: 'owner',
          activatedByLabel: options.activatedByLabel ?? null,
          dryRunEvidenceRecorded: true,
          ownerApprovalRecorded: true,
          globalKillSwitchPermitted: true,
          globalDisableStateValidated: true,
          schedulerEnabled: false,
          deliveryExecutionEnabled: false,
          deliveryEnabled: false
        }
      }
    },
    select: ACTIVATION_SELECT
  };
}

export function buildAdminAnalyticsScheduledReportActivationReadinessDecision(options: {
  isOwner: boolean;
  state?: Partial<AdminAnalyticsScheduledReportActivationGateState>;
  candidate?: AdminAnalyticsScheduledReportActivationCandidate;
  metadata?: AdminAnalyticsScheduledReportActivationMetadataOptions;
}): AdminAnalyticsScheduledReportActivationDecision {
  const state = { ...DEFAULT_ACTIVATION_GATE_STATE, ...options.state };
  const blockers = activationBlockers(options.isOwner, state, options.candidate);
  const canActivate = blockers.length === 0;
  return {
    status: 'activation_readiness_runtime_gated',
    ownerOnly: true,
    visibleToOwner: options.isOwner,
    candidateId: options.candidate?.id ?? null,
    enabled: canActivate,
    canActivate,
    state,
    schedulerEnabled: false,
    timerEnabled: false,
    backgroundJobEnabled: false,
    deliveryExecutionEnabled: false,
    deliveryEnabledAfterActivation: false,
    blockers,
    requiredEvidence: [...REQUIRED_EVIDENCE],
    activationMetadataFields: [...ACTIVATION_METADATA_FIELDS],
    updateArgs: canActivate && options.candidate ? buildActivationUpdateArgs(options.candidate, options.metadata) : null
  };
}

export function buildScheduledReportActivationReadinessPreview(options: {
  isOwner: boolean;
}): AdminAnalyticsScheduledReportActivationDecision {
  return buildAdminAnalyticsScheduledReportActivationReadinessDecision({ isOwner: options.isOwner });
}

export function createGatedAdminAnalyticsScheduledReportActivationRepositoryFactory(
  delegate: AdminAnalyticsScheduledReportActivationDelegate | null,
  state: Partial<AdminAnalyticsScheduledReportActivationGateState> = {},
  isOwner = false
): AdminAnalyticsScheduledReportActivationRepositoryFactory {
  return {
    decisionFor: (candidate, metadata) => buildAdminAnalyticsScheduledReportActivationReadinessDecision({
      isOwner,
      state,
      candidate,
      metadata
    }),
    createRepository: (candidate) => {
      const decision = buildAdminAnalyticsScheduledReportActivationReadinessDecision({ isOwner, state, candidate });
      if (!decision.canActivate || delegate === null) return null;
      return {
        activateMetadataOnly: async (activationCandidate, metadata) => {
          const activationDecision = buildAdminAnalyticsScheduledReportActivationReadinessDecision({
            isOwner,
            state,
            candidate: activationCandidate,
            metadata
          });
          if (!activationDecision.updateArgs) {
            throw new Error(`Scheduled report activation is locked: ${activationDecision.blockers.join('; ')}`);
          }
          return delegate.update(activationDecision.updateArgs);
        }
      };
    }
  };
}
