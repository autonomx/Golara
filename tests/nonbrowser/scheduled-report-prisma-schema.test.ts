import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  ADMIN_ANALYTICS_SCHEDULED_REPORT_PRISMA_MODEL_BLOCK,
  buildAdminAnalyticsScheduledReportPrismaSchemaMapping
} from '../../lib/analytics/admin-analytics-scheduled-report-prisma-schema';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function migrationSource() {
  return readdirSync('prisma/migrations')
    .map((dir) => join('prisma/migrations', dir, 'migration.sql').replace(/\\/g, '/'))
    .map(source)
    .join('\n');
}

export function runScheduledReportPrismaSchemaTests() {
  const mapping = buildAdminAnalyticsScheduledReportPrismaSchemaMapping();

  assert.equal(mapping.status, 'prisma_schema_mapping_contract_only');
  assert.equal(mapping.modelName, 'AdminAnalyticsScheduledReport');
  assert.equal(mapping.tableName, 'AdminAnalyticsScheduledReport');
  assert.equal(mapping.mappedInSchemaPrisma, false);
  assert.equal(mapping.generatedClientAccessEnabled, false);
  assert.equal(mapping.repositoryReadsEnabled, false);
  assert.equal(mapping.repositoryWritesEnabled, false);
  assert.equal(mapping.readEndpointEnabled, false);
  assert.equal(mapping.managementUiEnabled, false);
  assert.equal(mapping.scheduleActivationEnabled, false);
  assert.equal(mapping.deliveryExecutionEnabled, false);
  assert.deepEqual(mapping.jsonFields, ['reportTypes', 'lastDryRunSummary', 'metadata']);
  assert.ok(mapping.activationBlockers.includes('schema.prisma model block not applied'));
  assert.ok(mapping.activationBlockers.includes('generated Prisma client access not enabled'));
  assert.ok(mapping.activationBlockers.includes('delivery execution remains disabled'));

  const requiredFields = new Map(mapping.fields.map((field) => [field.name, field]));
  assert.equal(requiredFields.get('reportKey')?.prismaType, 'String');
  assert.equal(requiredFields.get('cadence')?.prismaType, 'String');
  assert.equal(requiredFields.get('rangeQuery')?.required, true);
  assert.equal(requiredFields.get('reportTypes')?.prismaType, 'Json');
  assert.equal(requiredFields.get('reportTypes')?.defaultValue, '["business", "site"]');
  assert.equal(requiredFields.get('ownerApproved')?.defaultValue, 'false');
  assert.equal(requiredFields.get('isActive')?.defaultValue, 'false');
  assert.equal(requiredFields.get('deliveryEnabled')?.defaultValue, 'false');
  assert.equal(requiredFields.get('lastDryRunSummary')?.prismaType, 'Json');
  assert.equal(requiredFields.get('metadata')?.prismaType, 'Json');

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
  assert.doesNotMatch(schemaSource, /model AdminAnalyticsScheduledReport\s+\{/);

  const helperSource = source('lib/analytics/admin-analytics-scheduled-report-prisma-schema.ts');
  assert.match(helperSource, /prisma_schema_mapping_contract_only/);
  assert.match(helperSource, /mappedInSchemaPrisma: false/);
  assert.match(helperSource, /generatedClientAccessEnabled: false/);
  assert.match(helperSource, /repositoryReadsEnabled: false/);
  assert.match(helperSource, /repositoryWritesEnabled: false/);
  assert.match(helperSource, /deliveryExecutionEnabled: false/);
  assert.doesNotMatch(helperSource, /PrismaClient|prisma\.|\$queryRaw|findMany|create\(|update\(|upsert\(|delete\(|fetch\(|sendMail|transport|cron|schedule\.create|setInterval|setTimeout|\bPOST\b|\bPUT\b|\bPATCH\b|\bDELETE\b|localStorage|sessionStorage|cookies\(/);

  console.log('scheduled-report-prisma-schema.test.ts passed');
}
