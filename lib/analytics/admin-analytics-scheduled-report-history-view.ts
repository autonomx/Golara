export type AdminAnalyticsScheduledReportHistoryRecord = {
  id: string;
  reportId: string;
  reportLabel: string;
  attemptedAt: string;
  status: 'blocked' | 'prepared' | 'completed' | 'failed';
  mode: 'preview' | 'owner_run' | 'retry_plan';
  assetCount: number;
  recipientCount: number;
  blockers: string[];
};

export type AdminAnalyticsScheduledReportHistoryView = {
  ownerOnly: true;
  readonly: true;
  repositoryWritesEnabled: false;
  liveActionEnabled: false;
  totalRecords: number;
  completedCount: number;
  failedCount: number;
  blockedCount: number;
  latestAttemptAt: string | null;
  records: AdminAnalyticsScheduledReportHistoryRecord[];
};

function compareByAttemptDesc(a: AdminAnalyticsScheduledReportHistoryRecord, b: AdminAnalyticsScheduledReportHistoryRecord) {
  return b.attemptedAt.localeCompare(a.attemptedAt);
}

export function buildScheduledReportHistoryView(options: {
  isOwner: boolean;
  records?: AdminAnalyticsScheduledReportHistoryRecord[];
}): AdminAnalyticsScheduledReportHistoryView {
  const records = options.isOwner ? [...(options.records ?? [])].sort(compareByAttemptDesc) : [];

  return {
    ownerOnly: true,
    readonly: true,
    repositoryWritesEnabled: false,
    liveActionEnabled: false,
    totalRecords: records.length,
    completedCount: records.filter((record) => record.status === 'completed').length,
    failedCount: records.filter((record) => record.status === 'failed').length,
    blockedCount: records.filter((record) => record.status === 'blocked').length,
    latestAttemptAt: records[0]?.attemptedAt ?? null,
    records
  };
}
