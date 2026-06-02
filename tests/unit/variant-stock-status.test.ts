import assert from 'node:assert/strict';
import { canSellVariant, getVariantStockSummary } from '../../lib/inventory/variant-stock-status';

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

  console.log('variant-stock-status.test.ts passed');
}
