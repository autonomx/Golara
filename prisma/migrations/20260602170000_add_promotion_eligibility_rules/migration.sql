CREATE TABLE IF NOT EXISTS "PromotionEligibilityRule" (
  "id" TEXT NOT NULL,
  "promotionDiscountId" TEXT,
  "promotionVoucherId" TEXT,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "effect" TEXT NOT NULL DEFAULT 'include',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PromotionEligibilityRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PromotionEligibilityRule_discount_idx" ON "PromotionEligibilityRule"("promotionDiscountId", "targetType", "effect");
CREATE INDEX IF NOT EXISTS "PromotionEligibilityRule_voucher_idx" ON "PromotionEligibilityRule"("promotionVoucherId", "targetType", "effect");
CREATE INDEX IF NOT EXISTS "PromotionEligibilityRule_target_idx" ON "PromotionEligibilityRule"("targetType", "targetId", "effect");
CREATE UNIQUE INDEX IF NOT EXISTS "PromotionEligibilityRule_unique_discount_target" ON "PromotionEligibilityRule"("promotionDiscountId", "targetType", "targetId", "effect") WHERE "promotionDiscountId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "PromotionEligibilityRule_unique_voucher_target" ON "PromotionEligibilityRule"("promotionVoucherId", "targetType", "targetId", "effect") WHERE "promotionVoucherId" IS NOT NULL;

ALTER TABLE "PromotionEligibilityRule"
  ADD CONSTRAINT "PromotionEligibilityRule_promotionDiscountId_fkey"
  FOREIGN KEY ("promotionDiscountId") REFERENCES "PromotionDiscount"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PromotionEligibilityRule"
  ADD CONSTRAINT "PromotionEligibilityRule_promotionVoucherId_fkey"
  FOREIGN KEY ("promotionVoucherId") REFERENCES "PromotionVoucher"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
