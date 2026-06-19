import type { AdminAnalyticsScheduledReport as PrismaAdminAnalyticsScheduledReport } from '@prisma/client';
import {
  buildAdminAnalyticsScheduledReportReadModelContract,
  normalizeAdminAnalyticsScheduledReportReadRow,
  type AdminAnalyticsScheduledReportReadDto,
  type AdminAnalyticsScheduledReportReadModelContract,
  type AdminAnalyticsScheduledReportReadRow
} from './admin-analytics-scheduled-report-read-model';

export type AdminAnalyticsScheduledReportRepositoryStatus = 'repository_read_contract_only' | 'repository_read_adapter_only';

export type AdminAnalyticsScheduledReportRepositoryReadFilter = {
  field: 'ownerApproved' | 'isActive' | 'deliveryEnabled';
  expected: boolean;
  required: boolean;
  description: string;
};

export type AdminAnalyticsScheduledReportRepositoryReadPlan = {
  tableName: 'AdminAnalyticsScheduledReport';
  generatedClientModelName: 'AdminAnalyticsScheduledReport';
  selectFields: AdminAnalyticsScheduledReportGeneratedClientReadField[];
  requiredFilters: AdminAnalyticsScheduledReportRepositoryReadFilter[];
  orderBy: ['cadence', 'reportKey'];
  maxRows: number;
  returnsMetadataOnly: boolean;
};

export type AdminAnalyticsScheduledReportRepositoryReadArgs = {
  select: Record<AdminAnalyticsScheduledReportGeneratedClientReadField, true>;
  where: {
    ownerApproved: true;
    isActive: true;
    deliveryEnabled: false;
  };
  orderBy: [{ cadence: 'asc' }, { reportKey: 'asc' }];
  take: number;
};

export type AdminAnalyticsScheduledReportGeneratedClientReadField =
  | 'id'
  | 'reportKey'
  | 'label'
  | 'description'
  | 'cadence'
  | 'rangeMode'
  | 'rangeQuery'
  | 'reportTypes'
  | 'ownerApproved'
  | 'isActive'
  | 'deliveryEnabled'
  | 'lastDryRunSummary'
  | 'createdAt'
  | 'updatedAt';

export type AdminAnalyticsScheduledReportGeneratedClientReadRow = Pick<
  PrismaAdminAnalyticsScheduledReport,
  AdminAnalyticsScheduledReportGeneratedClientReadField
>;

export type AdminAnalyticsScheduledReportRepositoryReader = {
  readScheduledReportMetadata: (
    args: AdminAnalyticsScheduledReportRepositoryReadArgs
  ) => Promise<AdminAnalyticsScheduledReportGeneratedClientReadRow[]>;
};

export type AdminAnalyticsScheduledReportRepositoryContract = {
  status: 'repository_read_contract_only';
  enabled: boolean;
  tableName: 'AdminAnalyticsScheduledReport';
  generatedClientModelName: 'AdminAnalyticsScheduledReport';
  generatedClientTypeVisible: boolean;
  generatedClientRuntimeAccessEnabled: boolean;
  repositoryReadsEnabled: boolean;
  repositoryWritesEnabled: boolean;
  readAdapterAvailable: boolean;
  readEndpointEnabled: boolean;
  managementUiEnabled: boolean;
  deliveryExecutionEnabled: boolean;
  dryRunEvidenceRequired: boolean;
  dryRunEvidenceRecorded: boolean;
  readPlan: AdminAnalyticsScheduledReportRepositoryReadPlan;
  outputFields: string[];
  blockedOutputFields: string[];
  blockedOperations: string[];
  activationBlockers: string[];
};

export type AdminAnalyticsScheduledReportRepositoryPreview = {
  status: AdminAnalyticsScheduledReportRepositoryStatus;
  enabled: boolean;
  repositoryReadsEnabled: boolean;
  deliveryExecutionEnabled: boolean;
  rows: AdminAnalyticsScheduledReportReadDto[];
  omittedRowCount: number;
};

const SELECT_FIELDS: AdminAnalyticsScheduledReportGeneratedClientReadField[] = [
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
  'lastDryRunSummary',
  'createdAt',
  'updatedAt'
];

const REQUIRED_FILTERS: AdminAnalyticsScheduledReportRepositoryReadFilter[] = [
  {
    field: 'ownerApproved',
    expected: true,
    required: true,
    description: 'Only owner-approved schedule metadata may be considered by a future read path.'
  },
  {
    field: 'isActive',
    expected: true,
    required: true,
    description: 'Only explicitly active metadata may be considered by a future read path.'
  },
  {
    field: 'deliveryEnabled',
    expected: false,
    required: true,
    description: 'Delivery must remain disabled while this repository read foundation is validated.'
  }
];

const BLOCKED_OPERATIONS = [
  'write scheduled report metadata',
  'change scheduled report metadata',
  'remove scheduled report metadata',
  'run scheduled report delivery',
  'enqueue scheduled report delivery',
  'expose scheduled report route',
  'render scheduled report management UI'
];

function readModelContract(): AdminAnalyticsScheduledReportReadModelContract {
  return buildAdminAnalyticsScheduledReportReadModelContract();
}

function normalizeRows(rows: AdminAnalyticsScheduledReportReadRow[], limit: number): AdminAnalyticsScheduledReportReadDto[] {
  return rows
    .map((row) => normalizeAdminAnalyticsScheduledReportReadRow(row))
    .filter((row): row is AdminAnalyticsScheduledReportReadDto => row !== null)
    .slice(0, Math.max(0, Math.min(limit, 50)));
}

function selectFieldsForRead(
  fields: AdminAnalyticsScheduledReportGeneratedClientReadField[]
): Record<AdminAnalyticsScheduledReportGeneratedClientReadField, true> {
  return Object.fromEntries(fields.map((field) => [field, true])) as Record<
    AdminAnalyticsScheduledReportGeneratedClientReadField,
    true
  >;
}

export function buildAdminAnalyticsScheduledReportRepositoryReadPlan(
  maxRows = 25
): AdminAnalyticsScheduledReportRepositoryReadPlan {
  const cappedMaxRows = Math.max(0, Math.min(maxRows, 50));
  return {
    tableName: 'AdminAnalyticsScheduledReport',
    generatedClientModelName: 'AdminAnalyticsScheduledReport',
    selectFields: [...SELECT_FIELDS],
    requiredFilters: REQUIRED_FILTERS.map((filter) => ({ ...filter })),
    orderBy: ['cadence', 'reportKey'],
    maxRows: cappedMaxRows,
    returnsMetadataOnly: true
  };
}

export function buildAdminAnalyticsScheduledReportRepositoryReadArgs(
  maxRows = 25
): AdminAnalyticsScheduledReportRepositoryReadArgs {
  const readPlan = buildAdminAnalyticsScheduledReportRepositoryReadPlan(maxRows);
  return {
    select: selectFieldsForRead(readPlan.selectFields),
    where: {
      ownerApproved: true,
      isActive: true,
      deliveryEnabled: false
    },
    orderBy: [{ cadence: 'asc' }, { reportKey: 'asc' }],
    take: readPlan.maxRows
  };
}

export function buildAdminAnalyticsScheduledReportRepositoryContract(): AdminAnalyticsScheduledReportRepositoryContract {
  const readModel = readModelContract();
  return {
    status: 'repository_read_contract_only',
    enabled: false,
    tableName: readModel.tableName,
    generatedClientModelName: 'AdminAnalyticsScheduledReport',
    generatedClientTypeVisible: true,
    generatedClientRuntimeAccessEnabled: false,
    repositoryReadsEnabled: false,
    repositoryWritesEnabled: false,
    readAdapterAvailable: true,
    readEndpointEnabled: false,
    managementUiEnabled: false,
    deliveryExecutionEnabled: false,
    dryRunEvidenceRequired: true,
    dryRunEvidenceRecorded: false,
    readPlan: buildAdminAnalyticsScheduledReportRepositoryReadPlan(),
    outputFields: [...readModel.outputFields],
    blockedOutputFields: [...readModel.blockedOutputFields],
    blockedOperations: [...BLOCKED_OPERATIONS],
    activationBlockers: [
      'generated Prisma client runtime access not enabled',
      'Prisma repository access not enabled',
      'owner approval audit evidence not recorded',
      'dry-run evidence not recorded',
      'read endpoint not configured',
      'management UI not implemented',
      'delivery execution remains disabled',
      'global disable control not validated'
    ]
  };
}

export function buildAdminAnalyticsScheduledReportRepositoryPreview(
  rows: AdminAnalyticsScheduledReportReadRow[],
  limit = 10
): AdminAnalyticsScheduledReportRepositoryPreview {
  const normalized = normalizeRows(rows, limit);

  return {
    status: 'repository_read_contract_only',
    enabled: false,
    repositoryReadsEnabled: false,
    deliveryExecutionEnabled: false,
    rows: normalized,
    omittedRowCount: Math.max(0, rows.length - normalized.length)
  };
}

export async function readAdminAnalyticsScheduledReportsFromRepository(
  reader: AdminAnalyticsScheduledReportRepositoryReader,
  maxRows = 25
): Promise<AdminAnalyticsScheduledReportRepositoryPreview> {
  const args = buildAdminAnalyticsScheduledReportRepositoryReadArgs(maxRows);
  const rows = await reader.readScheduledReportMetadata(args);
  const normalized = normalizeRows(rows, args.take);

  return {
    status: 'repository_read_adapter_only',
    enabled: false,
    repositoryReadsEnabled: false,
    deliveryExecutionEnabled: false,
    rows: normalized,
    omittedRowCount: Math.max(0, rows.length - normalized.length)
  };
}
