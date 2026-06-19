import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildAdminAnalyticsSavedViewStorageContract } from '../../lib/analytics/admin-analytics-saved-view-storage';
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
    'AdminAnalyticsSavedView'
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
  assert.doesNotMatch(helperSource, /PrismaClient|prisma\.|create\(|update\(|upsert\(|delete\(|fetch\(|POST|PUT|PATCH|DELETE/);

  const migrationSource = migrationFiles().map(source).join('\n');
  assert.match(migrationSource, /CREATE TABLE "AdminAnalyticsSavedView"/);
  assert.match(migrationSource, /"rangeQuery" TEXT NOT NULL/);
  assert.match(migrationSource, /"sectionAnchors" JSONB NOT NULL DEFAULT '\[\]'/);
  assert.match(migrationSource, /"ownerApproved" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migrationSource, /"isActive" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migrationSource, /"AdminAnalyticsSavedView_viewKey_scope_key"/);
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
  await runOptionalLiveSchemaChecks();
  console.log('migration-schema.test.ts passed');
}
