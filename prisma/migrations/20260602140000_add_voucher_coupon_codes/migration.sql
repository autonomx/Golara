CREATE TABLE IF NOT EXISTS "PromotionVoucher" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "promotionDiscountId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PromotionVoucher_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PromotionVoucher_code_key" ON "PromotionVoucher"("code");
CREATE INDEX IF NOT EXISTS "PromotionVoucher_promotionDiscountId_idx" ON "PromotionVoucher"("promotionDiscountId");
CREATE INDEX IF NOT EXISTS "PromotionVoucher_status_isActive_idx" ON "PromotionVoucher"("status", "isActive");
CREATE INDEX IF NOT EXISTS "PromotionVoucher_code_status_idx" ON "PromotionVoucher"("code", "status");

ALTER TABLE "PromotionVoucher"
  ADD CONSTRAINT "PromotionVoucher_promotionDiscountId_fkey"
  FOREIGN KEY ("promotionDiscountId") REFERENCES "PromotionDiscount"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
