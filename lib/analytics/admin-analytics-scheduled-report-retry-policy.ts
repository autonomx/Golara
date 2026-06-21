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

export type AdminAnalyticsScheduledReportRetryExecutionItem = {
  reportId: string;
  label: string;
  attempted: boolean;
  status: 'retry_skipped' | 'retry_delivered' | 'retry_failed';
  attemptCount: number;
  nextAttemptCount: number;
  providerMessageId?: string;
  reason?: string;
  blockers: string[];
};

export type AdminAnalyticsScheduledReportRetryExecution = {
  status: 'retry_execution_blocked' | 'retry_execution_completed';
  ownerOnly: true;
  retryExecutionEnabled: boolean;
  automaticLoopEnabled: false;
  maxBatchSize: number;
  attemptedCount: number;
  deliveredCount: number;
  failedCount: number;
  blockers: string[];
  items: AdminAnalyticsScheduledReportRetryExecutionItem[];
};

export type AdminAnalyticsScheduledReportRetryRunner = (
  item: AdminAnalyticsScheduledReportRetryPlanItem
) => Promise<{ status: 'delivered' | 'failed'; providerMessageId?: string | null; reason?: string | null }>;

export const SCHEDULED_REPORT_RETRY_MAX_ATTEMPTS = 3;
export const SCHEDULED_REPORT_RETRY_MAX_BATCH_SIZE = 5;
export const ADMIN_ANALYTICS_SCHEDULED_REPORT_RETRY_EXECUTION_ENABLED_ENV =
  'ADMIN_ANALYTICS_SCHEDULED_REPORT_RETRY_EXECUTION_ENABLED';
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
  const items = options.failures.map((failure): AdminAnalyticsScheduledReportRetryPlanItem => {
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

function skippedRetryItem(item: AdminAnalyticsScheduledReportRetryPlanItem, blockers: string[]): AdminAnalyticsScheduledReportRetryExecutionItem {
  return {
    reportId: item.reportId,
    label: item.label,
    attempted: false,
    status: 'retry_skipped',
    attemptCount: item.attemptCount,
    nextAttemptCount: item.attemptCount,
    blockers
  };
}

export async function executeScheduledReportRetryBatch(options: {
  plan: AdminAnalyticsScheduledReportRetryPlan;
  retryExecutionEnabled?: boolean;
  maxBatchSize?: number;
  runner?: AdminAnalyticsScheduledReportRetryRunner | null;
}): Promise<AdminAnalyticsScheduledReportRetryExecution> {
  const maxBatchSize = Math.min(
    Math.max(0, options.maxBatchSize ?? SCHEDULED_REPORT_RETRY_MAX_BATCH_SIZE),
    SCHEDULED_REPORT_RETRY_MAX_BATCH_SIZE
  );
  const blockers: string[] = [];
  if (!options.retryExecutionEnabled) blockers.push('retry execution flag is disabled');
  if (options.runner === null || options.runner === undefined) blockers.push('retry runner is not configured');
  if (maxBatchSize < 1) blockers.push('retry batch size must be at least one');

  const eligibleItems = options.plan.items.filter((item) => item.status === 'retry_eligible').slice(0, maxBatchSize);
  const skippedItems = options.plan.items
    .filter((item) => item.status !== 'retry_eligible')
    .map((item) => skippedRetryItem(item, item.blockers.length > 0 ? item.blockers : ['delivery record is not retry eligible']));

  if (blockers.length > 0 || options.runner === null || options.runner === undefined) {
    return {
      status: 'retry_execution_blocked',
      ownerOnly: true,
      retryExecutionEnabled: options.retryExecutionEnabled === true,
      automaticLoopEnabled: false,
      maxBatchSize,
      attemptedCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      blockers,
      items: [
        ...eligibleItems.map((item) => skippedRetryItem(item, blockers)),
        ...skippedItems
      ]
    };
  }

  const runner = options.runner;
  const attemptedItems: AdminAnalyticsScheduledReportRetryExecutionItem[] = [];
  for (const item of eligibleItems) {
    const result = await runner(item);
    attemptedItems.push({
      reportId: item.reportId,
      label: item.label,
      attempted: true,
      status: result.status === 'delivered' ? 'retry_delivered' : 'retry_failed',
      attemptCount: item.attemptCount,
      nextAttemptCount: item.attemptCount + 1,
      providerMessageId: result.providerMessageId ?? undefined,
      reason: result.reason ?? undefined,
      blockers: []
    });
  }

  return {
    status: 'retry_execution_completed',
    ownerOnly: true,
    retryExecutionEnabled: true,
    automaticLoopEnabled: false,
    maxBatchSize,
    attemptedCount: attemptedItems.length,
    deliveredCount: attemptedItems.filter((item) => item.status === 'retry_delivered').length,
    failedCount: attemptedItems.filter((item) => item.status === 'retry_failed').length,
    blockers: [],
    items: [...attemptedItems, ...skippedItems]
  };
}
