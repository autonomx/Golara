import type { AdminAnalyticsScheduledReportTransportPayload } from './admin-analytics-scheduled-report-transport';

export type AdminAnalyticsScheduledReportOutboxChannelOptions = {
  channelKey: string | null | undefined;
  destinationKey: string | null | undefined;
  credentialRef: string | null | undefined;
  payloadSigningRef: string | null | undefined;
  runtimeEnabled?: boolean;
  operatorApproved?: boolean;
};

export type AdminAnalyticsScheduledReportOutboxChannelResult = {
  status: 'outbox_channel_blocked' | 'outbox_channel_ready';
  configured: boolean;
  runtimeEnabled: boolean;
  operatorApproved: boolean;
  directClientUsed: false;
  payloadSummary: {
    reportId: string;
    assetCount: number;
    recipientCount: number;
  };
  blockers: string[];
};

function hasValue(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function buildScheduledReportOutboxChannelResult(options: {
  payload: AdminAnalyticsScheduledReportTransportPayload;
  channel: AdminAnalyticsScheduledReportOutboxChannelOptions;
}): AdminAnalyticsScheduledReportOutboxChannelResult {
  const blockers: string[] = [];
  if (!hasValue(options.channel.channelKey)) blockers.push('channel key is required');
  if (!hasValue(options.channel.destinationKey)) blockers.push('destination key is required');
  if (!hasValue(options.channel.credentialRef)) blockers.push('credential reference is required');
  if (!hasValue(options.channel.payloadSigningRef)) blockers.push('payload signing reference is required');
  if (!options.channel.runtimeEnabled) blockers.push('channel runtime flag is disabled');
  if (!options.channel.operatorApproved) blockers.push('operator approval is required');

  const configurationBlockers = blockers.filter(
    (blocker) => blocker !== 'channel runtime flag is disabled' && blocker !== 'operator approval is required'
  );

  return {
    status: blockers.length === 0 ? 'outbox_channel_ready' : 'outbox_channel_blocked',
    configured: configurationBlockers.length === 0,
    runtimeEnabled: options.channel.runtimeEnabled === true,
    operatorApproved: options.channel.operatorApproved === true,
    directClientUsed: false,
    payloadSummary: {
      reportId: options.payload.reportId,
      assetCount: options.payload.assets.length,
      recipientCount: options.payload.recipientCount
    },
    blockers
  };
}
