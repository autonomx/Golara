import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ADMIN_FULFILLMENT_SHIPMENT_STATUSES, assertAdminFulfillmentShipmentStatus, normalizeAdminFulfillmentShipmentInput, parseAdminFulfillmentDeliveryDate } from '../../lib/checkout/admin-fulfillment-shipment-repository';

const migrationPath = 'prisma/migrations/20260602110000_add_fulfillment_shipment_records/migration.sql';

export async function runFulfillmentShipmentRecordsModelTests() {
  const migration = readFileSync(migrationPath, 'utf8');

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

  assert.deepEqual(ADMIN_FULFILLMENT_SHIPMENT_STATUSES, ['created', 'scheduled', 'in_transit', 'delivered', 'failed', 'cancelled']);
  assert.equal(assertAdminFulfillmentShipmentStatus(undefined), 'created');
  assert.equal(assertAdminFulfillmentShipmentStatus('in_transit'), 'in_transit');
  assert.throws(() => assertAdminFulfillmentShipmentStatus('lost'), /Unsupported fulfillment shipment status/);

  const normalized = normalizeAdminFulfillmentShipmentInput({
    status: 'scheduled',
    fulfillmentType: ' courier ',
    carrierName: ' Golara Runner ',
    trackingNumber: ' GLR-100 ',
    trackingUrl: ' https://track.example/GLR-100 ',
    deliveryDate: '2026-06-03T12:00:00.000Z',
    deliveryWindow: ' Morning ',
    recipientName: ' Mina ',
    recipientPhone: ' 555-0100 ',
    addressSummary: ' 123 Rose St ',
    note: ' Leave with concierge ',
    actorLabel: ' Staff Admin ',
    actorRole: ' owner '
  });

  assert.equal(normalized.status, 'scheduled');
  assert.equal(normalized.fulfillmentType, 'courier');
  assert.equal(normalized.carrierName, 'Golara Runner');
  assert.equal(normalized.trackingNumber, 'GLR-100');
  assert.equal(normalized.trackingUrl, 'https://track.example/GLR-100');
  assert.equal(normalized.deliveryWindow, 'Morning');
  assert.equal(normalized.recipientName, 'Mina');
  assert.equal(normalized.recipientPhone, '555-0100');
  assert.equal(normalized.addressSummary, '123 Rose St');
  assert.equal(normalized.note, 'Leave with concierge');
  assert.equal(normalized.actorLabel, 'Staff Admin');
  assert.equal(normalized.actorRole, 'owner');
  assert.ok(normalized.deliveryDate instanceof Date);

  assert.equal(parseAdminFulfillmentDeliveryDate('not-a-date'), null);
  assert.equal(parseAdminFulfillmentDeliveryDate(null), null);

  console.log('fulfillment-shipment-records-model.test.ts passed');
}
