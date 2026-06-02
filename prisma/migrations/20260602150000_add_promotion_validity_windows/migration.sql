ALTER TABLE "PromotionDiscount"
  ADD COLUMN IF NOT EXISTS "startsAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "endsAt" TIMESTAMP(3);

ALTER TABLE "PromotionVoucher"
  ADD COLUMN IF NOT EXISTS "startsAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "endsAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "PromotionDiscount_validity_window_idx" ON "PromotionDiscount"("startsAt", "endsAt");
CREATE INDEX IF NOT EXISTS "PromotionVoucher_validity_window_idx" ON "PromotionVoucher"("startsAt", "endsAt");
CREATE INDEX IF NOT EXISTS "PromotionVoucher_code_validity_idx" ON "PromotionVoucher"("code", "startsAt", "endsAt");
