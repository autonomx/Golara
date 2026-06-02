import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migrationPath = 'prisma/migrations/20260602045000_add_variant_stock_controls/migration.sql';

export async function runVariantStockMigrationTests() {
  const migration = readFileSync(migrationPath, 'utf8');

  assert.match(migration, /ALTER TABLE "ProductVariant"/);
  assert.match(migration, /"trackInventory" BOOLEAN NOT NULL DEFAULT true/);
  assert.match(migration, /"lowStockThreshold" INTEGER/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS/);

  console.log('variant-stock-migration.test.ts passed');
}
