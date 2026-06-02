import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPromotionVoucherModelTests() {
  const migration = source('prisma/migrations/20260602140000_add_voucher_coupon_codes/migration.sql');
  const repository = source('lib/promotions/promotion-voucher-repository.ts');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "PromotionVoucher"/);
  assert.match(migration, /"code" TEXT NOT NULL/);
  assert.match(migration, /"promotionDiscountId" TEXT NOT NULL/);
  assert.match(migration, /"status" TEXT NOT NULL DEFAULT 'draft'/);
  assert.match(migration, /"isActive" BOOLEAN NOT NULL DEFAULT true/);
  assert.match(migration, /"usageCount" INTEGER NOT NULL DEFAULT 0/);
  assert.match(migration, /"PromotionVoucher_code_key"/);
  assert.match(migration, /"PromotionVoucher_promotionDiscountId_idx"/);
  assert.match(migration, /"PromotionVoucher_status_isActive_idx"/);
  assert.match(migration, /"PromotionVoucher_code_status_idx"/);
  assert.match(migration, /FOREIGN KEY \("promotionDiscountId"\) REFERENCES "PromotionDiscount"\("id"\)/);

  assert.match(repository, /PROMOTION_VOUCHER_STATUSES = \['draft', 'active', 'paused', 'archived'\] as const/);
  assert.match(repository, /export type PromotionVoucherInput/);
  assert.match(repository, /promotionDiscountId: string/);
  assert.match(repository, /export function normalizePromotionVoucherCode/);
  assert.match(repository, /toUpperCase\(\)\.replace\(\/\\s\+\/g, ''\)/);
  assert.match(repository, /export function assertPromotionVoucherCode/);
  assert.match(repository, /\^\[A-Z0-9\]\[A-Z0-9_-\]\{2,31\}\$/);
  assert.match(repository, /export function assertPromotionVoucherStatus/);
  assert.match(repository, /export function normalizePromotionVoucherInput/);
  assert.match(repository, /export function isPromotionVoucherActive/);
  assert.match(repository, /voucher\.isActive && voucher\.status === 'active'/);
  assert.match(repository, /export async function listPromotionVouchers/);
  assert.match(repository, /export async function findPromotionVoucherByCode/);
  assert.match(repository, /export async function createPromotionVoucher/);
  assert.match(repository, /INSERT INTO "PromotionVoucher"/);
  assert.match(repository, /action: 'promotion.voucher.create'/);

  console.log('promotion-voucher-model.test.ts passed');
}
