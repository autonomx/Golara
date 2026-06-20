export type AdminAnalyticsScheduledReportTransportAsset = {
  filename: string;
  contentType: 'text/csv';
  byteLength: number;
  rowCount: number;
};

export type AdminAnalyticsScheduledReportTransportPayload = {
  reportId: string;
  reportKey: string;
  label: string;
  generatedAt: string;
  assets: AdminAnalyticsScheduledReportTransportAsset[];
  recipientCount: number;
};

export type AdminAnalyticsScheduledReportTransportResult = {
  status: 'transport_disabled' | 'transport_dispatched';
  sent: boolean;
  provider: 'disabled' | 'test' | 'owner-outbox';
  payloadSummary: {
    reportId: string;
    assetCount: number;
    recipientCount: number;
  };
  blockers: string[];
};

export type AdminAnalyticsScheduledReportTransportAdapter = {
  name: string;
  configured: boolean;
  liveNetworkEnabled: boolean;
  dispatch: (payload: AdminAnalyticsScheduledReportTransportPayload) => Promise<AdminAnalyticsScheduledReportTransportResult>;
};

export type AdminAnalyticsScheduledReportTransportContract = {
  status: 'transport_contract_disabled';
  enabled: false;
  configured: false;
  liveNetworkEnabled: false;
  emailProviderConfigured: false;
  defaultAdapter: 'disabled';
  allowedAssetContentTypes: ['text/csv'];
  blockedCapabilities: string[];
};

export type AdminAnalyticsScheduledReportOwnerOutboxOptions = {
  destinationKey: string | null | undefined;
  sourceLabel: string | null | undefined;
  credentialRef: string | null | undefined;
  runtimeEnabled?: boolean;
};

export type AdminAnalyticsScheduledReportOwnerOutboxValidation = {
  status: 'owner_outbox_valid' | 'owner_outbox_invalid';
  configured: boolean;
  runtimeEnabled: boolean;
  blockers: string[];
};

export function buildScheduledReportTransportContract(): AdminAnalyticsScheduledReportTransportContract {
  return {
    status: 'transport_contract_disabled',
    enabled: false,
    configured: false,
    liveNetworkEnabled: false,
    emailProviderConfigured: false,
    defaultAdapter: 'disabled',
    allowedAssetContentTypes: ['text/csv'],
    blockedCapabilities: [
      'live email provider configuration',
      'network delivery',
      'recipient expansion',
      'retry execution',
      'scheduler registration'
    ]
  };
}

function payloadSummary(payload: AdminAnalyticsScheduledReportTransportPayload) {
  return {
    reportId: payload.reportId,
    assetCount: payload.assets.length,
    recipientCount: payload.recipientCount
  };
}

function hasValue(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateScheduledReportOwnerOutbox(
  options: AdminAnalyticsScheduledReportOwnerOutboxOptions
): AdminAnalyticsScheduledReportOwnerOutboxValidation {
  const blockers: string[] = [];
  if (!hasValue(options.destinationKey)) blockers.push('owner destination key is required');
  if (!hasValue(options.sourceLabel)) blockers.push('source label is required');
  if (!hasValue(options.credentialRef)) blockers.push('credential reference is required');
  if (!options.runtimeEnabled) blockers.push('owner outbox runtime flag is disabled');
  const configurationBlockers = blockers.filter((blocker) => blocker !== 'owner outbox runtime flag is disabled');

  return {
    status: blockers.length === 0 ? 'owner_outbox_valid' : 'owner_outbox_invalid',
    configured: configurationBlockers.length === 0,
    runtimeEnabled: options.runtimeEnabled === true,
    blockers
  };
}

export function createDisabledScheduledReportTransportAdapter(): AdminAnalyticsScheduledReportTransportAdapter {
  return {
    name: 'disabled-scheduled-report-transport',
    configured: false,
    liveNetworkEnabled: false,
    dispatch: async (payload) => ({
      status: 'transport_disabled',
      sent: false,
      provider: 'disabled',
      payloadSummary: payloadSummary(payload),
      blockers: [
        'scheduled report transport adapter is disabled',
        'live network delivery is not configured',
        'recipient expansion is not enabled'
      ]
    })
  };
}

export function createOwnerOutboxScheduledReportTransportAdapter(
  options: AdminAnalyticsScheduledReportOwnerOutboxOptions
): AdminAnalyticsScheduledReportTransportAdapter {
  const validation = validateScheduledReportOwnerOutbox(options);
  return {
    name: 'owner-outbox-scheduled-report-transport',
    configured: validation.configured,
    liveNetworkEnabled: validation.status === 'owner_outbox_valid',
    dispatch: async (payload) => ({
      status: validation.status === 'owner_outbox_valid' ? 'transport_dispatched' : 'transport_disabled',
      sent: validation.status === 'owner_outbox_valid',
      provider: 'owner-outbox',
      payloadSummary: payloadSummary(payload),
      blockers: validation.blockers
    })
  };
}

export function createTestScheduledReportTransportAdapter(): AdminAnalyticsScheduledReportTransportAdapter {
  return {
    name: 'test-scheduled-report-transport',
    configured: true,
    liveNetworkEnabled: false,
    dispatch: async (payload) => ({
      status: 'transport_dispatched',
      sent: true,
      provider: 'test',
      payloadSummary: payloadSummary(payload),
      blockers: []
    })
  };
}
