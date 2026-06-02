import assert from 'node:assert/strict';
import { mapProductVariantForCatalog } from '../../lib/cms/product-variant-mapper';

export async function runProductVariantMapperTests() {
  const mapped = mapProductVariantForCatalog({
    id: 'variant-1',
    productId: 'product-1',
    sku: 'SKU-1',
    name: 'Small bouquet',
    priceCents: 12500,
    currency: 'CAD',
    imageUrl: null,
    stockQuantity: 2,
    trackInventory: false,
    lowStockThreshold: 4,
    isActive: true,
    sortOrder: 3
  });

  assert.equal(mapped.price, 125);
  assert.equal(mapped.trackInventory, false);
  assert.equal(mapped.lowStockThreshold, 4);
  assert.equal(mapped.stockQuantity, 2);

  const defaults = mapProductVariantForCatalog({
    id: 'variant-2',
    productId: 'product-1',
    sku: 'SKU-2',
    name: 'Default bouquet',
    priceCents: 5000,
    currency: 'CAD',
    imageUrl: null,
    stockQuantity: 0,
    isActive: true,
    sortOrder: 0
  });

  assert.equal(defaults.trackInventory, true);
  assert.equal(defaults.lowStockThreshold, undefined);

  console.log('product-variant-mapper.test.ts passed');
}
