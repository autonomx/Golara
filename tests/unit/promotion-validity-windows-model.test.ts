import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPromotionValidityWindowsModelTests() {
  const migration = source('prisma/migrations/20260602150000_add_promotion_validity_windows/migration.sql');
  const discountRepository = source('lib/promotions/promotion-discount-repository.ts');
  const voucherRepository = source('lib/promotions/promotion-voucher-repository.ts');

  assert.match(migration, /ALTER TABLE "PromotionDiscount"/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "startsAt" TIMESTAMP\(3\)/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "endsAt" TIMESTAMP\(3\)/);
  assert.match(migration, /ALTER TABLE "PromotionVoucher"/);
  assert.match(migration, /"PromotionDiscount_validity_window_idx"/);
  assert.match(migration, /"PromotionVoucher_validity_window_idx"/);
  assert.match(migration, /"PromotionVoucher_code_validity_idx"/);

  for (const repository of [discountRepository, voucherRepository]) {
    assert.match(repository, /startsAt\?: Date \| string \| null/);
    assert.match(repository, /endsAt\?: Date \| string \| null/);
    assert.match(repository, /startsAt: Date \| null/);
    assert.match(repository, /endsAt: Date \| null/);
    assert.match(repository, /export function normalizePromotionWindowDate/);
    assert.match(repository, /Number\.isNaN\(date\.getTime\(\)\)/);
    assert.match(repository, /export function assertPromotionValidityWindow/);
    assert.match(repository, /normalizedStartsAt\.getTime\(\) > normalizedEndsAt\.getTime\(\)/);
    assert.match(repository, /export function isPromotionWithinValidityWindow/);
    assert.match(repository, /!window\.startsAt \|\| window\.startsAt\.getTime\(\) <= nowTime/);
    assert.match(repository, /!window\.endsAt \|\| window\.endsAt\.getTime\(\) >= nowTime/);
    assert.match(repository, /"startsAt"/);
    assert.match(repository, /"endsAt"/);
  }

  assert.match(voucherRepository, /isPromotionVoucherActive\(voucher: Pick<PromotionVoucherRecord, 'status' \| 'isActive' \| 'startsAt' \| 'endsAt'>/);
  assert.match(voucherRepository, /voucher\.isActive && voucher\.status === 'active' && isPromotionWithinValidityWindow\(voucher, now\)/);

  console.log('promotion-validity-windows-model.test.ts passed');
}
