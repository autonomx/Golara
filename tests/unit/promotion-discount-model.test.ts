import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPromotionDiscountModelTests() {
  const migration = source('prisma/migrations/20260602130000_add_promotion_discount_model/migration.sql');
  const schema = source('prisma/schema.prisma');
  const repository = source('lib/promotions/promotion-discount-repository.ts');
  const adminDiscountAction = source('app/admin/discounts/actions.ts');
  const adminDiscountWorkspace = source('components/admin/AdminModulePlaceholder.tsx');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "PromotionDiscount"/);
  assert.match(migration, /"discountType" TEXT NOT NULL/);
  assert.match(migration, /"value" INTEGER NOT NULL/);
  assert.match(migration, /"currency" TEXT NOT NULL DEFAULT 'TOMAN'/);
  assert.match(migration, /"status" TEXT NOT NULL DEFAULT 'draft'/);
  assert.match(migration, /"PromotionDiscount_slug_key"/);
  assert.match(migration, /"PromotionDiscount_status_isActive_idx"/);
  assert.match(migration, /"PromotionDiscount_discountType_idx"/);

  assert.match(schema, /model PromotionDiscount \{/);
  assert.match(schema, /slug\s+String\s+@unique/);
  assert.match(schema, /discountType\s+String/);
  assert.match(schema, /value\s+Int/);
  assert.match(schema, /currency\s+String\s+@default\("TOMAN"\)/);
  assert.match(schema, /status\s+String\s+@default\("draft"\)/);
  assert.match(schema, /@@index\(\[status, isActive\]\)/);
  assert.match(schema, /@@index\(\[discountType\]\)/);

  assert.match(repository, /PROMOTION_DISCOUNT_TYPES = \['fixed_amount', 'percentage'\] as const/);
  assert.match(repository, /PROMOTION_DISCOUNT_STATUSES = \['draft', 'active', 'paused', 'archived'\] as const/);
  assert.match(repository, /export function slugifyPromotionDiscountName/);
  assert.match(repository, /export function assertPromotionDiscountType/);
  assert.match(repository, /export function assertPromotionDiscountStatus/);
  assert.match(repository, /export function normalizePromotionDiscountValue/);
  assert.match(repository, /export function normalizePromotionDiscountInput/);
  assert.match(repository, /export function calculatePromotionDiscountAmount/);
  assert.match(repository, /Math\.floor\(\(subtotal \* normalizedValue\) \/ 100\)/);
  assert.match(repository, /Math\.min\(subtotal, requestedDiscount\)/);
  assert.match(repository, /export async function listPromotionDiscounts/);
  assert.match(repository, /export async function createPromotionDiscount/);
  assert.match(repository, /INSERT INTO "PromotionDiscount"/);
  assert.match(repository, /action: 'promotion.discount.create'/);

  for (const marker of [
    "import { createPromotionDiscount } from '@/lib/promotions/promotion-discount-repository'",
    "import { createPromotionVoucher } from '@/lib/promotions/promotion-voucher-repository'",
    'export async function createAdminDiscountAction',
    "await assertAdminRole('owner')",
    "requiredString(formData, 'name')",
    "requiredString(formData, 'discountType')",
    "intField(formData, 'value')",
    "optionalIntField(formData, 'minimumSubtotalCents')",
    "optionalString(formData, 'voucherCode')",
    'await createPromotionVoucher',
    "revalidatePath('/admin/discounts')",
    "redirect(discountReturnPath('discount-created'"
  ]) {
    assert.ok(adminDiscountAction.includes(marker), `admin discount action must include ${marker}`);
  }

  for (const marker of [
    "import { createAdminDiscountAction } from '@/app/admin/discounts/actions'",
    'function AdminDiscountCreateForm',
    'id="create-discount"',
    'action={createAdminDiscountAction}',
    'name="name"',
    'name="discountType"',
    'name="value"',
    'name="currency"',
    'name="status"',
    'name="minimumSubtotalCents"',
    'name="voucherCode"',
    'name="voucherStatus"',
    'Create discount',
    'Promotion campaigns',
    '<AdminDiscountCreateForm disabled={!workspace.available} locale={locale} />'
  ]) {
    assert.ok(adminDiscountWorkspace.includes(marker), `admin discount workspace must include ${marker}`);
  }

  console.log('promotion-discount-model.test.ts passed');
}
