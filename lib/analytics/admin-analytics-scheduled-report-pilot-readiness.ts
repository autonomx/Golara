import {
  buildScheduledReportHistoryView,
  type AdminAnalyticsScheduledReportHistoryRecord
} from './admin-analytics-scheduled-report-history-view';
import {
  buildScheduledReportOutboxChannelResult,
  type AdminAnalyticsScheduledReportOutboxChannelOptions
} from './admin-analytics-scheduled-report-outbox-channel';
import {
  buildScheduledReportStagingSmokeHarness,
  type AdminAnalyticsScheduledReportStagingSmokeEvidence
} from './admin-analytics-scheduled-report-staging-smoke';
import type { ScheduledReportRuntimeFlagState } from './admin-analytics-scheduled-report-runtime-flags';
import type { AdminAnalyticsScheduledReportTransportPayload } from './admin-analytics-scheduled-report-transport';

export type AdminAnalyticsScheduledReportPilotReadinessResult = {
  status: 'pilot_blocked' | 'pilot_ready';
  ownerOnly: true;
  singleReportOnly: true;
  liveActionStarted: false;
  automaticRunRegistered: false;
  retryLoopStarted: false;
  blockers: string[];
  reportId: string;
  historySummary: {
    failedCount: number;
    completedCount: number;
    latestAttemptAt: string | null;
  };
};

export function buildScheduledReportPilotReadiness(options: {
  isOwner: boolean;
  reportId: string | null | undefined;
  payload: AdminAnalyticsScheduledReportTransportPayload;
  evidence?: Partial<AdminAnalyticsScheduledReportStagingSmokeEvidence>;
  flags?: Partial<ScheduledReportRuntimeFlagState>;
  outbox: AdminAnalyticsScheduledReportOutboxChannelOptions;
  history?: AdminAnalyticsScheduledReportHistoryRecord[];
  maxRecipientCount?: number;
}): AdminAnalyticsScheduledReportPilotReadinessResult {
  const blockers: string[] = [];
  if (!options.isOwner) blockers.push('owner session is required');
  if (!options.reportId || options.reportId !== options.payload.reportId) blockers.push('one matching report id is required');
  if (options.payload.recipientCount > (options.maxRecipientCount ?? 1)) blockers.push('pilot recipient count must stay within the configured limit');

  const smoke = buildScheduledReportStagingSmokeHarness({
    evidence: options.evidence,
    flags: options.flags,
    ownerOutbox: {
      destinationKey: options.outbox.destinationKey,
      sourceLabel: options.outbox.channelKey,
      credentialRef: options.outbox.credentialRef,
      runtimeEnabled: options.outbox.runtimeEnabled
    }
  });
  if (smoke.status !== 'staging_smoke_ready') blockers.push(...smoke.blockers.map((blocker) => `smoke: ${blocker}`));

  const channel = buildScheduledReportOutboxChannelResult({ payload: options.payload, channel: options.outbox });
  if (channel.status !== 'outbox_channel_ready') blockers.push(...channel.blockers.map((blocker) => `channel: ${blocker}`));

  const history = buildScheduledReportHistoryView({ isOwner: options.isOwner, records: options.history });
  const matchingFailures = history.records.filter(
    (record) => record.reportId === options.payload.reportId && record.status === 'failed'
  );
  if (matchingFailures.length > 0) blockers.push('pilot history contains unresolved failure records');

  return {
    status: blockers.length === 0 ? 'pilot_ready' : 'pilot_blocked',
    ownerOnly: true,
    singleReportOnly: true,
    liveActionStarted: false,
    automaticRunRegistered: false,
    retryLoopStarted: false,
    blockers,
    reportId: options.payload.reportId,
    historySummary: {
      failedCount: matchingFailures.length,
      completedCount: history.records.filter(
        (record) => record.reportId === options.payload.reportId && record.status === 'completed'
      ).length,
      latestAttemptAt: history.records.find((record) => record.reportId === options.payload.reportId)?.attemptedAt ?? null
    }
  };
}
