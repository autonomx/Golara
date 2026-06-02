import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPromotionSchemaParityTests() {
  const schema = source('prisma/schema.prisma');

  assert.match(schema, /model PromotionDiscount \{/);
  assert.match(schema, /usageCount\s+Int\s+@default\(0\)/);
  assert.match(schema, /usageLimit\s+Int\?/);
  assert.match(schema, /minimumSubtotalCents\s+Int\?/);
  assert.match(schema, /startsAt\s+DateTime\?/);
  assert.match(schema, /endsAt\s+DateTime\?/);
  assert.match(schema, /vouchers\s+PromotionVoucher\[\]/);
  assert.match(schema, /eligibilityRules\s+PromotionEligibilityRule\[\]/);
  assert.match(schema, /@@index\(\[startsAt, endsAt\]\)/);
  assert.match(schema, /@@index\(\[usageLimit, usageCount\]\)/);
  assert.match(schema, /@@index\(\[minimumSubtotalCents\]\)/);

  assert.match(schema, /model PromotionVoucher \{/);
  assert.match(schema, /code\s+String\s+@unique/);
  assert.match(schema, /promotionDiscountId\s+String/);
  assert.match(schema, /promotionDiscount\s+PromotionDiscount\s+@relation\(fields: \[promotionDiscountId\], references: \[id\], onDelete: Cascade\)/);
  assert.match(schema, /status\s+String\s+@default\("draft"\)/);
  assert.match(schema, /isActive\s+Boolean\s+@default\(true\)/);
  assert.match(schema, /usageCount\s+Int\s+@default\(0\)/);
  assert.match(schema, /usageLimit\s+Int\?/);
  assert.match(schema, /minimumSubtotalCents\s+Int\?/);
  assert.match(schema, /startsAt\s+DateTime\?/);
  assert.match(schema, /endsAt\s+DateTime\?/);
  assert.match(schema, /eligibilityRules\s+PromotionEligibilityRule\[\]/);
  assert.match(schema, /@@index\(\[promotionDiscountId\]\)/);
  assert.match(schema, /@@index\(\[code, status\]\)/);

  assert.match(schema, /model PromotionEligibilityRule \{/);
  assert.match(schema, /promotionDiscountId\s+String\?/);
  assert.match(schema, /promotionDiscount\s+PromotionDiscount\?\s+@relation\(fields: \[promotionDiscountId\], references: \[id\], onDelete: Cascade\)/);
  assert.match(schema, /promotionVoucherId\s+String\?/);
  assert.match(schema, /promotionVoucher\s+PromotionVoucher\?\s+@relation\(fields: \[promotionVoucherId\], references: \[id\], onDelete: Cascade\)/);
  assert.match(schema, /targetType\s+String/);
  assert.match(schema, /targetId\s+String/);
  assert.match(schema, /effect\s+String\s+@default\("include"\)/);
  assert.match(schema, /@@index\(\[promotionDiscountId, targetType, effect\]\)/);
  assert.match(schema, /@@index\(\[promotionVoucherId, targetType, effect\]\)/);
  assert.match(schema, /@@index\(\[targetType, targetId, effect\]\)/);

  assert.match(schema, /model PromotionStoreCredit \{/);
  assert.match(schema, /code\s+String\s+@unique/);
  assert.match(schema, /customerId\s+String\?/);
  assert.match(schema, /currency\s+String\s+@default\("TOMAN"\)/);
  assert.match(schema, /initialBalanceCents\s+Int/);
  assert.match(schema, /balanceCents\s+Int/);
  assert.match(schema, /status\s+String\s+@default\("draft"\)/);
  assert.match(schema, /isActive\s+Boolean\s+@default\(true\)/);
  assert.match(schema, /expiresAt\s+DateTime\?/);
  assert.match(schema, /@@index\(\[customerId\]\)/);
  assert.match(schema, /@@index\(\[status, isActive\]\)/);
  assert.match(schema, /@@index\(\[balanceCents\]\)/);
  assert.match(schema, /@@index\(\[expiresAt\]\)/);

  console.log('promotion-schema-parity.test.ts passed');
}
