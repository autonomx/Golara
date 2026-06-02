import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPromotionEligibilityRulesModelTests() {
  const migration = source('prisma/migrations/20260602170000_add_promotion_eligibility_rules/migration.sql');
  const repository = source('lib/promotions/promotion-eligibility-repository.ts');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "PromotionEligibilityRule"/);
  assert.match(migration, /"promotionDiscountId" TEXT/);
  assert.match(migration, /"promotionVoucherId" TEXT/);
  assert.match(migration, /"targetType" TEXT NOT NULL/);
  assert.match(migration, /"targetId" TEXT NOT NULL/);
  assert.match(migration, /"effect" TEXT NOT NULL DEFAULT 'include'/);
  assert.match(migration, /"PromotionEligibilityRule_discount_idx"/);
  assert.match(migration, /"PromotionEligibilityRule_voucher_idx"/);
  assert.match(migration, /"PromotionEligibilityRule_target_idx"/);
  assert.match(migration, /"PromotionEligibilityRule_unique_discount_target"/);
  assert.match(migration, /"PromotionEligibilityRule_unique_voucher_target"/);
  assert.match(migration, /FOREIGN KEY \("promotionDiscountId"\) REFERENCES "PromotionDiscount"\("id"\)/);
  assert.match(migration, /FOREIGN KEY \("promotionVoucherId"\) REFERENCES "PromotionVoucher"\("id"\)/);

  assert.match(repository, /PROMOTION_ELIGIBILITY_TARGET_TYPES = \['product', 'category', 'customer'\] as const/);
  assert.match(repository, /PROMOTION_ELIGIBILITY_EFFECTS = \['include', 'exclude'\] as const/);
  assert.match(repository, /export function assertPromotionEligibilityTargetType/);
  assert.match(repository, /export function assertPromotionEligibilityEffect/);
  assert.match(repository, /export function normalizePromotionEligibilityRuleInput/);
  assert.match(repository, /Promotion eligibility rule requires a discount or voucher id/);
  assert.match(repository, /Promotion eligibility rule can target only one discount or voucher/);
  assert.match(repository, /export function isPromotionEligibleForContext/);
  assert.match(repository, /if \(rules\.length === 0\) return true/);
  assert.match(repository, /if \(excluded\) return false/);
  assert.match(repository, /if \(includeRules\.length === 0\) return true/);
  assert.match(repository, /export async function listPromotionEligibilityRulesForDiscount/);
  assert.match(repository, /export async function listPromotionEligibilityRulesForVoucher/);
  assert.match(repository, /export async function createPromotionEligibilityRule/);
  assert.match(repository, /INSERT INTO "PromotionEligibilityRule"/);
  assert.match(repository, /action: 'promotion.eligibility.create'/);

  console.log('promotion-eligibility-rules-model.test.ts passed');
}
