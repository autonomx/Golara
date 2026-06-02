ALTER TABLE "PromotionDiscount"
  ADD COLUMN IF NOT EXISTS "usageLimit" INTEGER,
  ADD COLUMN IF NOT EXISTS "usageCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "PromotionVoucher"
  ADD COLUMN IF NOT EXISTS "usageLimit" INTEGER;

CREATE INDEX IF NOT EXISTS "PromotionDiscount_usage_limit_idx" ON "PromotionDiscount"("usageLimit", "usageCount");
CREATE INDEX IF NOT EXISTS "PromotionVoucher_usage_limit_idx" ON "PromotionVoucher"("usageLimit", "usageCount");
