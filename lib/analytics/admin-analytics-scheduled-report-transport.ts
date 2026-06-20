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
  provider: 'disabled' | 'test';
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
