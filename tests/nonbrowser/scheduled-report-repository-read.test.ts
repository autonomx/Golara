import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  ADMIN_ANALYTICS_SCHEDULED_REPORT_PRISMA_MODEL_BLOCK,
  buildAdminAnalyticsScheduledReportPrismaSchemaMapping
} from '../../lib/analytics/admin-analytics-scheduled-report-prisma-schema';
import {
  buildAdminAnalyticsScheduledReportPrismaReaderFactoryContract,
  buildAdminAnalyticsScheduledReportRepositoryContract,
  buildAdminAnalyticsScheduledReportRepositoryReadArgs,
  createDisabledAdminAnalyticsScheduledReportPrismaReaderFactory,
  readAdminAnalyticsScheduledReportsFromRepository,
  type AdminAnalyticsScheduledReportRepositoryReadArgs
} from '../../lib/analytics/admin-analytics-scheduled-report-repository';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function migrationSource() {
  return readdirSync('prisma/migrations')
    .map((dir) => join('prisma/migrations', dir, 'migration.sql').replace(/\\/g, '/'))
    .map(source)
    .join('\n');
}

function validRow() {
  return {
    id: 'report_1',
    reportKey: 'weekly-owner-analytics-config',
    label: 'Weekly owner analytics configuration',
    description: 'Owner report schedule',
    cadence: 'weekly',
    rangeMode: 'custom',
    rangeQuery: 'start=2026-06-01&end=2026-06-15',
    reportTypes: ['business', 'site', 'site'],
    ownerApproved: true,
    isActive: true,
    deliveryEnabled: false,
    lastDryRunSummary: { checkedAt: '2026-06-15T00:00:00.000Z' },
    createdAt: new Date('2026-06-15T00:00:00.000Z'),
    updatedAt: new Date('2026-06-15T00:00:00.000Z')
  };
}

function normalizeSchema(sourceText: string) {
  return sourceText.trim().replace(/\r\n/g, '\n');
}

function prismaModelBlock(schemaSource: string, modelName: string) {
  const match = schemaSource.match(new RegExp(`model ${modelName} \\{[\\s\\S]*?\\r?\\n\\}`));
  assert.ok(match, `schema.prisma should contain model ${modelName}`);
  return match[0];
}

function sourceTree(directory: string): string {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = join(directory, entry.name);
      if (entry.isDirectory()) return sourceTree(entryPath);
      return /\.(?:ts|tsx)$/.test(entry.name) ? [source(entryPath)] : [];
    })
    .join('\n');
}

function runPrismaSchemaMappingChecks() {
  const mapping = buildAdminAnalyticsScheduledReportPrismaSchemaMapping();
  assert.equal(mapping.status, 'prisma_schema_mapping_contract_only');
  assert.equal(mapping.modelName, 'AdminAnalyticsScheduledReport');
  assert.equal(mapping.tableName, 'AdminAnalyticsScheduledReport');
  assert.equal(mapping.mappedInSchemaPrisma, true);
  assert.equal(mapping.generatedClientTypeVisible, true);
  assert.equal(mapping.generatedClientRuntimeAccessEnabled, false);
  assert.equal(mapping.readerFactoryAvailable, true);
  assert.equal(mapping.readerFactoryRuntimeEnabled, false);
  assert.equal(mapping.repositoryReadsEnabled, false);
  assert.equal(mapping.repositoryWritesEnabled, false);
  assert.equal(mapping.readEndpointEnabled, false);
  assert.equal(mapping.managementUiEnabled, false);
  assert.equal(mapping.scheduleActivationEnabled, false);
  assert.equal(mapping.deliveryExecutionEnabled, false);
  assert.deepEqual(mapping.jsonFields, ['reportTypes', 'lastDryRunSummary', 'metadata']);
  assert.ok(!mapping.activationBlockers.includes('schema.prisma model block not applied'));
  assert.ok(mapping.activationBlockers.includes('reader factory runtime disabled'));
  assert.ok(mapping.activationBlockers.includes('generated Prisma client runtime access not enabled'));

  const fields = new Map(mapping.fields.map((field) => [field.name, field]));
  assert.equal(fields.get('reportKey')?.prismaType, 'String');
  assert.equal(fields.get('rangeQuery')?.required, true);
  assert.equal(fields.get('reportTypes')?.prismaType, 'Json');
  assert.equal(fields.get('reportTypes')?.defaultValue, '["business", "site"]');
  assert.equal(fields.get('ownerApproved')?.defaultValue, 'false');
  assert.equal(fields.get('isActive')?.defaultValue, 'false');
  assert.equal(fields.get('deliveryEnabled')?.defaultValue, 'false');
  assert.equal(fields.get('lastDryRunSummary')?.prismaType, 'Json');
  assert.equal(fields.get('metadata')?.prismaType, 'Json');

  assert.ok(mapping.indexes.some((index) => index.name === 'AdminAnalyticsScheduledReport_reportKey_cadence_key' && index.unique));
  assert.ok(mapping.indexes.some((index) => index.name === 'AdminAnalyticsScheduledReport_ownerApproved_isActive_idx'));
  assert.ok(mapping.indexes.some((index) => index.name === 'AdminAnalyticsScheduledReport_deliveryEnabled_isActive_idx'));

  assert.match(ADMIN_ANALYTICS_SCHEDULED_REPORT_PRISMA_MODEL_BLOCK, /model AdminAnalyticsScheduledReport/);
  assert.match(ADMIN_ANALYTICS_SCHEDULED_REPORT_PRISMA_MODEL_BLOCK, /reportTypes\s+Json\s+@default/);
  assert.match(ADMIN_ANALYTICS_SCHEDULED_REPORT_PRISMA_MODEL_BLOCK, /ownerApproved\s+Boolean\s+@default\(false\)/);
  assert.match(ADMIN_ANALYTICS_SCHEDULED_REPORT_PRISMA_MODEL_BLOCK, /deliveryEnabled\s+Boolean\s+@default\(false\)/);
  assert.match(ADMIN_ANALYTICS_SCHEDULED_REPORT_PRISMA_MODEL_BLOCK, /@@unique\(\[reportKey, cadence\]\)/);
  assert.match(ADMIN_ANALYTICS_SCHEDULED_REPORT_PRISMA_MODEL_BLOCK, /@@index\(\[ownerApproved, isActive\]\)/);
  assert.match(ADMIN_ANALYTICS_SCHEDULED_REPORT_PRISMA_MODEL_BLOCK, /@@index\(\[deliveryEnabled, isActive\]\)/);

  const migrations = migrationSource();
  assert.match(migrations, /CREATE TABLE "AdminAnalyticsScheduledReport"/);
  for (const field of mapping.fields) {
    assert.match(migrations, new RegExp(`"${field.name}"`), `migration should include ${field.name}`);
  }
  for (const index of mapping.indexes) {
    assert.match(migrations, new RegExp(index.name), `migration should include ${index.name}`);
  }

  const schemaSource = source('prisma/schema.prisma');
  assert.match(schemaSource, /model AdminAnalyticsScheduledReport\s+\{/);

  const schemaFragment = source('prisma/schema.admin-analytics-scheduled-report.prisma');
  assert.match(schemaFragment, /model AdminAnalyticsScheduledReport\s+\{/);
  assert.equal(
    normalizeSchema(schemaFragment),
    normalizeSchema(ADMIN_ANALYTICS_SCHEDULED_REPORT_PRISMA_MODEL_BLOCK),
    'schema fragment should exactly match the guarded Prisma model block'
  );
  assert.equal(
    normalizeSchema(prismaModelBlock(schemaSource, 'AdminAnalyticsScheduledReport')),
    normalizeSchema(schemaFragment),
    'schema.prisma model should exactly match the checked schema fragment'
  );
  assert.match(schemaFragment, /@@unique\(\[reportKey, cadence\]\)/);
  assert.match(schemaFragment, /@@index\(\[ownerApproved, isActive\]\)/);
  assert.match(schemaFragment, /@@index\(\[deliveryEnabled, isActive\]\)/);

  const helperSource = source('lib/analytics/admin-analytics-scheduled-report-prisma-schema.ts');
  assert.match(helperSource, /prisma_schema_mapping_contract_only/);
  assert.match(helperSource, /mappedInSchemaPrisma: true/);
  assert.match(helperSource, /generatedClientTypeVisible: true/);
  assert.match(helperSource, /generatedClientRuntimeAccessEnabled: false/);
  assert.match(helperSource, /readerFactoryAvailable: true/);
  assert.match(helperSource, /readerFactoryRuntimeEnabled: false/);
  assert.match(helperSource, /repositoryReadsEnabled: false/);
  assert.match(helperSource, /repositoryWritesEnabled: false/);
  assert.match(helperSource, /deliveryExecutionEnabled: false/);
  assert.doesNotMatch(helperSource, /PrismaClient|prisma\.|\$queryRaw|findMany|create\(|update\(|upsert\(|delete\(|fetch\(|sendMail|transport|cron|schedule\.create|setInterval|setTimeout|\bPOST\b|\bPUT\b|\bPATCH\b|\bDELETE\b|localStorage|sessionStorage|cookies\(/);

  const scheduledReportContractSource = [
    helperSource,
    source('lib/analytics/admin-analytics-scheduled-report-repository.ts'),
    source('lib/analytics/admin-analytics-scheduled-report-read-model.ts'),
    source('lib/analytics/admin-analytics-scheduled-report-storage.ts'),
    source('lib/analytics/admin-analytics-scheduled-reports.ts')
  ].join('\n');
  assert.doesNotMatch(
    scheduledReportContractSource,
    /PrismaClient|prisma\.|\$queryRaw|findMany|create\(|update\(|upsert\(|delete\(|fetch\(|sendMail|transport|cron|schedule\.create|setInterval|setTimeout/,
    'scheduled-report contracts should not add database, scheduler, timer, background, or delivery execution'
  );

  const appSource = sourceTree('app');
  const componentSource = sourceTree('components');
  const activeScheduledReportAccess = /AdminAnalyticsScheduledReport|admin-analytics-scheduled-report-repository|readAdminAnalyticsScheduledReportsFromRepository/;
  assert.doesNotMatch(appSource, activeScheduledReportAccess, 'no scheduled-report read/save/update/remove endpoint should be active');
  assert.doesNotMatch(componentSource, activeScheduledReportAccess, 'no scheduled-report management UI should be active');
}

export async function runScheduledReportRepositoryReadTests() {
  runPrismaSchemaMappingChecks();

  const contract = buildAdminAnalyticsScheduledReportRepositoryContract();
  assert.equal(contract.status, 'repository_read_contract_only');
  assert.equal(contract.enabled, false);
  assert.equal(contract.generatedClientModelName, 'AdminAnalyticsScheduledReport');
  assert.equal(contract.generatedClientDelegateName, 'adminAnalyticsScheduledReport');
  assert.equal(contract.generatedClientTypeVisible, true);
  assert.equal(contract.generatedClientRuntimeAccessEnabled, false);
  assert.equal(contract.repositoryReadsEnabled, false);
  assert.equal(contract.repositoryWritesEnabled, false);
  assert.equal(contract.readAdapterAvailable, true);
  assert.equal(contract.readerFactoryAvailable, true);
  assert.equal(contract.readerFactoryRuntimeEnabled, false);
  assert.equal(contract.readEndpointEnabled, false);
  assert.equal(contract.managementUiEnabled, false);
  assert.equal(contract.deliveryExecutionEnabled, false);
  assert.ok(contract.activationBlockers.includes('reader factory runtime disabled'));
  assert.ok(contract.readPlan.selectFields.includes('rangeQuery'));
  assert.ok(contract.readPlan.selectFields.includes('reportTypes'));
  assert.equal(contract.readPlan.generatedClientModelName, 'AdminAnalyticsScheduledReport');
  assert.equal(contract.readPlan.generatedClientDelegateName, 'adminAnalyticsScheduledReport');
  assert.ok(contract.readPlan.requiredFilters.some((filter) => filter.field === 'ownerApproved' && filter.expected === true));
  assert.ok(contract.readPlan.requiredFilters.some((filter) => filter.field === 'isActive' && filter.expected === true));
  assert.ok(contract.readPlan.requiredFilters.some((filter) => filter.field === 'deliveryEnabled' && filter.expected === false));

  const factoryContract = buildAdminAnalyticsScheduledReportPrismaReaderFactoryContract(500);
  assert.equal(factoryContract.status, 'prisma_reader_factory_disabled');
  assert.equal(factoryContract.enabled, false);
  assert.equal(factoryContract.factoryAvailable, true);
  assert.equal(factoryContract.factoryRuntimeEnabled, false);
  assert.equal(factoryContract.generatedClientDelegateName, 'adminAnalyticsScheduledReport');
  assert.equal(factoryContract.generatedClientModelName, 'AdminAnalyticsScheduledReport');
  assert.equal(factoryContract.generatedClientTypeVisible, true);
  assert.equal(factoryContract.generatedClientRuntimeAccessEnabled, false);
  assert.equal(factoryContract.repositoryReadsEnabled, false);
  assert.equal(factoryContract.repositoryWritesEnabled, false);
  assert.equal(factoryContract.readEndpointEnabled, false);
  assert.equal(factoryContract.managementUiEnabled, false);
  assert.equal(factoryContract.deliveryExecutionEnabled, false);
  assert.equal(factoryContract.readArgs.take, 50);
  assert.deepEqual(factoryContract.readArgs.where, { ownerApproved: true, isActive: true, deliveryEnabled: false });
  assert.ok(factoryContract.activationBlockers.includes('reader factory runtime disabled'));

  const disabledFactory = createDisabledAdminAnalyticsScheduledReportPrismaReaderFactory(5);
  assert.equal(disabledFactory.contract.status, 'prisma_reader_factory_disabled');
  assert.equal(disabledFactory.contract.factoryRuntimeEnabled, false);
  assert.equal(disabledFactory.contract.readArgs.take, 5);
  assert.equal(disabledFactory.createReader(), null);

  const args = buildAdminAnalyticsScheduledReportRepositoryReadArgs(500);
  assert.equal(args.take, 50);
  assert.deepEqual(args.where, { ownerApproved: true, isActive: true, deliveryEnabled: false });
  assert.deepEqual(args.orderBy, [{ cadence: 'asc' }, { reportKey: 'asc' }]);
  assert.equal(args.select.id, true);
  assert.equal(args.select.reportKey, true);
  assert.equal(args.select.rangeQuery, true);
  assert.equal(args.select.reportTypes, true);
  assert.equal(args.select.lastDryRunSummary, true);
  assert.equal(args.select.deliveryEnabled, true);
  assert.equal(args.select.createdAt, true);
  assert.equal(args.select.updatedAt, true);

  let capturedArgs: AdminAnalyticsScheduledReportRepositoryReadArgs | undefined;
  const preview = await readAdminAnalyticsScheduledReportsFromRepository({
    readScheduledReportMetadata: async (readArgs) => {
      capturedArgs = readArgs;
      return [
        validRow(),
        { ...validRow(), id: 'report_2', cadence: 'daily' },
        { ...validRow(), id: 'report_3', reportTypes: ['unsafe'] }
      ];
    }
  }, 500);

  assert.deepEqual(capturedArgs, args);
  assert.equal(preview.status, 'repository_read_adapter_only');
  assert.equal(preview.enabled, false);
  assert.equal(preview.repositoryReadsEnabled, false);
  assert.equal(preview.deliveryExecutionEnabled, false);
  assert.equal(preview.rows.length, 1);
  assert.equal(preview.rows[0].activeForOperators, false);
  assert.equal(preview.rows[0].deliveryReady, false);
  assert.deepEqual(preview.rows[0].reportTypes, ['business', 'site']);
  assert.equal(preview.omittedRowCount, 2);

  const repositorySource = source('lib/analytics/admin-analytics-scheduled-report-repository.ts');
  assert.match(repositorySource, /import type \{ AdminAnalyticsScheduledReport as PrismaAdminAnalyticsScheduledReport \} from '@prisma\/client';/);
  assert.match(repositorySource, /AdminAnalyticsScheduledReportGeneratedClientReadRow/);
  assert.match(repositorySource, /generatedClientDelegateName: 'adminAnalyticsScheduledReport'/);
  assert.match(repositorySource, /generatedClientTypeVisible: true/);
  assert.match(repositorySource, /generatedClientRuntimeAccessEnabled: false/);
  assert.match(repositorySource, /readAdapterAvailable: true/);
  assert.match(repositorySource, /readerFactoryAvailable: true/);
  assert.match(repositorySource, /readerFactoryRuntimeEnabled: false/);
  assert.match(repositorySource, /prisma_reader_factory_disabled/);
  assert.match(repositorySource, /createReader: \(\) => null/);
  assert.match(repositorySource, /readScheduledReportMetadata/);
  assert.match(repositorySource, /ownerApproved: true/);
  assert.match(repositorySource, /isActive: true/);
  assert.match(repositorySource, /deliveryEnabled: false/);
  assert.match(repositorySource, /repositoryWritesEnabled: false/);
  assert.match(repositorySource, /readEndpointEnabled: false/);
  assert.match(repositorySource, /managementUiEnabled: false/);
  assert.match(repositorySource, /deliveryExecutionEnabled: false/);
  assert.doesNotMatch(repositorySource, /PrismaClient|prisma\.|\$queryRaw|findMany|create\(|update\(|upsert\(|delete\(|fetch\(|sendMail|transport|cron|schedule\.create|setInterval|setTimeout|\bPOST\b|\bPUT\b|\bPATCH\b|\bDELETE\b|localStorage|sessionStorage|cookies\(/);
  console.log('scheduled-report-repository-read.test.ts passed');
}
