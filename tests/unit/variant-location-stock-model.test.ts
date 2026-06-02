import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migrationPath = 'prisma/migrations/20260602054000_add_variant_location_stock/migration.sql';
const schemaPath = 'prisma/schema.prisma';

export async function runVariantLocationStockModelTests() {
  const migration = readFileSync(migrationPath, 'utf8');
  const schema = readFileSync(schemaPath, 'utf8');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "ProductVariantLocationStock"/);
  assert.match(migration, /"variantId" TEXT NOT NULL/);
  assert.match(migration, /"locationId" TEXT NOT NULL/);
  assert.match(migration, /"reservedQuantity" INTEGER NOT NULL DEFAULT 0/);
  assert.match(migration, /"ProductVariantLocationStock_variantId_locationId_key"/);
  assert.match(migration, /FOREIGN KEY \("variantId"\) REFERENCES "ProductVariant"\("id"\) ON DELETE CASCADE/);
  assert.match(migration, /FOREIGN KEY \("locationId"\) REFERENCES "WarehouseLocation"\("id"\) ON DELETE CASCADE/);

  assert.match(schema, /model ProductVariantLocationStock \{/);
  assert.match(schema, /variant\s+ProductVariant\s+@relation\(fields: \[variantId\], references: \[id\], onDelete: Cascade\)/);
  assert.match(schema, /location\s+WarehouseLocation\s+@relation\(fields: \[locationId\], references: \[id\], onDelete: Cascade\)/);
  assert.match(schema, /reservedQuantity\s+Int\s+@default\(0\)/);
  assert.match(schema, /@@unique\(\[variantId, locationId\]\)/);
  assert.match(schema, /locationStocks\s+ProductVariantLocationStock\[\]/);
  assert.match(schema, /variantStocks\s+ProductVariantLocationStock\[\]/);

  console.log('variant-location-stock-model.test.ts passed');
}
