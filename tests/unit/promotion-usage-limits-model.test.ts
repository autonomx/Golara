import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPromotionUsageLimitsModelTests() {
  const migration = source('prisma/migrations/20260602160000_add_promotion_usage_limits/migration.sql');
  const discountRepository = source('lib/promotions/promotion-discount-repository.ts');
  const voucherRepository = source('lib/promotions/promotion-voucher-repository.ts');

  assert.match(migration, /ALTER TABLE "PromotionDiscount"/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "usageLimit" INTEGER/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "usageCount" INTEGER NOT NULL DEFAULT 0/);
  assert.match(migration, /ALTER TABLE "PromotionVoucher"/);
  assert.match(migration, /"PromotionDiscount_usage_limit_idx"/);
  assert.match(migration, /"PromotionVoucher_usage_limit_idx"/);

  for (const repository of [discountRepository, voucherRepository]) {
    assert.match(repository, /usageLimit\?: number \| null/);
    assert.match(repository, /usageCount: number/);
    assert.match(repository, /usageLimit: number \| null/);
    assert.match(repository, /export type PromotionUsageLimit/);
    assert.match(repository, /export function normalizePromotionUsageLimit/);
    assert.match(repository, /if \(normalized < 1\) throw new Error\('Promotion usage limit must be at least 1\.'\)/);
    assert.match(repository, /export function normalizePromotionUsageCount/);
    assert.match(repository, /Math\.max\(0, Math\.floor\(value \?\? 0\)\)/);
    assert.match(repository, /export function isPromotionWithinUsageLimit/);
    assert.match(repository, /return usageLimit === null \|\| usageCount < usageLimit/);
    assert.match(repository, /"usageCount"/);
    assert.match(repository, /"usageLimit"/);
  }

  assert.match(discountRepository, /export function isPromotionDiscountUsable/);
  assert.match(discountRepository, /&& isPromotionWithinUsageLimit\(discount\)/);
  assert.match(voucherRepository, /export function isPromotionVoucherActive/);
  assert.match(voucherRepository, /&& isPromotionWithinUsageLimit\(voucher\)/);

  console.log('promotion-usage-limits-model.test.ts passed');
}
