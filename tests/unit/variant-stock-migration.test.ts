import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migrationPath = 'prisma/migrations/20260602045000_add_variant_stock_controls/migration.sql';
const schemaPath = 'prisma/schema.prisma';

export async function runVariantStockMigrationTests() {
  const migration = readFileSync(migrationPath, 'utf8');
  const schema = readFileSync(schemaPath, 'utf8');

  assert.match(migration, /ALTER TABLE "ProductVariant"/);
  assert.match(migration, /"trackInventory" BOOLEAN NOT NULL DEFAULT true/);
  assert.match(migration, /"lowStockThreshold" INTEGER/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS/);

  assert.match(schema, /model ProductVariant \{/);
  assert.match(schema, /trackInventory\s+Boolean\s+@default\(true\)/);
  assert.match(schema, /lowStockThreshold\s+Int\?/);

  console.log('variant-stock-migration.test.ts passed');
}
