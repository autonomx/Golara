import {
  buildScheduledReportSchedulePlanPreview,
  type AdminAnalyticsScheduledReportSchedulePlanRow
} from './admin-analytics-scheduled-report-schedule-plan';

export type AdminAnalyticsScheduledReportWorkerGateState = {
  workerRuntimeEnabled: boolean;
  schedulerRuntimeEnabled: boolean;
  timerRegistrationEnabled: boolean;
  backgroundJobRegistrationEnabled: boolean;
  deliveryExecutionEnabled: boolean;
  deliveryTransportConfigured: boolean;
  ownerApprovalRequired: boolean;
  dryRunEvidenceRequired: boolean;
};

export type AdminAnalyticsScheduledReportWorkerCandidate = AdminAnalyticsScheduledReportSchedulePlanRow & {
  nextRunAt?: Date | string | null;
};

export type AdminAnalyticsScheduledReportWorkerDecision = {
  id: string;
  label: string;
  status: 'locked' | 'skipped' | 'due_for_manual_processing';
  nextRunAt: string | null;
  blockers: string[];
};

export type AdminAnalyticsScheduledReportWorkerShellResult = {
  status: 'worker_shell_disabled' | 'worker_shell_gated_preview';
  ownerOnly: true;
  workerRuntimeEnabled: boolean;
  schedulerRuntimeEnabled: boolean;
  timerRegistrationEnabled: boolean;
  backgroundJobRegistrationEnabled: boolean;
  deliveryExecutionEnabled: false;
  deliveryTransportConfigured: false;
  automaticRegistrationEnabled: false;
  evaluatedAt: string;
  evaluatedCount: number;
  dueCount: number;
  decisions: AdminAnalyticsScheduledReportWorkerDecision[];
  blockers: string[];
};

const DEFAULT_GATE_STATE: AdminAnalyticsScheduledReportWorkerGateState = {
  workerRuntimeEnabled: false,
  schedulerRuntimeEnabled: false,
  timerRegistrationEnabled: false,
  backgroundJobRegistrationEnabled: false,
  deliveryExecutionEnabled: false,
  deliveryTransportConfigured: false,
  ownerApprovalRequired: true,
  dryRunEvidenceRequired: true
};

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function defaultBlockers(state: AdminAnalyticsScheduledReportWorkerGateState): string[] {
  const blockers: string[] = [];
  if (!state.workerRuntimeEnabled) blockers.push('worker runtime flag is disabled');
  if (!state.schedulerRuntimeEnabled) blockers.push('scheduler runtime flag is disabled');
  if (!state.timerRegistrationEnabled) blockers.push('timer registration is disabled');
  if (!state.backgroundJobRegistrationEnabled) blockers.push('background job registration is disabled');
  if (state.deliveryExecutionEnabled) blockers.push('delivery execution must remain disabled in the worker shell');
  if (state.deliveryTransportConfigured) blockers.push('delivery transport must remain unconfigured in the worker shell');
  return blockers;
}

function candidateBlockers(candidate: AdminAnalyticsScheduledReportWorkerCandidate): string[] {
  const blockers: string[] = [];
  if (!candidate.isActive) blockers.push('scheduled report is not active');
  if (!candidate.ownerApproved) blockers.push('owner approval evidence not recorded');
  if (candidate.hasDryRunEvidence !== true) blockers.push('dry-run evidence not recorded');
  if (candidate.deliveryEnabled) blockers.push('delivery must remain disabled before worker processing');
  return blockers;
}

export function evaluateScheduledReportWorkerShell(options: {
  candidates: AdminAnalyticsScheduledReportWorkerCandidate[];
  state?: Partial<AdminAnalyticsScheduledReportWorkerGateState>;
  now?: Date;
}): AdminAnalyticsScheduledReportWorkerShellResult {
  const state = { ...DEFAULT_GATE_STATE, ...options.state };
  const now = options.now ?? new Date();
  const shellBlockers = defaultBlockers(state);
  const plan = buildScheduledReportSchedulePlanPreview({ isOwner: true, rows: options.candidates, now });
  const decisions = plan.items.map((item) => {
    const candidate = options.candidates.find((row) => row.id === item.id);
    const nextRunAt = toDate(candidate?.nextRunAt) ?? toDate(item.nextRunAt);
    const blockers = [...shellBlockers, ...(candidate ? candidateBlockers(candidate) : ['candidate row not found'])];
    const due = nextRunAt !== null && nextRunAt.getTime() <= now.getTime() && blockers.length === 0;
    return {
      id: item.id,
      label: item.label,
      status: due ? 'due_for_manual_processing' as const : blockers.length > 0 ? 'locked' as const : 'skipped' as const,
      nextRunAt: nextRunAt?.toISOString() ?? null,
      blockers
    };
  });
  const dueCount = decisions.filter((decision) => decision.status === 'due_for_manual_processing').length;

  return {
    status: shellBlockers.length === 0 ? 'worker_shell_gated_preview' : 'worker_shell_disabled',
    ownerOnly: true,
    workerRuntimeEnabled: state.workerRuntimeEnabled,
    schedulerRuntimeEnabled: state.schedulerRuntimeEnabled,
    timerRegistrationEnabled: state.timerRegistrationEnabled,
    backgroundJobRegistrationEnabled: state.backgroundJobRegistrationEnabled,
    deliveryExecutionEnabled: false,
    deliveryTransportConfigured: false,
    automaticRegistrationEnabled: false,
    evaluatedAt: now.toISOString(),
    evaluatedCount: decisions.length,
    dueCount,
    decisions,
    blockers: shellBlockers
  };
}

export function createDisabledScheduledReportWorkerShell() {
  return {
    enabled: false,
    evaluate: (options: { candidates?: AdminAnalyticsScheduledReportWorkerCandidate[]; now?: Date } = {}) => evaluateScheduledReportWorkerShell({
      candidates: options.candidates ?? [],
      now: options.now
    })
  };
}
