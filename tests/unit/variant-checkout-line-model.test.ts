import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migrationPath = 'prisma/migrations/20260602062000_add_variant_checkout_lines/migration.sql';
const schemaPath = 'prisma/schema.prisma';

export async function runVariantCheckoutLineModelTests() {
  const migration = readFileSync(migrationPath, 'utf8');
  const schema = readFileSync(schemaPath, 'utf8');

  assert.match(migration, /ALTER TABLE "CartItem"/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "variantId" TEXT/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "lineKey" TEXT/);
  assert.match(migration, /UPDATE "CartItem"\s+SET "lineKey" = COALESCE\("variantId", "productId"\)/);
  assert.match(migration, /DROP INDEX IF EXISTS "CartItem_cartId_productId_key"/);
  assert.match(migration, /"CartItem_cartId_lineKey_key"/);
  assert.match(migration, /ALTER TABLE "CheckoutOrderItem"/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "variantSku" TEXT/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "variantName" TEXT/);
  assert.match(migration, /"CheckoutOrderItem_variantId_fkey"/);

  assert.match(schema, /variantId\s+String\?/);
  assert.match(schema, /lineKey\s+String/);
  assert.match(schema, /@@unique\(\[cartId, lineKey\]\)/);
  assert.match(schema, /variantSku\s+String\?/);
  assert.match(schema, /variantName\s+String\?/);
  assert.match(schema, /cartItems\s+CartItem\[\]/);
  assert.match(schema, /orderItems\s+CheckoutOrderItem\[\]/);

  console.log('variant-checkout-line-model.test.ts passed');
}
