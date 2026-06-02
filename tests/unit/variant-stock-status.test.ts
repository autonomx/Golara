import assert from 'node:assert/strict';
import { canSellVariant, getVariantStockSummary } from '../../lib/inventory/variant-stock-status';

export async function runVariantStockStatusTests() {
  assert.deepEqual(getVariantStockSummary({ isActive: false, stockQuantity: 12 }), {
    status: 'inactive',
    canSell: false,
    label: 'Inactive',
    detail: 'This variant is inactive and should not be sold.'
  });

  assert.deepEqual(getVariantStockSummary({ trackInventory: false, stockQuantity: 0 }), {
    status: 'untracked',
    canSell: true,
    label: 'Inventory not tracked',
    detail: 'This variant can be sold without checking on-hand stock.'
  });

  assert.equal(getVariantStockSummary({ stockQuantity: 0 }).status, 'out_of_stock');
  assert.equal(canSellVariant({ stockQuantity: 0 }), false);

  const lowStock = getVariantStockSummary({ stockQuantity: 2, lowStockThreshold: 3 });
  assert.equal(lowStock.status, 'low_stock');
  assert.equal(lowStock.canSell, true);
  assert.equal(lowStock.detail, 'Only 2 left; threshold is 3.');

  assert.equal(getVariantStockSummary({ stockQuantity: 8, lowStockThreshold: 3 }).status, 'in_stock');
  assert.equal(canSellVariant({ stockQuantity: 8, lowStockThreshold: 3 }), true);

  assert.equal(getVariantStockSummary({ stockQuantity: -4 }).status, 'out_of_stock');
  assert.equal(getVariantStockSummary({ stockQuantity: 2.9, lowStockThreshold: 2.1 }).status, 'low_stock');

  console.log('variant-stock-status.test.ts passed');
}
