export type AdminAnalyticsSavedViewStorageStatus = 'schema_foundation_only';
export type AdminAnalyticsSavedViewStorageScope = 'owner-private' | 'staff-shared' | 'store-wide-owner-managed';
export type AdminAnalyticsSavedViewStorageAudience = 'owner' | 'staff';

export type AdminAnalyticsSavedViewStorageField = {
  name: string;
  required: boolean;
  persisted: boolean;
  description: string;
};

export type AdminAnalyticsSavedViewStorageContract = {
  status: AdminAnalyticsSavedViewStorageStatus;
  tableName: 'AdminAnalyticsSavedView';
  enabled: boolean;
  schemaMigrationAdded: boolean;
  prismaRepositoryEnabled: boolean;
  saveEndpointEnabled: boolean;
  updateEndpointEnabled: boolean;
  removeEndpointEnabled: boolean;
  managementUiEnabled: boolean;
  ownerApprovalRequired: boolean;
  ownerApprovalRecorded: boolean;
  allowedScopes: AdminAnalyticsSavedViewStorageScope[];
  allowedAudiences: AdminAnalyticsSavedViewStorageAudience[];
  persistedFields: AdminAnalyticsSavedViewStorageField[];
  blockedPayloadFields: string[];
  activationBlockers: string[];
};

const PERSISTED_FIELDS: AdminAnalyticsSavedViewStorageField[] = [
  {
    name: 'viewKey',
    required: true,
    persisted: true,
    description: 'Stable saved-view key selected from the approved analytics view presets.'
  },
  {
    name: 'label',
    required: true,
    persisted: true,
    description: 'Operator-facing view label.'
  },
  {
    name: 'description',
    required: false,
    persisted: true,
    description: 'Optional operator-facing purpose statement.'
  },
  {
    name: 'scope',
    required: true,
    persisted: true,
    description: 'Owner-private, staff-shared, or store-wide owner-managed visibility scope.'
  },
  {
    name: 'audience',
    required: true,
    persisted: true,
    description: 'Owner or staff audience boundary for the view.'
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
    description: 'Selected analytics range query string used to rebuild links.'
  },
  {
    name: 'sectionAnchors',
    required: true,
    persisted: true,
    description: 'Approved analytics section anchors only; no metric rows are stored.'
  },
  {
    name: 'ownerApproved',
    required: true,
    persisted: true,
    description: 'Future activation flag; defaults to false in the migration.'
  },
  {
    name: 'isActive',
    required: true,
    persisted: true,
    description: 'Future availability flag; defaults to false in the migration.'
  }
];

const CONTRACT: AdminAnalyticsSavedViewStorageContract = {
  status: 'schema_foundation_only',
  tableName: 'AdminAnalyticsSavedView',
  enabled: false,
  schemaMigrationAdded: true,
  prismaRepositoryEnabled: false,
  saveEndpointEnabled: false,
  updateEndpointEnabled: false,
  removeEndpointEnabled: false,
  managementUiEnabled: false,
  ownerApprovalRequired: true,
  ownerApprovalRecorded: false,
  allowedScopes: ['owner-private', 'staff-shared', 'store-wide-owner-managed'],
  allowedAudiences: ['owner', 'staff'],
  persistedFields: PERSISTED_FIELDS,
  blockedPayloadFields: [
    'analytics rows',
    'customer rows',
    'raw event rows',
    'customer contact fields',
    'visitor/session identifiers',
    'export file contents'
  ],
  activationBlockers: [
    'owner approval not recorded',
    'repository not implemented',
    'save endpoint not configured',
    'management UI not implemented',
    'role policy enforcement not validated'
  ]
};

export function buildAdminAnalyticsSavedViewStorageContract(): AdminAnalyticsSavedViewStorageContract {
  return {
    ...CONTRACT,
    allowedScopes: [...CONTRACT.allowedScopes],
    allowedAudiences: [...CONTRACT.allowedAudiences],
    persistedFields: CONTRACT.persistedFields.map((field) => ({ ...field })),
    blockedPayloadFields: [...CONTRACT.blockedPayloadFields],
    activationBlockers: [...CONTRACT.activationBlockers]
  };
}
