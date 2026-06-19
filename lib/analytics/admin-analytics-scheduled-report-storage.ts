import type {
  AdminAnalyticsScheduledReportCadence,
  AdminAnalyticsScheduledReportType
} from './admin-analytics-scheduled-reports';

export type AdminAnalyticsScheduledReportStorageStatus = 'schema_foundation_only';

export type AdminAnalyticsScheduledReportStorageField = {
  name: string;
  required: boolean;
  persisted: boolean;
  description: string;
};

export type AdminAnalyticsScheduledReportStorageContract = {
  status: AdminAnalyticsScheduledReportStorageStatus;
  tableName: 'AdminAnalyticsScheduledReport';
  enabled: boolean;
  schemaMigrationAdded: boolean;
  prismaRepositoryEnabled: boolean;
  readEndpointEnabled: boolean;
  saveEndpointEnabled: boolean;
  updateEndpointEnabled: boolean;
  removeEndpointEnabled: boolean;
  managementUiEnabled: boolean;
  deliveryEnabled: boolean;
  scheduleActivationEnabled: boolean;
  ownerApprovalRequired: boolean;
  ownerApprovalRecorded: boolean;
  dryRunEvidenceRequired: boolean;
  dryRunEvidenceRecorded: boolean;
  allowedCadences: AdminAnalyticsScheduledReportCadence[];
  allowedReportTypes: AdminAnalyticsScheduledReportType[];
  persistedFields: AdminAnalyticsScheduledReportStorageField[];
  blockedPayloadFields: string[];
  activationBlockers: string[];
};

const PERSISTED_FIELDS: AdminAnalyticsScheduledReportStorageField[] = [
  {
    name: 'reportKey',
    required: true,
    persisted: true,
    description: 'Stable scheduled-report key selected from approved owner report configurations.'
  },
  {
    name: 'label',
    required: true,
    persisted: true,
    description: 'Owner-facing report label.'
  },
  {
    name: 'description',
    required: false,
    persisted: true,
    description: 'Optional owner-facing purpose statement.'
  },
  {
    name: 'cadence',
    required: true,
    persisted: true,
    description: 'Weekly or monthly cadence only.'
  },
  {
    name: 'rangeMode',
    required: true,
    persisted: true,
    description: 'Preset or custom range mode copied from the resolved analytics range.'
  },
  {
    name: 'rangeQuery',
    required: true,
    persisted: true,
    description: 'Selected analytics range query string used to rebuild report export links.'
  },
  {
    name: 'reportTypes',
    required: true,
    persisted: true,
    description: 'Aggregate business/site report types only.'
  },
  {
    name: 'ownerApproved',
    required: true,
    persisted: true,
    description: 'Future approval flag; defaults to false in the migration.'
  },
  {
    name: 'isActive',
    required: true,
    persisted: true,
    description: 'Future availability flag; defaults to false in the migration.'
  },
  {
    name: 'deliveryEnabled',
    required: true,
    persisted: true,
    description: 'Future delivery gate; defaults to false in the migration.'
  },
  {
    name: 'lastDryRunSummary',
    required: false,
    persisted: true,
    description: 'Future dry-run evidence summary; defaults to an empty metadata object.'
  }
];

const CONTRACT: AdminAnalyticsScheduledReportStorageContract = {
  status: 'schema_foundation_only',
  tableName: 'AdminAnalyticsScheduledReport',
  enabled: false,
  schemaMigrationAdded: true,
  prismaRepositoryEnabled: false,
  readEndpointEnabled: false,
  saveEndpointEnabled: false,
  updateEndpointEnabled: false,
  removeEndpointEnabled: false,
  managementUiEnabled: false,
  deliveryEnabled: false,
  scheduleActivationEnabled: false,
  ownerApprovalRequired: true,
  ownerApprovalRecorded: false,
  dryRunEvidenceRequired: true,
  dryRunEvidenceRecorded: false,
  allowedCadences: ['weekly', 'monthly'],
  allowedReportTypes: ['business', 'site'],
  persistedFields: PERSISTED_FIELDS,
  blockedPayloadFields: [
    'analytics rows',
    'customer rows',
    'raw event rows',
    'visitor/session identifiers',
    'export file contents',
    'delivery recipient lists'
  ],
  activationBlockers: [
    'owner approval not recorded',
    'dry-run evidence not recorded',
    'repository not implemented',
    'read endpoint not configured',
    'save endpoint not configured',
    'delivery channel not configured',
    'management UI not implemented',
    'global disable control not validated'
  ]
};

export function buildAdminAnalyticsScheduledReportStorageContract(): AdminAnalyticsScheduledReportStorageContract {
  return {
    ...CONTRACT,
    allowedCadences: [...CONTRACT.allowedCadences],
    allowedReportTypes: [...CONTRACT.allowedReportTypes],
    persistedFields: CONTRACT.persistedFields.map((field) => ({ ...field })),
    blockedPayloadFields: [...CONTRACT.blockedPayloadFields],
    activationBlockers: [...CONTRACT.activationBlockers]
  };
}
