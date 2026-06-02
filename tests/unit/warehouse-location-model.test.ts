import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migrationPath = 'prisma/migrations/20260602052000_add_warehouse_location_model/migration.sql';
const schemaPath = 'prisma/schema.prisma';

export async function runWarehouseLocationModelTests() {
  const migration = readFileSync(migrationPath, 'utf8');
  const schema = readFileSync(schemaPath, 'utf8');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "WarehouseLocation"/);
  assert.match(migration, /"slug" TEXT NOT NULL/);
  assert.match(migration, /"countryCode" TEXT NOT NULL DEFAULT 'CA'/);
  assert.match(migration, /CREATE UNIQUE INDEX IF NOT EXISTS "WarehouseLocation_slug_key"/);
  assert.match(migration, /"WarehouseLocation_isActive_sortOrder_idx"/);

  assert.match(schema, /model WarehouseLocation \{/);
  assert.match(schema, /slug\s+String\s+@unique/);
  assert.match(schema, /countryCode\s+String\s+@default\("CA"\)/);
  assert.match(schema, /isActive\s+Boolean\s+@default\(true\)/);
  assert.match(schema, /@@index\(\[isActive, sortOrder\]\)/);
  assert.match(schema, /@@index\(\[countryCode, city\]\)/);

  console.log('warehouse-location-model.test.ts passed');
}
