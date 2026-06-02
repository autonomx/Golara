import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migrationPath = 'prisma/migrations/20260602064000_add_inventory_stock_reservations/migration.sql';
const schemaPath = 'prisma/schema.prisma';

export async function runInventoryStockReservationModelTests() {
  const migration = readFileSync(migrationPath, 'utf8');
  const schema = readFileSync(schemaPath, 'utf8');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "InventoryStockReservation"/);
  assert.match(migration, /"orderItemId" TEXT NOT NULL/);
  assert.match(migration, /"variantStockId" TEXT NOT NULL/);
  assert.match(migration, /"status" TEXT NOT NULL DEFAULT 'held'/);
  assert.match(migration, /"InventoryStockReservation_orderItemId_status_idx"/);
  assert.match(migration, /FOREIGN KEY \("orderItemId"\) REFERENCES "CheckoutOrderItem"\("id"\) ON DELETE CASCADE/);
  assert.match(migration, /FOREIGN KEY \("variantStockId"\) REFERENCES "ProductVariantLocationStock"\("id"\) ON DELETE CASCADE/);

  assert.match(schema, /model InventoryStockReservation \{/);
  assert.match(schema, /orderItem\s+CheckoutOrderItem\s+@relation\(fields: \[orderItemId\], references: \[id\], onDelete: Cascade\)/);
  assert.match(schema, /variantStock\s+ProductVariantLocationStock\s+@relation\(fields: \[variantStockId\], references: \[id\], onDelete: Cascade\)/);
  assert.match(schema, /status\s+String\s+@default\("held"\)/);
  assert.match(schema, /reservations\s+InventoryStockReservation\[\]/);
  assert.match(schema, /stockReservations\s+InventoryStockReservation\[\]/);

  console.log('inventory-stock-reservation-model.test.ts passed');
}
