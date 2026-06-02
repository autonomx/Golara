ALTER TABLE "PromotionDiscount"
  ADD COLUMN IF NOT EXISTS "minimumSubtotalCents" INTEGER;

ALTER TABLE "PromotionVoucher"
  ADD COLUMN IF NOT EXISTS "minimumSubtotalCents" INTEGER;

CREATE INDEX IF NOT EXISTS "PromotionDiscount_minimum_subtotal_idx"
  ON "PromotionDiscount"("minimumSubtotalCents");

CREATE INDEX IF NOT EXISTS "PromotionVoucher_minimum_subtotal_idx"
  ON "PromotionVoucher"("minimumSubtotalCents");
