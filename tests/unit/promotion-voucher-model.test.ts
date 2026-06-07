import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  assertPromotionValidityWindow,
  assertPromotionVoucherCode,
  assertPromotionVoucherStatus,
  createPromotionVoucher,
  findPromotionVoucherByCode,
  isPromotionAboveOrderMinimum,
  isPromotionVoucherActive,
  isPromotionVoucherActiveForOrder,
  isPromotionWithinUsageLimit,
  isPromotionWithinValidityWindow,
  listPromotionVouchers,
  normalizePromotionMinimumSubtotalCents,
  normalizePromotionUsageCount,
  normalizePromotionUsageLimit,
  normalizePromotionVoucherCode,
  normalizePromotionVoucherInput,
  normalizePromotionWindowDate,
  type PromotionVoucherRecord
} from '../../lib/promotions/promotion-voucher-repository';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function voucherRecord(overrides: Partial<PromotionVoucherRecord> = {}): PromotionVoucherRecord {
  const now = new Date('2026-06-06T12:00:00.000Z');
  return {
    id: 'voucher_123',
    code: 'SUMMER25',
    promotionDiscountId: 'discount_123',
    status: 'active',
    isActive: true,
    usageCount: 0,
    usageLimit: 10,
    minimumSubtotalCents: 5000,
    startsAt: new Date('2026-06-01T00:00:00.000Z'),
    endsAt: new Date('2026-06-30T23:59:59.000Z'),
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

export async function runPromotionVoucherModelTests() {
  const migration = source('prisma/migrations/20260602140000_add_voucher_coupon_codes/migration.sql');
  const repository = source('lib/promotions/promotion-voucher-repository.ts');

  assert.equal(normalizePromotionVoucherCode(' summer 25 '), 'SUMMER25');
  assert.throws(() => normalizePromotionVoucherCode('   '), /Promotion voucher code is required/);
  assert.equal(assertPromotionVoucherCode(' rose-10 '), 'ROSE-10');
  assert.equal(assertPromotionVoucherCode(' vip_code '), 'VIP_CODE');
  assert.throws(() => assertPromotionVoucherCode('!!'), /Promotion voucher code must be/);
  assert.throws(() => assertPromotionVoucherCode('AB'), /Promotion voucher code must be/);

  assert.equal(assertPromotionVoucherStatus(undefined), 'draft');
  assert.equal(assertPromotionVoucherStatus(' ACTIVE '), 'active');
  assert.equal(assertPromotionVoucherStatus('paused'), 'paused');
  assert.equal(assertPromotionVoucherStatus('archived'), 'archived');
  assert.throws(() => assertPromotionVoucherStatus('expired'), /Unsupported promotion voucher status: expired/);

  assert.equal(normalizePromotionWindowDate(null), null);
  assert.equal(normalizePromotionWindowDate('2026-06-01T00:00:00.000Z')?.toISOString(), '2026-06-01T00:00:00.000Z');
  assert.throws(() => normalizePromotionWindowDate('not-a-date'), /Invalid promotion validity date: not-a-date/);
  assert.deepEqual(assertPromotionValidityWindow('2026-06-01T00:00:00.000Z', '2026-06-30T00:00:00.000Z'), {
    startsAt: new Date('2026-06-01T00:00:00.000Z'),
    endsAt: new Date('2026-06-30T00:00:00.000Z')
  });
  assert.throws(
    () => assertPromotionValidityWindow('2026-07-01T00:00:00.000Z', '2026-06-30T00:00:00.000Z'),
    /Promotion validity startsAt must be before endsAt/
  );

  assert.equal(isPromotionWithinValidityWindow({ startsAt: null, endsAt: null }, new Date('2026-06-15T00:00:00.000Z')), true);
  assert.equal(isPromotionWithinValidityWindow({ startsAt: new Date('2026-06-16T00:00:00.000Z'), endsAt: null }, new Date('2026-06-15T00:00:00.000Z')), false);
  assert.equal(isPromotionWithinValidityWindow({ startsAt: null, endsAt: new Date('2026-06-14T00:00:00.000Z') }, new Date('2026-06-15T00:00:00.000Z')), false);

  assert.equal(normalizePromotionUsageLimit(undefined), null);
  assert.equal(normalizePromotionUsageLimit(3.9), 3);
  assert.throws(() => normalizePromotionUsageLimit(0), /Promotion usage limit must be at least 1/);
  assert.equal(normalizePromotionUsageCount(-4.2), 0);
  assert.equal(normalizePromotionUsageCount(4.9), 4);
  assert.equal(isPromotionWithinUsageLimit({ usageCount: 1, usageLimit: null }), true);
  assert.equal(isPromotionWithinUsageLimit({ usageCount: 1, usageLimit: 2 }), true);
  assert.equal(isPromotionWithinUsageLimit({ usageCount: 2, usageLimit: 2 }), false);

  assert.equal(normalizePromotionMinimumSubtotalCents(undefined), null);
  assert.equal(normalizePromotionMinimumSubtotalCents(1999.9), 1999);
  assert.throws(() => normalizePromotionMinimumSubtotalCents(-1), /Promotion minimum subtotal cannot be negative/);
  assert.equal(isPromotionAboveOrderMinimum({ minimumSubtotalCents: null }, 0), true);
  assert.equal(isPromotionAboveOrderMinimum({ minimumSubtotalCents: 5000 }, 4999), false);
  assert.equal(isPromotionAboveOrderMinimum({ minimumSubtotalCents: 5000 }, 5000), true);

  assert.deepEqual(normalizePromotionVoucherInput({
    code: ' summer 25 ',
    promotionDiscountId: ' discount_123 ',
    status: ' active ',
    isActive: false,
    startsAt: '2026-06-01T00:00:00.000Z',
    endsAt: '2026-06-30T00:00:00.000Z',
    usageLimit: 5.9,
    minimumSubtotalCents: 2500.9
  }), {
    code: 'SUMMER25',
    promotionDiscountId: 'discount_123',
    status: 'active',
    isActive: false,
    startsAt: new Date('2026-06-01T00:00:00.000Z'),
    endsAt: new Date('2026-06-30T00:00:00.000Z'),
    usageLimit: 5,
    minimumSubtotalCents: 2500
  });
  assert.throws(() => normalizePromotionVoucherInput({ code: 'SUMMER25', promotionDiscountId: ' ' }), /Promotion discount id is required/);

  const now = new Date('2026-06-15T12:00:00.000Z');
  assert.equal(isPromotionVoucherActive(voucherRecord(), now), true);
  assert.equal(isPromotionVoucherActive(voucherRecord({ status: 'paused' }), now), false);
  assert.equal(isPromotionVoucherActive(voucherRecord({ isActive: false }), now), false);
  assert.equal(isPromotionVoucherActiveForOrder(voucherRecord(), 5000, now), true);
  assert.equal(isPromotionVoucherActiveForOrder(voucherRecord({ usageCount: 10, usageLimit: 10 }), 5000, now), false);
  assert.equal(isPromotionVoucherActiveForOrder(voucherRecord(), 4999, now), false);

  assert.deepEqual(await listPromotionVouchers(), []);
  assert.equal(await findPromotionVoucherByCode('summer25'), null);
  await assert.rejects(() => createPromotionVoucher({
    code: 'summer25',
    promotionDiscountId: 'discount_123',
    status: 'active'
  }), /DATABASE_URL is not configured/);

  for (const marker of [
    'CREATE TABLE IF NOT EXISTS "PromotionVoucher"',
    '"code" TEXT NOT NULL',
    '"promotionDiscountId" TEXT NOT NULL',
    '"status" TEXT NOT NULL DEFAULT \'draft\'',
    '"isActive" BOOLEAN NOT NULL DEFAULT true',
    '"usageCount" INTEGER NOT NULL DEFAULT 0',
    '"PromotionVoucher_code_key"',
    '"PromotionVoucher_promotionDiscountId_idx"',
    '"PromotionVoucher_status_isActive_idx"',
    '"PromotionVoucher_code_status_idx"',
    'FOREIGN KEY ("promotionDiscountId") REFERENCES "PromotionDiscount"("id")'
  ]) {
    assert.ok(migration.includes(marker), `voucher migration must include ${marker}`);
  }

  for (const marker of [
    "PROMOTION_VOUCHER_STATUSES = ['draft', 'active', 'paused', 'archived'] as const",
    'export type PromotionVoucherInput',
    'promotionDiscountId: string',
    'export function normalizePromotionVoucherCode',
    "toUpperCase().replace(/\\s+/g, '')",
    'export function assertPromotionVoucherCode',
    'export function assertPromotionVoucherStatus',
    'export function normalizePromotionVoucherInput',
    'export function isPromotionVoucherActive',
    "voucher.isActive && voucher.status === 'active'",
    'export async function listPromotionVouchers',
    'export async function findPromotionVoucherByCode',
    'export async function createPromotionVoucher',
    'INSERT INTO "PromotionVoucher"',
    "action: 'promotion.voucher.create'"
  ]) {
    assert.ok(repository.includes(marker), `voucher repository must include ${marker}`);
  }

  console.log('promotion-voucher-model.test.ts passed');
}
