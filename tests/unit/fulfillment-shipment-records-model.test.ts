import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migrationPath = 'prisma/migrations/20260602110000_add_fulfillment_shipment_records/migration.sql';
const repositoryPath = 'lib/checkout/admin-fulfillment-shipment-repository.ts';

export async function runFulfillmentShipmentRecordsModelTests() {
  const migration = readFileSync(migrationPath, 'utf8');
  const repository = readFileSync(repositoryPath, 'utf8');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "CheckoutFulfillmentShipment"/);
  assert.match(migration, /"orderId" TEXT NOT NULL/);
  assert.match(migration, /"status" TEXT NOT NULL DEFAULT 'created'/);
  assert.match(migration, /"fulfillmentType" TEXT NOT NULL DEFAULT 'delivery'/);
  assert.match(migration, /"trackingNumber" TEXT/);
  assert.match(migration, /"deliveryDate" TIMESTAMP\(3\)/);
  assert.match(migration, /"metadata" JSONB/);
  assert.match(migration, /"CheckoutFulfillmentShipment_orderId_fkey"/);
  assert.match(migration, /ON DELETE CASCADE/);
  assert.match(migration, /"CheckoutFulfillmentShipment_orderId_createdAt_idx"/);
  assert.match(migration, /"CheckoutFulfillmentShipment_status_createdAt_idx"/);
  assert.match(migration, /"CheckoutFulfillmentShipment_trackingNumber_idx"/);

  assert.match(repository, /ADMIN_FULFILLMENT_SHIPMENT_STATUSES = \['created', 'scheduled', 'in_transit', 'delivered', 'failed', 'cancelled'\] as const/);
  assert.match(repository, /export function assertAdminFulfillmentShipmentStatus/);
  assert.match(repository, /export function normalizeAdminFulfillmentShipmentInput/);
  assert.match(repository, /export async function listAdminFulfillmentShipments/);
  assert.match(repository, /export async function createAdminFulfillmentShipment/);
  assert.match(repository, /FROM "CheckoutFulfillmentShipment"/);
  assert.match(repository, /INSERT INTO "CheckoutFulfillmentShipment"/);
  assert.match(repository, /type: 'fulfillment_shipment_created'/);
  assert.match(repository, /trackingNumberAdded: Boolean\(shipment\.trackingNumber\)/);
  assert.match(repository, /deliveryDateAdded: Boolean\(shipment\.deliveryDate\)/);

  console.log('fulfillment-shipment-records-model.test.ts passed');
}
