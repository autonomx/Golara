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
  provider: 'disabled' | 'test' | 'owner-email';
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

export type AdminAnalyticsScheduledReportOwnerEmailTransportOptions = {
  ownerEmail: string | null | undefined;
  fromAddress: string | null | undefined;
  providerKey: string | null | undefined;
  runtimeEnabled?: boolean;
};

export type AdminAnalyticsScheduledReportOwnerEmailTransportValidation = {
  status: 'owner_email_transport_valid' | 'owner_email_transport_invalid';
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

function looksLikeEmail(value: string | null | undefined): boolean {
  return typeof value === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

export function validateScheduledReportOwnerEmailTransport(
  options: AdminAnalyticsScheduledReportOwnerEmailTransportOptions
): AdminAnalyticsScheduledReportOwnerEmailTransportValidation {
  const blockers: string[] = [];
  if (!looksLikeEmail(options.ownerEmail)) blockers.push('owner email is required');
  if (!looksLikeEmail(options.fromAddress)) blockers.push('from address is required');
  if (!options.providerKey) blockers.push('provider key reference is required');
  if (!options.runtimeEnabled) blockers.push('owner email transport runtime flag is disabled');

  return {
    status: blockers.length === 0 ? 'owner_email_transport_valid' : 'owner_email_transport_invalid',
    configured: blockers.filter((blocker) => blocker !== 'owner email transport runtime flag is disabled').length === 0,
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

export function createOwnerEmailScheduledReportTransportAdapter(
  options: AdminAnalyticsScheduledReportOwnerEmailTransportOptions
): AdminAnalyticsScheduledReportTransportAdapter {
  const validation = validateScheduledReportOwnerEmailTransport(options);
  return {
    name: 'owner-email-scheduled-report-transport',
    configured: validation.configured,
    liveNetworkEnabled: validation.status === 'owner_email_transport_valid',
    dispatch: async (payload) => ({
      status: validation.status === 'owner_email_transport_valid' ? 'transport_dispatched' : 'transport_disabled',
      sent: validation.status === 'owner_email_transport_valid',
      provider: 'owner-email',
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
