export type AdminAnalyticsScheduledReportPrismaSchemaMappingStatus = 'prisma_schema_mapping_contract_only';

export type AdminAnalyticsScheduledReportPrismaSchemaField = {
  name: string;
  prismaType: string;
  required: boolean;
  defaultValue?: string;
  description: string;
};

export type AdminAnalyticsScheduledReportPrismaSchemaIndex = {
  name: string;
  fields: string[];
  unique: boolean;
};

export type AdminAnalyticsScheduledReportPrismaSchemaMapping = {
  status: AdminAnalyticsScheduledReportPrismaSchemaMappingStatus;
  modelName: 'AdminAnalyticsScheduledReport';
  tableName: 'AdminAnalyticsScheduledReport';
  mappedInSchemaPrisma: boolean;
  generatedClientAccessEnabled: boolean;
  repositoryReadsEnabled: boolean;
  repositoryWritesEnabled: boolean;
  readEndpointEnabled: boolean;
  managementUiEnabled: boolean;
  scheduleActivationEnabled: boolean;
  deliveryExecutionEnabled: boolean;
  fields: AdminAnalyticsScheduledReportPrismaSchemaField[];
  indexes: AdminAnalyticsScheduledReportPrismaSchemaIndex[];
  jsonFields: string[];
  activationBlockers: string[];
  modelBlock: string;
};

export const ADMIN_ANALYTICS_SCHEDULED_REPORT_PRISMA_MODEL_BLOCK = `model AdminAnalyticsScheduledReport {
  id                String   @id @default(cuid())
  reportKey         String
  label             String
  description       String?
  cadence           String
  rangeMode         String
  rangeQuery        String
  reportTypes       Json     @default("[\\\"business\\\", \\\"site\\\"]")
  ownerApproved     Boolean  @default(false)
  isActive          Boolean  @default(false)
  deliveryEnabled   Boolean  @default(false)
  deliveryChannel   String?
  lastDryRunAt      DateTime?
  lastDryRunSummary Json     @default("{}")
  createdByRole     String   @default("owner")
  createdByLabel    String?
  metadata          Json     @default("{}")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @default(now()) @updatedAt

  @@unique([reportKey, cadence])
  @@index([cadence, isActive])
  @@index([ownerApproved, isActive])
  @@index([deliveryEnabled, isActive])
  @@index([createdAt])
}`;

const FIELDS: AdminAnalyticsScheduledReportPrismaSchemaField[] = [
  {
    name: 'id',
    prismaType: 'String',
    required: true,
    defaultValue: 'cuid()',
    description: 'Primary key for the future scheduled-report metadata row.'
  },
  {
    name: 'reportKey',
    prismaType: 'String',
    required: true,
    description: 'Stable owner-approved report configuration key.'
  },
  {
    name: 'label',
    prismaType: 'String',
    required: true,
    description: 'Owner-facing report label.'
  },
  {
    name: 'description',
    prismaType: 'String?',
    required: false,
    description: 'Optional owner-facing report purpose.'
  },
  {
    name: 'cadence',
    prismaType: 'String',
    required: true,
    description: 'Approved cadence value, currently weekly or monthly.'
  },
  {
    name: 'rangeMode',
    prismaType: 'String',
    required: true,
    description: 'Resolved analytics range mode copied from the selected report window.'
  },
  {
    name: 'rangeQuery',
    prismaType: 'String',
    required: true,
    description: 'Selected analytics range query used to rebuild aggregate report export links.'
  },
  {
    name: 'reportTypes',
    prismaType: 'Json',
    required: true,
    defaultValue: '["business", "site"]',
    description: 'Aggregate Business/Site report types only.'
  },
  {
    name: 'ownerApproved',
    prismaType: 'Boolean',
    required: true,
    defaultValue: 'false',
    description: 'Future owner approval gate; defaults to disabled.'
  },
  {
    name: 'isActive',
    prismaType: 'Boolean',
    required: true,
    defaultValue: 'false',
    description: 'Future activation gate; defaults to disabled.'
  },
  {
    name: 'deliveryEnabled',
    prismaType: 'Boolean',
    required: true,
    defaultValue: 'false',
    description: 'Future delivery gate; defaults to disabled.'
  },
  {
    name: 'deliveryChannel',
    prismaType: 'String?',
    required: false,
    description: 'Optional future delivery-channel label; not active in this foundation.'
  },
  {
    name: 'lastDryRunAt',
    prismaType: 'DateTime?',
    required: false,
    description: 'Future dry-run evidence timestamp.'
  },
  {
    name: 'lastDryRunSummary',
    prismaType: 'Json',
    required: true,
    defaultValue: '{}',
    description: 'Future dry-run evidence summary metadata only.'
  },
  {
    name: 'createdByRole',
    prismaType: 'String',
    required: true,
    defaultValue: 'owner',
    description: 'Role label for the future owner-managed configuration.'
  },
  {
    name: 'createdByLabel',
    prismaType: 'String?',
    required: false,
    description: 'Optional non-sensitive creator label.'
  },
  {
    name: 'metadata',
    prismaType: 'Json',
    required: true,
    defaultValue: '{}',
    description: 'Metadata-only extension object; report payload rows are not stored here.'
  },
  {
    name: 'createdAt',
    prismaType: 'DateTime',
    required: true,
    defaultValue: 'now()',
    description: 'Creation timestamp.'
  },
  {
    name: 'updatedAt',
    prismaType: 'DateTime',
    required: true,
    defaultValue: 'now() @updatedAt',
    description: 'Update timestamp for future metadata edits.'
  }
];

const INDEXES: AdminAnalyticsScheduledReportPrismaSchemaIndex[] = [
  { name: 'AdminAnalyticsScheduledReport_reportKey_cadence_key', fields: ['reportKey', 'cadence'], unique: true },
  { name: 'AdminAnalyticsScheduledReport_cadence_isActive_idx', fields: ['cadence', 'isActive'], unique: false },
  { name: 'AdminAnalyticsScheduledReport_ownerApproved_isActive_idx', fields: ['ownerApproved', 'isActive'], unique: false },
  { name: 'AdminAnalyticsScheduledReport_deliveryEnabled_isActive_idx', fields: ['deliveryEnabled', 'isActive'], unique: false },
  { name: 'AdminAnalyticsScheduledReport_createdAt_idx', fields: ['createdAt'], unique: false }
];

export function buildAdminAnalyticsScheduledReportPrismaSchemaMapping(): AdminAnalyticsScheduledReportPrismaSchemaMapping {
  return {
    status: 'prisma_schema_mapping_contract_only',
    modelName: 'AdminAnalyticsScheduledReport',
    tableName: 'AdminAnalyticsScheduledReport',
    mappedInSchemaPrisma: false,
    generatedClientAccessEnabled: false,
    repositoryReadsEnabled: false,
    repositoryWritesEnabled: false,
    readEndpointEnabled: false,
    managementUiEnabled: false,
    scheduleActivationEnabled: false,
    deliveryExecutionEnabled: false,
    fields: FIELDS.map((field) => ({ ...field })),
    indexes: INDEXES.map((index) => ({ ...index, fields: [...index.fields] })),
    jsonFields: ['reportTypes', 'lastDryRunSummary', 'metadata'],
    activationBlockers: [
      'schema.prisma model block not applied',
      'generated Prisma client access not enabled',
      'repository wiring not enabled',
      'read endpoint not configured',
      'management UI not implemented',
      'delivery execution remains disabled',
      'global disable control not validated'
    ],
    modelBlock: ADMIN_ANALYTICS_SCHEDULED_REPORT_PRISMA_MODEL_BLOCK
  };
}
