import assert from 'node:assert/strict';
import type { ProductVariant } from '../../lib/catalog';
import { canSellProductVariant, canSellVariant, getProductVariantStockSummary, getVariantStockSummary } from '../../lib/inventory/variant-stock-status';

export async function runVariantStockStatusTests() {
  const inactive = getVariantStockSummary({ isActive: false, stockQuantity: 12 });
  assert.equal(inactive.status, 'inactive');
  assert.equal(inactive.canSell, false);

  const untracked = getVariantStockSummary({ trackInventory: false, stockQuantity: 0 });
  assert.equal(untracked.status, 'untracked');
  assert.equal(untracked.canSell, true);

  assert.equal(getVariantStockSummary({ stockQuantity: 0 }).status, 'out_of_stock');
  assert.equal(canSellVariant({ stockQuantity: 0 }), false);

  const lowStock = getVariantStockSummary({ stockQuantity: 2, lowStockThreshold: 3 });
  assert.equal(lowStock.status, 'low_stock');
  assert.equal(lowStock.canSell, true);

  assert.equal(getVariantStockSummary({ stockQuantity: 8, lowStockThreshold: 3 }).status, 'in_stock');
  assert.equal(canSellVariant({ stockQuantity: 8, lowStockThreshold: 3 }), true);

  assert.equal(getVariantStockSummary({ stockQuantity: -4 }).status, 'out_of_stock');
  assert.equal(getVariantStockSummary({ stockQuantity: 2.9, lowStockThreshold: 2.1 }).status, 'low_stock');

  const variant: ProductVariant = {
    id: 'variant-1',
    productId: 'product-1',
    sku: 'ROSE-BOX-RED',
    name: 'Red rose box',
    price: 120,
    currency: 'CAD',
    stockQuantity: 1,
    trackInventory: true,
    lowStockThreshold: 2,
    isActive: true,
    sortOrder: 0
  };
  assert.equal(getProductVariantStockSummary(variant).status, 'low_stock');
  assert.equal(canSellProductVariant(variant), true);

  console.log('variant-stock-status.test.ts passed');
}
