import {
  buildScheduledReportRuntimeFlagMatrix,
  type ScheduledReportRuntimeFlagState
} from './admin-analytics-scheduled-report-runtime-flags';

export type AdminAnalyticsScheduledReportSchedulerRegistrationPlan = {
  status: 'registration_blocked' | 'registration_ready';
  registered: false;
  clockRegistered: false;
  queuedRunRegistered: false;
  ownerOnly: true;
  blockers: string[];
};

export type AdminAnalyticsScheduledReportSchedulerRegistrationRequest = {
  lockKey: string;
  maxConcurrentRuns: 1;
  staleLockTimeoutMinutes: number;
  maxRunsPerHour: number;
};

export type AdminAnalyticsScheduledReportSchedulerRegistrar = (
  request: AdminAnalyticsScheduledReportSchedulerRegistrationRequest
) => Promise<{ registrationId?: string | null }>;

export type AdminAnalyticsScheduledReportSchedulerRegistrationResult = {
  status: 'scheduler_registration_blocked' | 'scheduler_registered';
  registered: boolean;
  clockRegistered: boolean;
  queuedRunRegistered: boolean;
  ownerOnly: true;
  automaticWorkerExecutionEnabled: false;
  registrationId?: string;
  blockers: string[];
};

function hasValue(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function buildScheduledReportSchedulerRegistrationPlan(options: {
  flags?: Partial<ScheduledReportRuntimeFlagState>;
} = {}): AdminAnalyticsScheduledReportSchedulerRegistrationPlan {
  const matrix = buildScheduledReportRuntimeFlagMatrix({ flags: options.flags });
  const blockers: string[] = [];
  if (matrix.unsafeCombinationDetected) blockers.push(...matrix.blockers);
  if (!options.flags?.workerEvaluation) blockers.push('worker evaluation flag is disabled');
  if (!options.flags?.scheduleRuntime) blockers.push('schedule runtime flag is disabled');
  if (!options.flags?.clockRegistration) blockers.push('clock registration flag is disabled');
  if (!options.flags?.queuedRunRegistration) blockers.push('queued run registration flag is disabled');
  if (options.flags?.sendExecution) blockers.push('send execution must stay separate from scheduler registration');
  if (options.flags?.retryRun) blockers.push('retry run must stay separate from scheduler registration');

  return {
    status: blockers.length === 0 ? 'registration_ready' : 'registration_blocked',
    registered: false,
    clockRegistered: false,
    queuedRunRegistered: false,
    ownerOnly: true,
    blockers
  };
}

export async function registerScheduledReportScheduler(options: {
  isOwner: boolean;
  operatorApproved?: boolean;
  flags?: Partial<ScheduledReportRuntimeFlagState>;
  lockKey: string | null | undefined;
  staleLockTimeoutMinutes: number;
  maxRunsPerHour: number;
  registrar?: AdminAnalyticsScheduledReportSchedulerRegistrar | null;
}): Promise<AdminAnalyticsScheduledReportSchedulerRegistrationResult> {
  const plan = buildScheduledReportSchedulerRegistrationPlan({ flags: options.flags });
  const blockers = [...plan.blockers];
  const lockKey = hasValue(options.lockKey) ? options.lockKey.trim() : null;
  if (!options.isOwner) blockers.push('owner session is required');
  if (!options.operatorApproved) blockers.push('operator approval is required');
  if (lockKey === null) blockers.push('lock key is required');
  if (options.staleLockTimeoutMinutes < 5) blockers.push('stale lock timeout must be at least five minutes');
  if (options.maxRunsPerHour < 1 || options.maxRunsPerHour > 4) blockers.push('max runs per hour must be between one and four');
  if (options.registrar === null || options.registrar === undefined) blockers.push('scheduler registrar is not configured');

  if (blockers.length > 0 || options.registrar === null || options.registrar === undefined || lockKey === null) {
    return {
      status: 'scheduler_registration_blocked',
      registered: false,
      clockRegistered: false,
      queuedRunRegistered: false,
      ownerOnly: true,
      automaticWorkerExecutionEnabled: false,
      blockers
    };
  }

  const result = await options.registrar({
    lockKey,
    maxConcurrentRuns: 1,
    staleLockTimeoutMinutes: options.staleLockTimeoutMinutes,
    maxRunsPerHour: options.maxRunsPerHour
  });

  return {
    status: 'scheduler_registered',
    registered: true,
    clockRegistered: true,
    queuedRunRegistered: true,
    ownerOnly: true,
    automaticWorkerExecutionEnabled: false,
    registrationId: result.registrationId ?? undefined,
    blockers: []
  };
}
