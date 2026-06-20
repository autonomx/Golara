export type AdminAnalyticsScheduledReportOpsPlanOptions = {
  isOwner: boolean;
  lockKey: string | null | undefined;
  maxConcurrentRuns: number;
  staleLockTimeoutMinutes: number;
  alertChannelKey: string | null | undefined;
  escalationOwner: string | null | undefined;
  rollbackDocPath: string | null | undefined;
  operatorApproved?: boolean;
};

export type AdminAnalyticsScheduledReportOpsPlan = {
  status: 'ops_plan_blocked' | 'ops_plan_ready';
  ownerOnly: true;
  lockRequired: true;
  liveAlertSent: false;
  backgroundLoopStarted: false;
  schedulerTimerCreated: false;
  maxConcurrentRuns: number;
  staleLockTimeoutMinutes: number;
  blockers: string[];
  checklist: string[];
};

function hasValue(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function buildScheduledReportOpsPlan(options: AdminAnalyticsScheduledReportOpsPlanOptions): AdminAnalyticsScheduledReportOpsPlan {
  const blockers: string[] = [];
  if (!options.isOwner) blockers.push('owner session is required');
  if (!options.operatorApproved) blockers.push('operator approval is required');
  if (!hasValue(options.lockKey)) blockers.push('lock key is required');
  if (options.maxConcurrentRuns !== 1) blockers.push('max concurrent runs must be exactly one');
  if (options.staleLockTimeoutMinutes < 5) blockers.push('stale lock timeout must be at least five minutes');
  if (!hasValue(options.alertChannelKey)) blockers.push('alert channel key is required');
  if (!hasValue(options.escalationOwner)) blockers.push('escalation owner is required');
  if (!hasValue(options.rollbackDocPath)) blockers.push('rollback doc path is required');

  return {
    status: blockers.length === 0 ? 'ops_plan_ready' : 'ops_plan_blocked',
    ownerOnly: true,
    lockRequired: true,
    liveAlertSent: false,
    backgroundLoopStarted: false,
    schedulerTimerCreated: false,
    maxConcurrentRuns: options.maxConcurrentRuns,
    staleLockTimeoutMinutes: options.staleLockTimeoutMinutes,
    blockers,
    checklist: [
      'verify owner-only access before changing scheduled report flags',
      'confirm one-run lock before enabling schedule evaluation',
      'review latest history records before any owner run',
      'keep rollback documentation visible to operators',
      'keep live alert dispatch behind a separate adapter gate'
    ]
  };
}
