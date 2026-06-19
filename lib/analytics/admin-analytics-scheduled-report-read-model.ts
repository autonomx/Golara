import {
  buildAdminAnalyticsScheduledReportStorageContract,
  type AdminAnalyticsScheduledReportStorageContract
} from './admin-analytics-scheduled-report-storage';
import type {
  AdminAnalyticsScheduledReportCadence,
  AdminAnalyticsScheduledReportType
} from './admin-analytics-scheduled-reports';

export type AdminAnalyticsScheduledReportReadModelStatus = 'read_model_foundation_only';

export type AdminAnalyticsScheduledReportReadRow = {
  id: string;
  reportKey: string;
  label: string;
  description?: string | null;
  cadence: string;
  rangeMode: string;
  rangeQuery: string;
  reportTypes: unknown;
  ownerApproved: boolean;
  isActive: boolean;
  deliveryEnabled: boolean;
  lastDryRunSummary?: unknown;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

export type AdminAnalyticsScheduledReportReadDto = {
  id: string;
  reportKey: string;
  label: string;
  description: string | null;
  cadence: AdminAnalyticsScheduledReportCadence;
  rangeMode: string;
  rangeQuery: string;
  reportTypes: AdminAnalyticsScheduledReportType[];
  ownerApproved: boolean;
  isActive: boolean;
  deliveryEnabled: boolean;
  hasDryRunEvidence: boolean;
  activeForOperators: false;
  deliveryReady: false;
};

export type AdminAnalyticsScheduledReportReadModelContract = {
  status: AdminAnalyticsScheduledReportReadModelStatus;
  enabled: boolean;
  tableName: 'AdminAnalyticsScheduledReport';
  repositoryReadsEnabled: boolean;
  readEndpointEnabled: boolean;
  managementUiEnabled: boolean;
  deliveryExecutionEnabled: boolean;
  requiresOwnerApprovalFilter: boolean;
  requiresActiveFlagFilter: boolean;
  requiresDeliveryDisableFilter: boolean;
  returnsMetadataOnly: boolean;
  allowedCadences: AdminAnalyticsScheduledReportCadence[];
  allowedReportTypes: AdminAnalyticsScheduledReportType[];
  outputFields: string[];
  blockedOutputFields: string[];
  activationBlockers: string[];
};

export type AdminAnalyticsScheduledReportReadModelPreview = {
  status: AdminAnalyticsScheduledReportReadModelStatus;
  enabled: boolean;
  repositoryReadsEnabled: boolean;
  deliveryExecutionEnabled: boolean;
  rows: AdminAnalyticsScheduledReportReadDto[];
  omittedRowCount: number;
};

const OUTPUT_FIELDS = [
  'id',
  'reportKey',
  'label',
  'description',
  'cadence',
  'rangeMode',
  'rangeQuery',
  'reportTypes',
  'ownerApproved',
  'isActive',
  'deliveryEnabled',
  'hasDryRunEvidence'
];

const BLOCKED_OUTPUT_FIELDS = [
  'analyticsRows',
  'customerRows',
  'eventRows',
  'visitorSessionKeys',
  'exportContents',
  'recipientLists',
  'deliveryPayloads'
];

function storageContract(): AdminAnalyticsScheduledReportStorageContract {
  return buildAdminAnalyticsScheduledReportStorageContract();
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function allowedCadence(value: string): value is AdminAnalyticsScheduledReportCadence {
  return storageContract().allowedCadences.includes(value as AdminAnalyticsScheduledReportCadence);
}

function allowedReportType(value: string): value is AdminAnalyticsScheduledReportType {
  return storageContract().allowedReportTypes.includes(value as AdminAnalyticsScheduledReportType);
}

function cleanReportTypes(value: unknown): AdminAnalyticsScheduledReportType[] {
  if (!Array.isArray(value)) return [];
  const reportTypes = value.filter(nonEmpty).map((reportType) => reportType.trim()).filter(allowedReportType);
  return Array.from(new Set(reportTypes));
}

function hasDryRunEvidence(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.keys(value).length > 0;
}

export function normalizeAdminAnalyticsScheduledReportReadRow(
  row: AdminAnalyticsScheduledReportReadRow
): AdminAnalyticsScheduledReportReadDto | null {
  if (!nonEmpty(row.id)) return null;
  if (!nonEmpty(row.reportKey)) return null;
  if (!nonEmpty(row.label)) return null;
  if (!allowedCadence(row.cadence)) return null;
  if (!nonEmpty(row.rangeMode)) return null;
  if (!nonEmpty(row.rangeQuery)) return null;

  const reportTypes = cleanReportTypes(row.reportTypes);
  if (reportTypes.length === 0) return null;

  return {
    id: row.id.trim(),
    reportKey: row.reportKey.trim(),
    label: row.label.trim(),
    description: nonEmpty(row.description) ? row.description.trim() : null,
    cadence: row.cadence,
    rangeMode: row.rangeMode.trim(),
    rangeQuery: row.rangeQuery.trim(),
    reportTypes,
    ownerApproved: row.ownerApproved === true,
    isActive: row.isActive === true,
    deliveryEnabled: row.deliveryEnabled === true,
    hasDryRunEvidence: hasDryRunEvidence(row.lastDryRunSummary),
    activeForOperators: false,
    deliveryReady: false
  };
}

export function buildAdminAnalyticsScheduledReportReadModelContract(): AdminAnalyticsScheduledReportReadModelContract {
  const storage = storageContract();
  return {
    status: 'read_model_foundation_only',
    enabled: false,
    tableName: storage.tableName,
    repositoryReadsEnabled: false,
    readEndpointEnabled: false,
    managementUiEnabled: false,
    deliveryExecutionEnabled: false,
    requiresOwnerApprovalFilter: true,
    requiresActiveFlagFilter: true,
    requiresDeliveryDisableFilter: true,
    returnsMetadataOnly: true,
    allowedCadences: [...storage.allowedCadences],
    allowedReportTypes: [...storage.allowedReportTypes],
    outputFields: [...OUTPUT_FIELDS],
    blockedOutputFields: [...BLOCKED_OUTPUT_FIELDS],
    activationBlockers: [
      'repository access not enabled',
      'read endpoint not configured',
      'management UI not implemented',
      'owner approval filter not wired to an active query',
      'dry-run evidence filter not wired to an active query',
      'delivery execution remains disabled'
    ]
  };
}

export function buildAdminAnalyticsScheduledReportReadModelPreview(
  rows: AdminAnalyticsScheduledReportReadRow[],
  limit = 10
): AdminAnalyticsScheduledReportReadModelPreview {
  const normalized = rows
    .map((row) => normalizeAdminAnalyticsScheduledReportReadRow(row))
    .filter((row): row is AdminAnalyticsScheduledReportReadDto => row !== null)
    .slice(0, Math.max(0, limit));

  return {
    status: 'read_model_foundation_only',
    enabled: false,
    repositoryReadsEnabled: false,
    deliveryExecutionEnabled: false,
    rows: normalized,
    omittedRowCount: Math.max(0, rows.length - normalized.length)
  };
}
