import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPromotionOrderMinimumsModelTests() {
  const migration = source('prisma/migrations/20260602180000_add_promotion_order_minimums/migration.sql');
  const discountRepository = source('lib/promotions/promotion-discount-repository.ts');
  const voucherRepository = source('lib/promotions/promotion-voucher-repository.ts');

  assert.match(migration, /ALTER TABLE "PromotionDiscount"/);
  assert.match(migration, /ALTER TABLE "PromotionVoucher"/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "minimumSubtotalCents" INTEGER/);
  assert.match(migration, /"PromotionDiscount_minimum_subtotal_idx"/);
  assert.match(migration, /"PromotionVoucher_minimum_subtotal_idx"/);
  assert.match(migration, /ON "PromotionDiscount"\("minimumSubtotalCents"\)/);
  assert.match(migration, /ON "PromotionVoucher"\("minimumSubtotalCents"\)/);

  for (const repository of [discountRepository, voucherRepository]) {
    assert.match(repository, /minimumSubtotalCents\?: number \| null/);
    assert.match(repository, /minimumSubtotalCents: number \| null/);
    assert.match(repository, /export type PromotionOrderMinimum/);
    assert.match(repository, /export function normalizePromotionMinimumSubtotalCents/);
    assert.match(repository, /if \(normalized < 0\) throw new Error\('Promotion minimum subtotal cannot be negative\.'\)/);
    assert.match(repository, /export function isPromotionAboveOrderMinimum/);
    assert.match(repository, /const subtotal = Math\.max\(0, Math\.floor\(subtotalCents\)\)/);
    assert.match(repository, /return minimum === null \|\| subtotal >= minimum/);
    assert.match(repository, /minimumSubtotalCents: normalizePromotionMinimumSubtotalCents\(input\.minimumSubtotalCents\)/);
    assert.match(repository, /"minimumSubtotalCents"/);
    assert.match(repository, /minimumSubtotalCents: .*\.minimumSubtotalCents/);
  }

  assert.match(discountRepository, /export function isPromotionDiscountUsableForOrder/);
  assert.match(discountRepository, /return isPromotionDiscountUsable\(discount, now\)\s*&& isPromotionAboveOrderMinimum\(discount, subtotalCents\)/);
  assert.match(voucherRepository, /export function isPromotionVoucherActiveForOrder/);
  assert.match(voucherRepository, /return isPromotionVoucherActive\(voucher, now\)\s*&& isPromotionAboveOrderMinimum\(voucher, subtotalCents\)/);

  console.log('promotion-order-minimums-model.test.ts passed');
}
