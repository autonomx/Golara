import assert from 'node:assert/strict';
import { buildVariantLocationStockAuditInput, buildVariantStockAuditInput } from '../../lib/inventory/variant-stock-audit';

export async function runVariantStockAuditTests() {
  const created = buildVariantStockAuditInput(null, {
    id: 'variant-1',
    sku: 'SKU-1',
    name: 'Small',
    stockQuantity: 4,
    trackInventory: false,
    lowStockThreshold: 2,
    product: { title: 'Rose bouquet', code: 'RB-1' }
  });

  assert.equal(created?.action, 'inventory.variant_stock.create');
  assert.equal(created?.entity, 'productVariant');
  assert.equal(created?.entityId, 'variant-1');
  assert.deepEqual(created?.metadata.changedFields, ['stockQuantity', 'trackInventory', 'lowStockThreshold']);
  assert.equal(created?.metadata.trackInventory, false);

  const adjusted = buildVariantStockAuditInput(
    {
      id: 'variant-1',
      sku: 'SKU-1',
      name: 'Small',
      stockQuantity: 4,
      trackInventory: true,
      lowStockThreshold: null
    },
    {
      id: 'variant-1',
      sku: 'SKU-1',
      name: 'Small',
      stockQuantity: 1,
      trackInventory: true,
      lowStockThreshold: 2
    }
  );

  assert.equal(adjusted?.action, 'inventory.variant_stock.adjust');
  assert.equal(adjusted?.metadata.previousStockQuantity, 4);
  assert.equal(adjusted?.metadata.stockQuantity, 1);
  assert.deepEqual(adjusted?.metadata.changedFields, ['stockQuantity', 'lowStockThreshold']);

  const unchanged = buildVariantStockAuditInput(
    {
      id: 'variant-1',
      sku: 'SKU-1',
      name: 'Small',
      stockQuantity: 1,
      trackInventory: true,
      lowStockThreshold: 2
    },
    {
      id: 'variant-1',
      sku: 'SKU-1',
      name: 'Small',
      stockQuantity: 1,
      trackInventory: true,
      lowStockThreshold: 2
    }
  );

  assert.equal(unchanged, null);

  const locationCreated = buildVariantLocationStockAuditInput(null, {
    id: 'stock-1',
    variantId: 'variant-1',
    locationId: 'location-1',
    quantity: 8,
    reservedQuantity: 2,
    lowStockThreshold: 3,
    variant: { sku: 'SKU-1', name: 'Small', product: { title: 'Rose bouquet', code: 'RB-1' } },
    location: { slug: 'main', name: 'Main shop' }
  });

  assert.equal(locationCreated?.action, 'inventory.location_stock.create');
  assert.equal(locationCreated?.entity, 'productVariantLocationStock');
  assert.equal(locationCreated?.metadata.locationName, 'Main shop');
  assert.deepEqual(locationCreated?.metadata.changedFields, ['quantity', 'reservedQuantity', 'lowStockThreshold']);

  const locationAdjusted = buildVariantLocationStockAuditInput(
    {
      id: 'stock-1',
      variantId: 'variant-1',
      locationId: 'location-1',
      quantity: 8,
      reservedQuantity: 2,
      lowStockThreshold: 3
    },
    {
      id: 'stock-1',
      variantId: 'variant-1',
      locationId: 'location-1',
      quantity: 5,
      reservedQuantity: 2,
      lowStockThreshold: 3
    }
  );

  assert.equal(locationAdjusted?.action, 'inventory.location_stock.adjust');
  assert.equal(locationAdjusted?.metadata.previousQuantity, 8);
  assert.equal(locationAdjusted?.metadata.quantity, 5);
  assert.deepEqual(locationAdjusted?.metadata.changedFields, ['quantity']);

  console.log('variant-stock-audit.test.ts passed');
}
