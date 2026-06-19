import {
  buildAdminAnalyticsSavedViewStorageContract,
  type AdminAnalyticsSavedViewStorageAudience,
  type AdminAnalyticsSavedViewStorageScope
} from './admin-analytics-saved-view-storage';

export type AdminAnalyticsSavedViewReadModelStatus = 'read_model_foundation_only';

export type AdminAnalyticsSavedViewReadRow = {
  id: string;
  viewKey: string;
  label: string;
  description?: string | null;
  scope: string;
  audience: string;
  rangeMode: string;
  rangeQuery: string;
  sectionAnchors: unknown;
  ownerApproved: boolean;
  isActive: boolean;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

export type AdminAnalyticsSavedViewReadDto = {
  id: string;
  viewKey: string;
  label: string;
  description: string | null;
  scope: AdminAnalyticsSavedViewStorageScope;
  audience: AdminAnalyticsSavedViewStorageAudience;
  rangeMode: string;
  rangeQuery: string;
  sectionAnchors: string[];
  firstSectionAnchor: string;
  ownerApproved: boolean;
  isActive: boolean;
  activeForOperators: false;
};

export type AdminAnalyticsSavedViewReadModelContract = {
  status: AdminAnalyticsSavedViewReadModelStatus;
  enabled: boolean;
  tableName: 'AdminAnalyticsSavedView';
  repositoryReadsEnabled: boolean;
  readEndpointEnabled: boolean;
  managementUiEnabled: boolean;
  requiresOwnerApprovalFilter: boolean;
  requiresActiveFlagFilter: boolean;
  returnsMetadataOnly: boolean;
  allowedScopes: AdminAnalyticsSavedViewStorageScope[];
  allowedAudiences: AdminAnalyticsSavedViewStorageAudience[];
  outputFields: string[];
  blockedOutputFields: string[];
  activationBlockers: string[];
};

export type AdminAnalyticsSavedViewReadModelPreview = {
  status: AdminAnalyticsSavedViewReadModelStatus;
  enabled: boolean;
  repositoryReadsEnabled: boolean;
  rows: AdminAnalyticsSavedViewReadDto[];
  omittedRowCount: number;
};

const OUTPUT_FIELDS = [
  'id',
  'viewKey',
  'label',
  'description',
  'scope',
  'audience',
  'rangeMode',
  'rangeQuery',
  'sectionAnchors',
  'firstSectionAnchor',
  'ownerApproved',
  'isActive'
];

const BLOCKED_OUTPUT_FIELDS = [
  'metricRows',
  'customerRows',
  'eventRows',
  'contactFields',
  'visitorSessionKeys',
  'exportContents'
];

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function allowedScope(value: string): value is AdminAnalyticsSavedViewStorageScope {
  return buildAdminAnalyticsSavedViewStorageContract().allowedScopes.includes(value as AdminAnalyticsSavedViewStorageScope);
}

function allowedAudience(value: string): value is AdminAnalyticsSavedViewStorageAudience {
  return buildAdminAnalyticsSavedViewStorageContract().allowedAudiences.includes(value as AdminAnalyticsSavedViewStorageAudience);
}

function cleanAnchors(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const anchors = value
    .filter(nonEmpty)
    .map((anchor) => anchor.trim())
    .filter((anchor) => anchor.startsWith('#') && anchor.length <= 80);
  return Array.from(new Set(anchors)).slice(0, 24);
}

export function normalizeAdminAnalyticsSavedViewReadRow(row: AdminAnalyticsSavedViewReadRow): AdminAnalyticsSavedViewReadDto | null {
  if (!nonEmpty(row.id)) return null;
  if (!nonEmpty(row.viewKey)) return null;
  if (!nonEmpty(row.label)) return null;
  if (!allowedScope(row.scope)) return null;
  if (!allowedAudience(row.audience)) return null;
  if (!nonEmpty(row.rangeMode)) return null;
  if (!nonEmpty(row.rangeQuery)) return null;

  const sectionAnchors = cleanAnchors(row.sectionAnchors);
  if (sectionAnchors.length === 0) return null;

  return {
    id: row.id.trim(),
    viewKey: row.viewKey.trim(),
    label: row.label.trim(),
    description: nonEmpty(row.description) ? row.description.trim() : null,
    scope: row.scope,
    audience: row.audience,
    rangeMode: row.rangeMode.trim(),
    rangeQuery: row.rangeQuery.trim(),
    sectionAnchors,
    firstSectionAnchor: sectionAnchors[0],
    ownerApproved: row.ownerApproved === true,
    isActive: row.isActive === true,
    activeForOperators: false
  };
}

export function buildAdminAnalyticsSavedViewReadModelContract(): AdminAnalyticsSavedViewReadModelContract {
  const storage = buildAdminAnalyticsSavedViewStorageContract();
  return {
    status: 'read_model_foundation_only',
    enabled: false,
    tableName: storage.tableName,
    repositoryReadsEnabled: false,
    readEndpointEnabled: false,
    managementUiEnabled: false,
    requiresOwnerApprovalFilter: true,
    requiresActiveFlagFilter: true,
    returnsMetadataOnly: true,
    allowedScopes: [...storage.allowedScopes],
    allowedAudiences: [...storage.allowedAudiences],
    outputFields: [...OUTPUT_FIELDS],
    blockedOutputFields: [...BLOCKED_OUTPUT_FIELDS],
    activationBlockers: [
      'repository access not enabled',
      'read endpoint not configured',
      'management UI not implemented',
      'role policy enforcement not validated',
      'owner approval filter not wired to an active query'
    ]
  };
}

export function buildAdminAnalyticsSavedViewReadModelPreview(
  rows: AdminAnalyticsSavedViewReadRow[],
  limit = 10
): AdminAnalyticsSavedViewReadModelPreview {
  const normalized = rows
    .map((row) => normalizeAdminAnalyticsSavedViewReadRow(row))
    .filter((row): row is AdminAnalyticsSavedViewReadDto => row !== null)
    .slice(0, Math.max(0, limit));

  return {
    status: 'read_model_foundation_only',
    enabled: false,
    repositoryReadsEnabled: false,
    rows: normalized,
    omittedRowCount: Math.max(0, rows.length - normalized.length)
  };
}
