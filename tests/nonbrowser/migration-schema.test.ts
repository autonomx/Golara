import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
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
    'ImportExportJob'
  ];
  for (const table of tables) assert.match(content, new RegExp(`"${table}"`), `migration SQL should mention ${table}`);
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
  await runOptionalLiveSchemaChecks();
  console.log('migration-schema.test.ts passed');
}
