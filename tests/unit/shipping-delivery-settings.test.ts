import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_SHIPPING_DELIVERY_SETTING,
  formatSameDayCutoff,
  normalizeShippingDeliverySettingInput,
  parseDeliveryPostalCodes
} from '../../lib/settings/shipping-delivery-settings';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runShippingDeliverySettingsTests() {
  const migration = source('prisma/migrations/20260603030000_add_shipping_delivery_settings/migration.sql');
  const service = source('lib/settings/shipping-delivery-settings.ts');
  const panel = source('components/admin/AdminShippingDeliverySettingsPanel.tsx');
  const fulfillmentPanel = source('components/admin/AdminFulfillmentSettingsPanel.tsx');
  const actions = source('app/admin/settings/actions.ts');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "ShippingDeliverySetting"/);
  assert.match(migration, /"deliveryFeeCents" INTEGER NOT NULL DEFAULT 0/);
  assert.match(migration, /"freeDeliveryMinimumCents" INTEGER/);
  assert.match(migration, /"minimumOrderCents" INTEGER/);
  assert.match(migration, /"deliveryRadiusKm" INTEGER/);
  assert.match(migration, /"deliveryPostalCodes" TEXT\[\] NOT NULL DEFAULT ARRAY\[\]::TEXT\[\]/);
  assert.match(migration, /"sameDayCutoffMinutes" INTEGER/);
  assert.match(migration, /ShippingDeliverySetting_key_key/);
  assert.match(migration, /'Local delivery settings'/);

  assert.match(service, /export type ShippingDeliverySetting/);
  assert.match(service, /export type ShippingDeliverySettingInput/);
  assert.match(service, /DEFAULT_SHIPPING_DELIVERY_SETTING/);
  assert.match(service, /parseDeliveryPostalCodes/);
  assert.match(service, /formatSameDayCutoff/);
  assert.match(service, /normalizeShippingDeliverySettingInput/);
  assert.match(service, /shippingDeliverySettingsService = \{/);
  assert.match(service, /async get\(key = 'primary'/);
  assert.match(service, /async update\(input: ShippingDeliverySettingInput\)/);
  assert.match(service, /FROM "ShippingDeliverySetting"/);
  assert.match(service, /INSERT INTO "ShippingDeliverySetting"/);
  assert.match(service, /action: 'settings\.shipping_delivery\.update'/);

  assert.equal(DEFAULT_SHIPPING_DELIVERY_SETTING.key, 'primary');
  assert.equal(DEFAULT_SHIPPING_DELIVERY_SETTING.deliveryFeeCents, 1500);
  assert.equal(formatSameDayCutoff(780), '13:00');
  assert.equal(formatSameDayCutoff(null), 'Not configured');
  assert.deepEqual(parseDeliveryPostalCodes('v5k\nV5K, v6b 1a1'), ['V5K', 'V6B 1A1']);

  const normalized = normalizeShippingDeliverySettingInput({
    key: ' primary ',
    label: ' Local delivery ',
    description: '  Vancouver delivery  ',
    deliveryFeeCents: 1599.4,
    freeDeliveryMinimumCents: 5000,
    minimumOrderCents: -1,
    deliveryRadiusKm: 12.6,
    deliveryPostalCodes: [' v5k ', 'V5K', 'v6b'],
    pickupAddress: '  123 Main St  ',
    deliveryInstructions: '  Call before arrival  ',
    sameDayCutoffMinutes: 780,
    timezone: ' America/Vancouver ',
    isActive: true
  });

  assert.equal(normalized.key, 'primary');
  assert.equal(normalized.label, 'Local delivery');
  assert.equal(normalized.description, 'Vancouver delivery');
  assert.equal(normalized.deliveryFeeCents, 1599);
  assert.equal(normalized.freeDeliveryMinimumCents, 5000);
  assert.equal(normalized.minimumOrderCents, null);
  assert.equal(normalized.deliveryRadiusKm, 13);
  assert.deepEqual(normalized.deliveryPostalCodes, ['V5K', 'V6B']);
  assert.equal(normalized.pickupAddress, '123 Main St');
  assert.equal(normalized.deliveryInstructions, 'Call before arrival');
  assert.equal(normalized.timezone, 'America/Vancouver');

  assert.match(panel, /export function AdminShippingDeliverySettingsPanel/);
  assert.match(panel, /updateShippingDeliverySettingAction/);
  assert.match(panel, /Shipping and delivery/);
  assert.match(panel, /name="deliveryFee"/);
  assert.match(panel, /name="freeDeliveryMinimum"/);
  assert.match(panel, /name="deliveryPostalCodes"/);
  assert.match(panel, /Save shipping\/delivery settings/);

  assert.match(fulfillmentPanel, /shippingDeliverySettingsService\.get\(\)/);
  assert.match(fulfillmentPanel, /AdminShippingDeliverySettingsPanel/);

  assert.match(actions, /updateShippingDeliverySettingAction/);
  assert.match(actions, /shippingDeliverySettingsService\.update/);
  assert.match(actions, /moneyField/);
  assert.match(actions, /shipping-delivery-updated/);

  assert.match(roadmap, /- \[x\] Add shipping\/delivery settings\./);

  console.log('shipping-delivery-settings.test.ts passed');
}
