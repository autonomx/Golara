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

export type AdminAnalyticsScheduledReportTransportProvider = 'disabled' | 'test' | 'owner-outbox' | 'owner-provider';

export type AdminAnalyticsScheduledReportTransportResult = {
  status: 'transport_disabled' | 'transport_dispatched';
  sent: boolean;
  provider: AdminAnalyticsScheduledReportTransportProvider;
  payloadSummary: {
    reportId: string;
    assetCount: number;
    recipientCount: number;
  };
  blockers: string[];
  providerMessageId?: string;
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

export type AdminAnalyticsScheduledReportProviderDispatchOptions = AdminAnalyticsScheduledReportOwnerOutboxOptions & {
  providerKey: string | null | undefined;
  signingRef?: string | null | undefined;
};

export type AdminAnalyticsScheduledReportProviderDispatchContext = {
  destinationKey: string;
  sourceLabel: string;
  credentialRef: string;
  providerKey: string;
  signingRef: string | null;
};

export type AdminAnalyticsScheduledReportProviderDispatch = (
  payload: AdminAnalyticsScheduledReportTransportPayload,
  context: AdminAnalyticsScheduledReportProviderDispatchContext
) => Promise<{ providerMessageId?: string | null }>;

export const ADMIN_ANALYTICS_SCHEDULED_REPORT_PROVIDER_DISPATCH_ENABLED_ENV =
  'ADMIN_ANALYTICS_SCHEDULED_REPORT_PROVIDER_DISPATCH_ENABLED';

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

function normalizedValue(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

function invalidAssetBlockers(payload: AdminAnalyticsScheduledReportTransportPayload): string[] {
  const blockers: string[] = [];
  for (const asset of payload.assets) {
    if (asset.contentType !== 'text/csv') blockers.push(`unsupported asset content type: ${asset.contentType}`);
    if (asset.byteLength < 0) blockers.push(`invalid asset byte length: ${asset.filename}`);
    if (asset.rowCount < 0) blockers.push(`invalid asset row count: ${asset.filename}`);
  }
  if (payload.recipientCount < 1) blockers.push('at least one owner recipient is required');
  return blockers;
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

export function validateScheduledReportProviderDispatch(
  options: AdminAnalyticsScheduledReportProviderDispatchOptions
): AdminAnalyticsScheduledReportOwnerOutboxValidation {
  const ownerValidation = validateScheduledReportOwnerOutbox(options);
  const blockers = [...ownerValidation.blockers];
  if (!hasValue(options.providerKey)) blockers.push('provider key is required');
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

export function createProviderScheduledReportTransportAdapter(
  options: AdminAnalyticsScheduledReportProviderDispatchOptions,
  providerDispatch?: AdminAnalyticsScheduledReportProviderDispatch | null
): AdminAnalyticsScheduledReportTransportAdapter {
  const validation = validateScheduledReportProviderDispatch(options);
  const configured = validation.configured;
  const liveNetworkEnabled = validation.status === 'owner_outbox_valid' && providerDispatch !== null && providerDispatch !== undefined;
  return {
    name: 'owner-provider-scheduled-report-transport',
    configured,
    liveNetworkEnabled,
    dispatch: async (payload) => {
      const blockers = [...validation.blockers, ...invalidAssetBlockers(payload)];
      if (providerDispatch === null || providerDispatch === undefined) {
        blockers.push('provider dispatch handler is not configured');
      }
      if (blockers.length > 0) {
        return {
          status: 'transport_disabled',
          sent: false,
          provider: 'owner-provider',
          payloadSummary: payloadSummary(payload),
          blockers
        };
      }

      const providerResult = await providerDispatch(payload, {
        destinationKey: normalizedValue(options.destinationKey),
        sourceLabel: normalizedValue(options.sourceLabel),
        credentialRef: normalizedValue(options.credentialRef),
        providerKey: normalizedValue(options.providerKey),
        signingRef: hasValue(options.signingRef) ? normalizedValue(options.signingRef) : null
      });

      return {
        status: 'transport_dispatched',
        sent: true,
        provider: 'owner-provider',
        payloadSummary: payloadSummary(payload),
        blockers: [],
        providerMessageId: providerResult.providerMessageId ?? undefined
      };
    }
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
