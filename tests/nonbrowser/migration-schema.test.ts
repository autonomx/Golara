import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildAdminAnalyticsSavedViewReadModelContract,
  buildAdminAnalyticsSavedViewReadModelPreview,
  normalizeAdminAnalyticsSavedViewReadRow
} from '../../lib/analytics/admin-analytics-saved-view-read-model';
import { buildAdminAnalyticsSavedViewStorageContract } from '../../lib/analytics/admin-analytics-saved-view-storage';
import { buildAdminAnalyticsScheduledReportStorageContract } from '../../lib/analytics/admin-analytics-scheduled-report-storage';
import { withIsolatedPrisma } from '../utils/isolated-test-db';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function migrationFiles() {
  return readdirSync('prisma/migrations')
    .map((dir) => join('prisma/migrations', dir, 'migration.sql').replace(/\\/g, '/'))
    .filter((path) => existsSync(path))
    .sort();
}

function runMigrationSourceCoverageTests() {
  const content = migrationFiles().map(source).join('\n');
  const tables = [
    'ProductVariant',
    'ProductVariantLocationStock',
    'CheckoutOrderNotificationAction',
    'StoreSetting',
    'StorefrontNavigationMenu',
    'StorefrontNavigationMenuItem',
    'PaymentProviderSetting',
    'NotificationProviderSetting',
    'WebhookConfiguration',
    'WebhookEventLog',
    'IntegrationAppRegistry',
    'ApiTokenCredential',
    'DashboardExtensionMountPoint',
    'ImportExportJob',
    'AdminAnalyticsSavedView',
    'AdminAnalyticsScheduledReport'
  ];
  for (const table of tables) assert.match(content, new RegExp(`"${table}"`), `migration SQL should mention ${table}`);
}

function runAdminAnalyticsSavedViewStorageContractTests() {
  const contract = buildAdminAnalyticsSavedViewStorageContract();
  assert.equal(contract.status, 'schema_foundation_only');
  assert.equal(contract.tableName, 'AdminAnalyticsSavedView');
  assert.equal(contract.enabled, false);
  assert.equal(contract.schemaMigrationAdded, true);
  assert.equal(contract.prismaRepositoryEnabled, false);
  assert.equal(contract.saveEndpointEnabled, false);
  assert.equal(contract.updateEndpointEnabled, false);
  assert.equal(contract.removeEndpointEnabled, false);
  assert.equal(contract.managementUiEnabled, false);
  assert.equal(contract.ownerApprovalRequired, true);
  assert.equal(contract.ownerApprovalRecorded, false);
  assert.deepEqual(contract.allowedScopes, ['owner-private', 'staff-shared', 'store-wide-owner-managed']);
  assert.deepEqual(contract.allowedAudiences, ['owner', 'staff']);
  assert.ok(contract.persistedFields.some((field) => field.name === 'rangeQuery' && field.required && field.persisted));
  assert.ok(contract.persistedFields.some((field) => field.name === 'sectionAnchors' && field.required && field.persisted));
  assert.ok(contract.persistedFields.some((field) => field.name === 'ownerApproved' && field.persisted));
  assert.ok(contract.persistedFields.some((field) => field.name === 'isActive' && field.persisted));
  assert.ok(contract.blockedPayloadFields.includes('analytics rows'));
  assert.ok(contract.blockedPayloadFields.includes('customer rows'));
  assert.ok(contract.blockedPayloadFields.includes('raw event rows'));
  assert.ok(contract.blockedPayloadFields.includes('customer contact fields'));
  assert.ok(contract.activationBlockers.includes('repository not implemented'));
  assert.ok(contract.activationBlockers.includes('save endpoint not configured'));
  assert.ok(contract.activationBlockers.includes('role policy enforcement not validated'));

  const helperSource = source('lib/analytics/admin-analytics-saved-view-storage.ts');
  assert.match(helperSource, /schema_foundation_only/);
  assert.match(helperSource, /tableName: 'AdminAnalyticsSavedView'/);
  assert.match(helperSource, /schemaMigrationAdded: true/);
  assert.match(helperSource, /prismaRepositoryEnabled: false/);
  assert.match(helperSource, /saveEndpointEnabled: false/);
  assert.match(helperSource, /updateEndpointEnabled: false/);
  assert.match(helperSource, /removeEndpointEnabled: false/);
  assert.match(helperSource, /managementUiEnabled: false/);
  assert.doesNotMatch(helperSource, /PrismaClient|prisma\.|create\(|update\(|upsert\(|delete\(|fetch\(|\bPOST\b|\bPUT\b|\bPATCH\b|\bDELETE\b/);

  const migrationSource = migrationFiles().map(source).join('\n');
  assert.match(migrationSource, /CREATE TABLE "AdminAnalyticsSavedView"/);
  assert.match(migrationSource, /"rangeQuery" TEXT NOT NULL/);
  assert.match(migrationSource, /"sectionAnchors" JSONB NOT NULL DEFAULT '\[\]'/);
  assert.match(migrationSource, /"ownerApproved" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migrationSource, /"isActive" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migrationSource, /"AdminAnalyticsSavedView_viewKey_scope_key"/);
}

function runAdminAnalyticsScheduledReportStorageContractTests() {
  const contract = buildAdminAnalyticsScheduledReportStorageContract();
  assert.equal(contract.status, 'schema_foundation_only');
  assert.equal(contract.tableName, 'AdminAnalyticsScheduledReport');
  assert.equal(contract.enabled, false);
  assert.equal(contract.schemaMigrationAdded, true);
  assert.equal(contract.prismaRepositoryEnabled, false);
  assert.equal(contract.readEndpointEnabled, false);
  assert.equal(contract.saveEndpointEnabled, false);
  assert.equal(contract.updateEndpointEnabled, false);
  assert.equal(contract.removeEndpointEnabled, false);
  assert.equal(contract.managementUiEnabled, false);
  assert.equal(contract.deliveryEnabled, false);
  assert.equal(contract.scheduleActivationEnabled, false);
  assert.equal(contract.ownerApprovalRequired, true);
  assert.equal(contract.ownerApprovalRecorded, false);
  assert.equal(contract.dryRunEvidenceRequired, true);
  assert.equal(contract.dryRunEvidenceRecorded, false);
  assert.deepEqual(contract.allowedCadences, ['weekly', 'monthly']);
  assert.deepEqual(contract.allowedReportTypes, ['business', 'site']);
  assert.ok(contract.persistedFields.some((field) => field.name === 'rangeQuery' && field.required && field.persisted));
  assert.ok(contract.persistedFields.some((field) => field.name === 'reportTypes' && field.required && field.persisted));
  assert.ok(contract.persistedFields.some((field) => field.name === 'ownerApproved' && field.persisted));
  assert.ok(contract.persistedFields.some((field) => field.name === 'isActive' && field.persisted));
  assert.ok(contract.persistedFields.some((field) => field.name === 'deliveryEnabled' && field.persisted));
  assert.ok(contract.blockedPayloadFields.includes('analytics rows'));
  assert.ok(contract.blockedPayloadFields.includes('customer rows'));
  assert.ok(contract.blockedPayloadFields.includes('raw event rows'));
  assert.ok(contract.blockedPayloadFields.includes('delivery recipient lists'));
  assert.ok(contract.activationBlockers.includes('repository not implemented'));
  assert.ok(contract.activationBlockers.includes('delivery channel not configured'));
  assert.ok(contract.activationBlockers.includes('global disable control not validated'));

  const helperSource = source('lib/analytics/admin-analytics-scheduled-report-storage.ts');
  assert.match(helperSource, /schema_foundation_only/);
  assert.match(helperSource, /tableName: 'AdminAnalyticsScheduledReport'/);
  assert.match(helperSource, /schemaMigrationAdded: true/);
  assert.match(helperSource, /prismaRepositoryEnabled: false/);
  assert.match(helperSource, /readEndpointEnabled: false/);
  assert.match(helperSource, /saveEndpointEnabled: false/);
  assert.match(helperSource, /updateEndpointEnabled: false/);
  assert.match(helperSource, /removeEndpointEnabled: false/);
  assert.match(helperSource, /managementUiEnabled: false/);
  assert.match(helperSource, /deliveryEnabled: false/);
  assert.match(helperSource, /scheduleActivationEnabled: false/);
  assert.doesNotMatch(helperSource, /PrismaClient|prisma\.|\$queryRaw|create\(|update\(|upsert\(|delete\(|fetch\(|sendMail|transport|cron|schedule\.create|setInterval|setTimeout|\bPOST\b|\bPUT\b|\bPATCH\b|\bDELETE\b/);

  const migrationSource = migrationFiles().map(source).join('\n');
  assert.match(migrationSource, /CREATE TABLE "AdminAnalyticsScheduledReport"/);
  assert.match(migrationSource, /"rangeQuery" TEXT NOT NULL/);
  assert.match(migrationSource, /"reportTypes" JSONB NOT NULL DEFAULT '\["business", "site"\]'/);
  assert.match(migrationSource, /"ownerApproved" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migrationSource, /"isActive" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migrationSource, /"deliveryEnabled" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migrationSource, /"lastDryRunSummary" JSONB NOT NULL DEFAULT '\{\}'/);
  assert.match(migrationSource, /"AdminAnalyticsScheduledReport_reportKey_cadence_key"/);
}

function runAdminAnalyticsSavedViewReadModelTests() {
  const readContract = buildAdminAnalyticsSavedViewReadModelContract();
  assert.equal(readContract.status, 'read_model_foundation_only');
  assert.equal(readContract.enabled, false);
  assert.equal(readContract.tableName, 'AdminAnalyticsSavedView');
  assert.equal(readContract.repositoryReadsEnabled, false);
  assert.equal(readContract.readEndpointEnabled, false);
  assert.equal(readContract.managementUiEnabled, false);
  assert.equal(readContract.requiresOwnerApprovalFilter, true);
  assert.equal(readContract.requiresActiveFlagFilter, true);
  assert.equal(readContract.returnsMetadataOnly, true);
  assert.deepEqual(readContract.allowedScopes, ['owner-private', 'staff-shared', 'store-wide-owner-managed']);
  assert.deepEqual(readContract.allowedAudiences, ['owner', 'staff']);
  assert.ok(readContract.outputFields.includes('rangeQuery'));
  assert.ok(readContract.outputFields.includes('sectionAnchors'));
  assert.ok(readContract.blockedOutputFields.includes('metricRows'));
  assert.ok(readContract.blockedOutputFields.includes('customerRows'));
  assert.ok(readContract.activationBlockers.includes('read endpoint not configured'));

  const validRow = {
    id: 'view_1',
    viewKey: 'business-performance',
    label: 'Business performance view',
    description: 'Owner dashboard view',
    scope: 'owner-private',
    audience: 'owner',
    rangeMode: 'custom',
    rangeQuery: 'start=2026-06-01&end=2026-06-15',
    sectionAnchors: ['#order-analytics', '#business-analytics-charts', '#order-analytics', 'bad-anchor'],
    ownerApproved: true,
    isActive: true
  };
  const dto = normalizeAdminAnalyticsSavedViewReadRow(validRow);
  assert.ok(dto);
  assert.equal(dto.activeForOperators, false);
  assert.deepEqual(dto.sectionAnchors, ['#order-analytics', '#business-analytics-charts']);
  assert.equal(dto.firstSectionAnchor, '#order-analytics');
  assert.equal(dto.rangeQuery, 'start=2026-06-01&end=2026-06-15');

  const preview = buildAdminAnalyticsSavedViewReadModelPreview([
    validRow,
    { ...validRow, id: '', viewKey: 'invalid-view' },
    { ...validRow, id: 'view_2', scope: 'unknown-scope' }
  ]);
  assert.equal(preview.status, 'read_model_foundation_only');
  assert.equal(preview.enabled, false);
  assert.equal(preview.repositoryReadsEnabled, false);
  assert.equal(preview.rows.length, 1);
  assert.equal(preview.omittedRowCount, 2);

  const readModelSource = source('lib/analytics/admin-analytics-saved-view-read-model.ts');
  assert.match(readModelSource, /read_model_foundation_only/);
  assert.match(readModelSource, /repositoryReadsEnabled: false/);
  assert.match(readModelSource, /readEndpointEnabled: false/);
  assert.match(readModelSource, /managementUiEnabled: false/);
  assert.match(readModelSource, /returnsMetadataOnly: true/);
  assert.match(readModelSource, /activeForOperators: false/);
  assert.match(readModelSource, /normalizeAdminAnalyticsSavedViewReadRow/);
  assert.doesNotMatch(readModelSource, /PrismaClient|prisma\.|\$queryRaw|create\(|update\(|upsert\(|delete\(|fetch\(|\bPOST\b|\bPUT\b|\bPATCH\b|\bDELETE\b|localStorage|sessionStorage|cookies\(/);
}

async function runOptionalLiveSchemaChecks() {
  await withIsolatedPrisma(async (client) => {
    const rows = await client.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    const names = new Set(rows.map((row) => row.table_name));
    for (const table of ['Product', 'Category', 'StoreSetting', 'StorefrontNavigationMenu', 'ImportExportJob']) {
      assert.ok(names.has(table), `TEST_DATABASE_URL schema should include ${table}`);
    }
  });
}

export async function runMigrationSchemaTests() {
  runMigrationSourceCoverageTests();
  runAdminAnalyticsSavedViewStorageContractTests();
  runAdminAnalyticsSavedViewReadModelTests();
  runAdminAnalyticsScheduledReportStorageContractTests();
  await runOptionalLiveSchemaChecks();
  console.log('migration-schema.test.ts passed');
}
