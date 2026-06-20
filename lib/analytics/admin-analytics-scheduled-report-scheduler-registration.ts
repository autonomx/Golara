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
