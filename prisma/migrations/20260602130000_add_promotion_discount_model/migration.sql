CREATE TABLE IF NOT EXISTS "PromotionDiscount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TOMAN',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionDiscount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PromotionDiscount_slug_key"
    ON "PromotionDiscount"("slug");

CREATE INDEX IF NOT EXISTS "PromotionDiscount_status_isActive_idx"
    ON "PromotionDiscount"("status", "isActive");

CREATE INDEX IF NOT EXISTS "PromotionDiscount_discountType_idx"
    ON "PromotionDiscount"("discountType");
