import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migrationPath = 'prisma/migrations/20260602060000_add_fulfillment_method_settings/migration.sql';
const schemaPath = 'prisma/schema.prisma';

export async function runFulfillmentMethodSettingsModelTests() {
  const migration = readFileSync(migrationPath, 'utf8');
  const schema = readFileSync(schemaPath, 'utf8');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "FulfillmentMethodSetting"/);
  assert.match(migration, /"key" TEXT NOT NULL/);
  assert.match(migration, /"isDefault" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migration, /"requiresAddress" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migration, /"requiresScheduling" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migration, /"FulfillmentMethodSetting_key_key"/);
  assert.match(migration, /'delivery', 'Delivery'/);
  assert.match(migration, /'pickup', 'Pickup'/);
  assert.match(migration, /'courier', 'Courier'/);
  assert.match(migration, /'manual', 'Manual'/);

  assert.match(schema, /model FulfillmentMethodSetting \{/);
  assert.match(schema, /key\s+String\s+@unique/);
  assert.match(schema, /isActive\s+Boolean\s+@default\(true\)/);
  assert.match(schema, /isDefault\s+Boolean\s+@default\(false\)/);
  assert.match(schema, /requiresAddress\s+Boolean\s+@default\(false\)/);
  assert.match(schema, /requiresScheduling\s+Boolean\s+@default\(false\)/);
  assert.match(schema, /@@index\(\[isActive, sortOrder\]\)/);
  assert.match(schema, /@@index\(\[isDefault\]\)/);

  console.log('fulfillment-method-settings-model.test.ts passed');
}
