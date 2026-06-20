import { buildScheduledReportSchedulerRegistrationPlan } from './admin-analytics-scheduled-report-scheduler-registration';
import type { ScheduledReportRuntimeFlagState } from './admin-analytics-scheduled-report-runtime-flags';

export type AdminAnalyticsScheduledReportClockActivationPolicy = {
  operatorApproved?: boolean;
  lockKey: string | null | undefined;
  maxConcurrentRuns: number;
  staleLockTimeoutMinutes: number;
  maxRunsPerHour: number;
};

export type AdminAnalyticsScheduledReportClockActivationResult = {
  status: 'clock_activation_blocked' | 'clock_activation_ready';
  ownerOnly: true;
  timerCreated: false;
  backgroundLoopStarted: false;
  queuedRunCreated: false;
  lockRequired: true;
  concurrencyLimit: number;
  blockers: string[];
};

function hasValue(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function buildScheduledReportClockActivationReadiness(options: {
  isOwner: boolean;
  flags?: Partial<ScheduledReportRuntimeFlagState>;
  policy: AdminAnalyticsScheduledReportClockActivationPolicy;
}): AdminAnalyticsScheduledReportClockActivationResult {
  const blockers: string[] = [];
  if (!options.isOwner) blockers.push('owner session is required');
  if (!options.policy.operatorApproved) blockers.push('operator approval is required');
  if (!hasValue(options.policy.lockKey)) blockers.push('lock key is required');
  if (options.policy.maxConcurrentRuns !== 1) blockers.push('max concurrent runs must be exactly one');
  if (options.policy.staleLockTimeoutMinutes < 5) blockers.push('stale lock timeout must be at least five minutes');
  if (options.policy.maxRunsPerHour < 1 || options.policy.maxRunsPerHour > 4) blockers.push('max runs per hour must be between one and four');

  const plan = buildScheduledReportSchedulerRegistrationPlan({ flags: options.flags });
  if (plan.status !== 'registration_ready') blockers.push(...plan.blockers.map((blocker) => `clock plan: ${blocker}`));

  return {
    status: blockers.length === 0 ? 'clock_activation_ready' : 'clock_activation_blocked',
    ownerOnly: true,
    timerCreated: false,
    backgroundLoopStarted: false,
    queuedRunCreated: false,
    lockRequired: true,
    concurrencyLimit: options.policy.maxConcurrentRuns,
    blockers
  };
}
