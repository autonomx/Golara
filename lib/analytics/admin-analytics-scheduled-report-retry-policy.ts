export type AdminAnalyticsScheduledReportDeliveryFailureStatus = 'failed' | 'delivered' | 'blocked' | 'cancelled';

export type AdminAnalyticsScheduledReportFailureRecordForRetry = {
  reportId: string;
  label: string;
  status: AdminAnalyticsScheduledReportDeliveryFailureStatus;
  failedAt: Date | string;
  attemptCount: number;
  lastReason: string;
};

export type AdminAnalyticsScheduledReportRetryPlanItem = {
  reportId: string;
  label: string;
  status: 'retry_eligible' | 'retry_locked' | 'not_failed';
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt: string | null;
  ownerVisible: true;
  blockers: string[];
};

export type AdminAnalyticsScheduledReportRetryPlan = {
  status: 'retry_plan_only';
  ownerOnly: true;
  retryExecutionEnabled: false;
  automaticLoopEnabled: false;
  maxAttempts: number;
  generatedAt: string;
  eligibleCount: number;
  items: AdminAnalyticsScheduledReportRetryPlanItem[];
};

export const SCHEDULED_REPORT_RETRY_MAX_ATTEMPTS = 3;
const RETRY_BACKOFF_MINUTES = [15, 60, 240] as const;

function toDate(value: Date | string): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return new Date(0);
  return date;
}

function nextRetryTimestamp(failedAt: Date | string, attemptCount: number): string {
  const failedDate = toDate(failedAt);
  const backoffMinutes = RETRY_BACKOFF_MINUTES[Math.min(attemptCount, RETRY_BACKOFF_MINUTES.length - 1)];
  return new Date(failedDate.getTime() + backoffMinutes * 60 * 1000).toISOString();
}

function retryBlockers(record: AdminAnalyticsScheduledReportFailureRecordForRetry, maxAttempts: number): string[] {
  const blockers: string[] = [];
  if (record.status !== 'failed') blockers.push('delivery record is not failed');
  if (record.attemptCount >= maxAttempts) blockers.push('retry attempt cap reached');
  if (!record.lastReason) blockers.push('failure reason is required before retry planning');
  return blockers;
}

export function buildScheduledReportRetryPlan(options: {
  failures: AdminAnalyticsScheduledReportFailureRecordForRetry[];
  now?: Date;
  maxAttempts?: number;
}): AdminAnalyticsScheduledReportRetryPlan {
  const maxAttempts = options.maxAttempts ?? SCHEDULED_REPORT_RETRY_MAX_ATTEMPTS;
  const items = options.failures.map((failure) => {
    const blockers = retryBlockers(failure, maxAttempts);
    const isFailed = failure.status === 'failed';
    const retryEligible = isFailed && blockers.length === 0;
    return {
      reportId: failure.reportId,
      label: failure.label,
      status: retryEligible ? 'retry_eligible' as const : isFailed ? 'retry_locked' as const : 'not_failed' as const,
      attemptCount: failure.attemptCount,
      maxAttempts,
      nextRetryAt: retryEligible ? nextRetryTimestamp(failure.failedAt, failure.attemptCount) : null,
      ownerVisible: true,
      blockers
    };
  });

  return {
    status: 'retry_plan_only',
    ownerOnly: true,
    retryExecutionEnabled: false,
    automaticLoopEnabled: false,
    maxAttempts,
    generatedAt: (options.now ?? new Date()).toISOString(),
    eligibleCount: items.filter((item) => item.status === 'retry_eligible').length,
    items
  };
}
