import type { AdminAnalyticsScheduledReport as PrismaAdminAnalyticsScheduledReport } from '@prisma/client';
import {
  buildAdminAnalyticsScheduledReportReadModelContract,
  normalizeAdminAnalyticsScheduledReportReadRow,
  type AdminAnalyticsScheduledReportReadDto,
  type AdminAnalyticsScheduledReportReadModelContract,
  type AdminAnalyticsScheduledReportReadRow
} from './admin-analytics-scheduled-report-read-model';

export type AdminAnalyticsScheduledReportRepositoryStatus =
  | 'repository_read_contract_only'
  | 'repository_read_adapter_only'
  | 'repository_read_runtime_gated';

export type AdminAnalyticsScheduledReportRepositoryReadFilter = {
  field: 'ownerApproved' | 'isActive' | 'deliveryEnabled';
  expected: boolean;
  required: boolean;
  description: string;
};

export type AdminAnalyticsScheduledReportRepositoryReadPlan = {
  tableName: 'AdminAnalyticsScheduledReport';
  generatedClientModelName: 'AdminAnalyticsScheduledReport';
  generatedClientDelegateName: 'adminAnalyticsScheduledReport';
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

export type AdminAnalyticsScheduledReportGeneratedClientReadDelegate = {
  findMany: (
    args: AdminAnalyticsScheduledReportRepositoryReadArgs
  ) => Promise<AdminAnalyticsScheduledReportGeneratedClientReadRow[]>;
};

export type AdminAnalyticsScheduledReportRuntimeReadGateState = {
  readerFactoryRuntimeEnabled: boolean;
  generatedClientRuntimeAccessEnabled: boolean;
  repositoryReadsEnabled: boolean;
  repositoryWritesEnabled: boolean;
  globalKillSwitchValidated: boolean;
  ownerApprovalPolicyValidated: boolean;
  dryRunEvidenceValidated: boolean;
  deliveryExecutionEnabled: boolean;
  readEndpointEnabled: boolean;
  managementUiEnabled: boolean;
  schedulerEnabled: boolean;
};

export type AdminAnalyticsScheduledReportRuntimeReadGateDecision = {
  status: 'repository_read_runtime_gated';
  enabled: boolean;
  canCreateReader: boolean;
  generatedClientDelegateName: 'adminAnalyticsScheduledReport';
  generatedClientModelName: 'AdminAnalyticsScheduledReport';
  readArgs: AdminAnalyticsScheduledReportRepositoryReadArgs;
  state: AdminAnalyticsScheduledReportRuntimeReadGateState;
  blockers: string[];
};

export type AdminAnalyticsScheduledReportPrismaReaderFactoryContract = {
  status: 'prisma_reader_factory_disabled';
  enabled: false;
  factoryAvailable: boolean;
  factoryRuntimeEnabled: boolean;
  runtimeReadGateAvailable: boolean;
  runtimeReadGateDefaultEnabled: boolean;
  generatedClientDelegateName: 'adminAnalyticsScheduledReport';
  generatedClientModelName: 'AdminAnalyticsScheduledReport';
  generatedClientTypeVisible: boolean;
  generatedClientRuntimeAccessEnabled: boolean;
  repositoryReadsEnabled: boolean;
  repositoryWritesEnabled: boolean;
  readEndpointEnabled: boolean;
  managementUiEnabled: boolean;
  deliveryExecutionEnabled: boolean;
  readArgs: AdminAnalyticsScheduledReportRepositoryReadArgs;
  activationBlockers: string[];
};

export type AdminAnalyticsScheduledReportPrismaReaderFactory = {
  contract: AdminAnalyticsScheduledReportPrismaReaderFactoryContract;
  createReader: () => AdminAnalyticsScheduledReportRepositoryReader | null;
};

export type AdminAnalyticsScheduledReportGatedPrismaReaderFactory = {
  decision: AdminAnalyticsScheduledReportRuntimeReadGateDecision;
  createReader: () => AdminAnalyticsScheduledReportRepositoryReader | null;
};

export type AdminAnalyticsScheduledReportRepositoryContract = {
  status: 'repository_read_contract_only';
  enabled: boolean;
  tableName: 'AdminAnalyticsScheduledReport';
  generatedClientModelName: 'AdminAnalyticsScheduledReport';
  generatedClientDelegateName: 'adminAnalyticsScheduledReport';
  generatedClientTypeVisible: boolean;
  generatedClientRuntimeAccessEnabled: boolean;
  repositoryReadsEnabled: boolean;
  repositoryWritesEnabled: boolean;
  readAdapterAvailable: boolean;
  readerFactoryAvailable: boolean;
  readerFactoryRuntimeEnabled: boolean;
  runtimeReadGateAvailable: boolean;
  runtimeReadGateDefaultEnabled: boolean;
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

const DEFAULT_RUNTIME_READ_GATE_STATE: AdminAnalyticsScheduledReportRuntimeReadGateState = {
  readerFactoryRuntimeEnabled: false,
  generatedClientRuntimeAccessEnabled: false,
  repositoryReadsEnabled: false,
  repositoryWritesEnabled: false,
  globalKillSwitchValidated: false,
  ownerApprovalPolicyValidated: false,
  dryRunEvidenceValidated: false,
  deliveryExecutionEnabled: false,
  readEndpointEnabled: false,
  managementUiEnabled: false,
  schedulerEnabled: false
};

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

function runtimeReadGateBlockers(state: AdminAnalyticsScheduledReportRuntimeReadGateState): string[] {
  const blockers: string[] = [];
  if (!state.readerFactoryRuntimeEnabled) blockers.push('reader factory runtime disabled');
  if (!state.generatedClientRuntimeAccessEnabled) blockers.push('generated Prisma client runtime access not enabled');
  if (!state.repositoryReadsEnabled) blockers.push('repository reads not enabled');
  if (state.repositoryWritesEnabled) blockers.push('repository writes must remain disabled');
  if (!state.globalKillSwitchValidated) blockers.push('global disable control not validated');
  if (!state.ownerApprovalPolicyValidated) blockers.push('owner approval policy not validated');
  if (!state.dryRunEvidenceValidated) blockers.push('dry-run evidence not validated');
  if (state.deliveryExecutionEnabled) blockers.push('delivery execution must remain disabled');
  if (state.readEndpointEnabled) blockers.push('read endpoint must remain disabled');
  if (state.managementUiEnabled) blockers.push('management UI must remain disabled');
  if (state.schedulerEnabled) blockers.push('scheduler must remain disabled');
  return blockers;
}

export function buildAdminAnalyticsScheduledReportRepositoryReadPlan(
  maxRows = 25
): AdminAnalyticsScheduledReportRepositoryReadPlan {
  const cappedMaxRows = Math.max(0, Math.min(maxRows, 50));
  return {
    tableName: 'AdminAnalyticsScheduledReport',
    generatedClientModelName: 'AdminAnalyticsScheduledReport',
    generatedClientDelegateName: 'adminAnalyticsScheduledReport',
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

export function buildAdminAnalyticsScheduledReportRuntimeReadGateDecision(
  state: Partial<AdminAnalyticsScheduledReportRuntimeReadGateState> = {},
  maxRows = 25
): AdminAnalyticsScheduledReportRuntimeReadGateDecision {
  const resolvedState = { ...DEFAULT_RUNTIME_READ_GATE_STATE, ...state };
  const blockers = runtimeReadGateBlockers(resolvedState);
  const canCreateReader = blockers.length === 0;

  return {
    status: 'repository_read_runtime_gated',
    enabled: canCreateReader,
    canCreateReader,
    generatedClientDelegateName: 'adminAnalyticsScheduledReport',
    generatedClientModelName: 'AdminAnalyticsScheduledReport',
    readArgs: buildAdminAnalyticsScheduledReportRepositoryReadArgs(maxRows),
    state: resolvedState,
    blockers
  };
}

export function buildAdminAnalyticsScheduledReportPrismaReaderFactoryContract(
  maxRows = 25
): AdminAnalyticsScheduledReportPrismaReaderFactoryContract {
  return {
    status: 'prisma_reader_factory_disabled',
    enabled: false,
    factoryAvailable: true,
    factoryRuntimeEnabled: false,
    runtimeReadGateAvailable: true,
    runtimeReadGateDefaultEnabled: false,
    generatedClientDelegateName: 'adminAnalyticsScheduledReport',
    generatedClientModelName: 'AdminAnalyticsScheduledReport',
    generatedClientTypeVisible: true,
    generatedClientRuntimeAccessEnabled: false,
    repositoryReadsEnabled: false,
    repositoryWritesEnabled: false,
    readEndpointEnabled: false,
    managementUiEnabled: false,
    deliveryExecutionEnabled: false,
    readArgs: buildAdminAnalyticsScheduledReportRepositoryReadArgs(maxRows),
    activationBlockers: [
      'reader factory runtime disabled',
      'generated Prisma client runtime access not enabled',
      'Prisma repository access not enabled',
      'read endpoint not configured',
      'management UI not implemented',
      'delivery execution remains disabled',
      'global disable control not validated'
    ]
  };
}

export function createDisabledAdminAnalyticsScheduledReportPrismaReaderFactory(
  maxRows = 25
): AdminAnalyticsScheduledReportPrismaReaderFactory {
  return {
    contract: buildAdminAnalyticsScheduledReportPrismaReaderFactoryContract(maxRows),
    createReader: () => null
  };
}

export function createGatedAdminAnalyticsScheduledReportPrismaReaderFactory(
  delegate: AdminAnalyticsScheduledReportGeneratedClientReadDelegate | null,
  state: Partial<AdminAnalyticsScheduledReportRuntimeReadGateState> = {},
  maxRows = 25
): AdminAnalyticsScheduledReportGatedPrismaReaderFactory {
  const decision = buildAdminAnalyticsScheduledReportRuntimeReadGateDecision(state, maxRows);
  return {
    decision,
    createReader: () => {
      if (!decision.canCreateReader || delegate === null) return null;
      return {
        readScheduledReportMetadata: (args) => delegate.findMany(args)
      };
    }
  };
}

export function buildAdminAnalyticsScheduledReportRepositoryContract(): AdminAnalyticsScheduledReportRepositoryContract {
  const readModel = readModelContract();
  return {
    status: 'repository_read_contract_only',
    enabled: false,
    tableName: readModel.tableName,
    generatedClientModelName: 'AdminAnalyticsScheduledReport',
    generatedClientDelegateName: 'adminAnalyticsScheduledReport',
    generatedClientTypeVisible: true,
    generatedClientRuntimeAccessEnabled: false,
    repositoryReadsEnabled: false,
    repositoryWritesEnabled: false,
    readAdapterAvailable: true,
    readerFactoryAvailable: true,
    readerFactoryRuntimeEnabled: false,
    runtimeReadGateAvailable: true,
    runtimeReadGateDefaultEnabled: false,
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
      'reader factory runtime disabled',
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

export async function readAdminAnalyticsScheduledReportsFromGatedRepository(
  factory: AdminAnalyticsScheduledReportGatedPrismaReaderFactory
): Promise<AdminAnalyticsScheduledReportRepositoryPreview> {
  const reader = factory.createReader();
  if (!factory.decision.canCreateReader || reader === null) {
    return {
      status: 'repository_read_runtime_gated',
      enabled: false,
      repositoryReadsEnabled: false,
      deliveryExecutionEnabled: false,
      rows: [],
      omittedRowCount: 0
    };
  }

  const rows = await reader.readScheduledReportMetadata(factory.decision.readArgs);
  const normalized = normalizeRows(rows, factory.decision.readArgs.take);

  return {
    status: 'repository_read_runtime_gated',
    enabled: true,
    repositoryReadsEnabled: true,
    deliveryExecutionEnabled: false,
    rows: normalized,
    omittedRowCount: Math.max(0, rows.length - normalized.length)
  };
}
