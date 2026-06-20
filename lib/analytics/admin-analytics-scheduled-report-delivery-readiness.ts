import type {
  AdminAnalyticsScheduledReportCadence,
  AdminAnalyticsScheduledReportType
} from './admin-analytics-scheduled-reports';

export type AdminAnalyticsScheduledReportDeliveryReadinessStatus = 'delivery_readiness_contract_only';
export type AdminAnalyticsScheduledReportDeliveryChannelKey = 'owner-email' | 'owner-dashboard-download';
export type AdminAnalyticsScheduledReportDeliveryPayloadSection =
  | 'selected-range-summary'
  | 'business-csv-preview'
  | 'site-csv-preview'
  | 'owner-approval-summary'
  | 'global-disable-summary'
  | 'dry-run-summary'
  | 'failure-visibility-summary';

export type AdminAnalyticsScheduledReportDeliveryRequirement = {
  key: string;
  label: string;
  required: boolean;
  satisfiedByDefault: boolean;
};

export type AdminAnalyticsScheduledReportAggregateDeliveryPayloadContract = {
  status: 'aggregate_payload_contract_only';
  enabled: false;
  aggregateOnly: true;
  allowedReportTypes: AdminAnalyticsScheduledReportType[];
  allowedCadences: AdminAnalyticsScheduledReportCadence[];
  requiredPayloadSections: AdminAnalyticsScheduledReportDeliveryPayloadSection[];
  requiredPayloadFields: string[];
  blockedPayloadFields: string[];
  payloadBodyRecordingEnabled: false;
  payloadPreviewRecordingEnabled: false;
};

export type AdminAnalyticsScheduledReportDeliveryChannelContract = {
  status: 'delivery_channel_disabled_contract_only';
  enabled: false;
  channelRuntimeEnabled: false;
  channelConfigurationRecordingEnabled: false;
  allowedFutureChannels: AdminAnalyticsScheduledReportDeliveryChannelKey[];
  requiredChannelEvidenceFields: string[];
  blockedChannelOperations: string[];
};

export type AdminAnalyticsScheduledReportRetryFailureVisibilityContract = {
  status: 'retry_failure_visibility_contract_only';
  enabled: false;
  retryPolicyVisible: true;
  retryExecutionEnabled: false;
  failureVisibilityRequired: true;
  failureRecordingEnabled: false;
  requiredFailureEvidenceFields: string[];
  blockedRetryOperations: string[];
};

export type AdminAnalyticsScheduledReportOperatorPreviewSummaryContract = {
  status: 'operator_preview_summary_contract_only';
  enabled: false;
  previewSummaryRequired: true;
  previewSummaryRecordingEnabled: false;
  ownerReviewerRequired: true;
  requiredPreviewFields: string[];
  blockedPreviewOperations: string[];
};

export type AdminAnalyticsScheduledReportDeliveryReadinessContract = {
  status: AdminAnalyticsScheduledReportDeliveryReadinessStatus;
  enabled: false;
  contractAvailable: true;
  aggregatePayloadContract: AdminAnalyticsScheduledReportAggregateDeliveryPayloadContract;
  deliveryChannelContract: AdminAnalyticsScheduledReportDeliveryChannelContract;
  retryFailureVisibilityContract: AdminAnalyticsScheduledReportRetryFailureVisibilityContract;
  operatorPreviewSummaryContract: AdminAnalyticsScheduledReportOperatorPreviewSummaryContract;
  deliveryExecutionEnabled: false;
  schedulerEnabled: false;
  timerEnabled: false;
  backgroundJobEnabled: false;
  repositoryReadsEnabled: false;
  repositoryWritesEnabled: false;
  readEndpointEnabled: false;
  managementUiEnabled: false;
  ownerApprovalRecordingEnabled: false;
  dryRunEvidenceRecordingEnabled: false;
  globalDisableStateRecordingEnabled: false;
  ownerOverrideEnabled: false;
  requirements: AdminAnalyticsScheduledReportDeliveryRequirement[];
  blockedOperations: string[];
  activationBlockers: string[];
};

const ALLOWED_REPORT_TYPES: AdminAnalyticsScheduledReportType[] = ['business', 'site'];
const ALLOWED_CADENCES: AdminAnalyticsScheduledReportCadence[] = ['weekly', 'monthly'];

const REQUIRED_PAYLOAD_SECTIONS: AdminAnalyticsScheduledReportDeliveryPayloadSection[] = [
  'selected-range-summary',
  'business-csv-preview',
  'site-csv-preview',
  'owner-approval-summary',
  'global-disable-summary',
  'dry-run-summary',
  'failure-visibility-summary'
];

const BLOCKED_PAYLOAD_FIELDS = [
  'customer rows',
  'customer contact fields',
  'raw site event rows',
  'visitor identifiers',
  'session identifiers',
  'per-order line items',
  'unbounded analytics rows',
  'message body content'
];

const REQUIREMENTS: AdminAnalyticsScheduledReportDeliveryRequirement[] = [
  {
    key: 'aggregate-business-site-only',
    label: 'Payload references aggregate Business and Site reports only.',
    required: true,
    satisfiedByDefault: false
  },
  {
    key: 'selected-range-recorded',
    label: 'Selected range label and query are present in the payload summary.',
    required: true,
    satisfiedByDefault: false
  },
  {
    key: 'csv-preview-paths-recorded',
    label: 'Business and Site CSV preview paths are recorded before any future delivery work.',
    required: true,
    satisfiedByDefault: false
  },
  {
    key: 'channel-disabled-confirmed',
    label: 'Delivery channel configuration remains disabled while the contract is reviewed.',
    required: true,
    satisfiedByDefault: false
  },
  {
    key: 'retry-visibility-reviewed',
    label: 'Retry and failure visibility expectations are reviewed without executing retries.',
    required: true,
    satisfiedByDefault: false
  },
  {
    key: 'operator-preview-reviewed',
    label: 'Owner/operator preview summary is reviewed before any future activation.',
    required: true,
    satisfiedByDefault: false
  }
];

export function buildAdminAnalyticsScheduledReportDeliveryReadinessContract(): AdminAnalyticsScheduledReportDeliveryReadinessContract {
  return {
    status: 'delivery_readiness_contract_only',
    enabled: false,
    contractAvailable: true,
    aggregatePayloadContract: {
      status: 'aggregate_payload_contract_only',
      enabled: false,
      aggregateOnly: true,
      allowedReportTypes: [...ALLOWED_REPORT_TYPES],
      allowedCadences: [...ALLOWED_CADENCES],
      requiredPayloadSections: [...REQUIRED_PAYLOAD_SECTIONS],
      requiredPayloadFields: [
        'selected range label',
        'selected range query',
        'weekly or monthly cadence',
        'Business CSV preview path',
        'Site CSV preview path',
        'owner approval summary',
        'global disable summary',
        'dry-run summary',
        'failure visibility summary'
      ],
      blockedPayloadFields: [...BLOCKED_PAYLOAD_FIELDS],
      payloadBodyRecordingEnabled: false,
      payloadPreviewRecordingEnabled: false
    },
    deliveryChannelContract: {
      status: 'delivery_channel_disabled_contract_only',
      enabled: false,
      channelRuntimeEnabled: false,
      channelConfigurationRecordingEnabled: false,
      allowedFutureChannels: ['owner-email', 'owner-dashboard-download'],
      requiredChannelEvidenceFields: [
        'channel owner',
        'channel destination policy',
        'disable workflow',
        'aggregate-only payload confirmation',
        'dry-run evidence reference'
      ],
      blockedChannelOperations: [
        'configure live channel',
        'send scheduled report',
        'enqueue scheduled report',
        'activate channel runtime'
      ]
    },
    retryFailureVisibilityContract: {
      status: 'retry_failure_visibility_contract_only',
      enabled: false,
      retryPolicyVisible: true,
      retryExecutionEnabled: false,
      failureVisibilityRequired: true,
      failureRecordingEnabled: false,
      requiredFailureEvidenceFields: [
        'failure status label',
        'last attempt timestamp field',
        'next retry policy label',
        'owner-visible failure summary',
        'manual disable instruction'
      ],
      blockedRetryOperations: [
        'execute retry',
        'queue retry',
        'record failure state',
        'notify delivery channel'
      ]
    },
    operatorPreviewSummaryContract: {
      status: 'operator_preview_summary_contract_only',
      enabled: false,
      previewSummaryRequired: true,
      previewSummaryRecordingEnabled: false,
      ownerReviewerRequired: true,
      requiredPreviewFields: [
        'reviewer identity',
        'selected range label',
        'selected range query',
        'cadence',
        'Business CSV preview path',
        'Site CSV preview path',
        'delivery disabled confirmation',
        'global disable confirmation'
      ],
      blockedPreviewOperations: [
        'record preview review',
        'activate schedule from preview',
        'enable delivery from preview'
      ]
    },
    deliveryExecutionEnabled: false,
    schedulerEnabled: false,
    timerEnabled: false,
    backgroundJobEnabled: false,
    repositoryReadsEnabled: false,
    repositoryWritesEnabled: false,
    readEndpointEnabled: false,
    managementUiEnabled: false,
    ownerApprovalRecordingEnabled: false,
    dryRunEvidenceRecordingEnabled: false,
    globalDisableStateRecordingEnabled: false,
    ownerOverrideEnabled: false,
    requirements: REQUIREMENTS.map((requirement) => ({ ...requirement })),
    blockedOperations: [
      'build live delivery payload',
      'record payload preview',
      'configure live delivery channel',
      'execute delivery',
      'execute retry',
      'record failure state',
      'record operator preview',
      'activate scheduled report metadata'
    ],
    activationBlockers: [
      'delivery payload recording not enabled',
      'delivery channel runtime disabled',
      'retry execution disabled',
      'failure recording disabled',
      'operator preview recording not enabled',
      'owner approval recording not enabled',
      'dry-run evidence recording not enabled',
      'global disable state recording not enabled',
      'scheduler remains disabled',
      'delivery execution remains disabled'
    ]
  };
}
