ALTER TABLE "CartItem"
  ADD COLUMN IF NOT EXISTS "variantId" TEXT,
  ADD COLUMN IF NOT EXISTS "lineKey" TEXT;

UPDATE "CartItem"
SET "lineKey" = COALESCE("variantId", "productId")
WHERE "lineKey" IS NULL;

ALTER TABLE "CartItem"
  ALTER COLUMN "lineKey" SET NOT NULL;

DROP INDEX IF EXISTS "CartItem_cartId_productId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "CartItem_cartId_lineKey_key" ON "CartItem"("cartId", "lineKey");
CREATE INDEX IF NOT EXISTS "CartItem_variantId_idx" ON "CartItem"("variantId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CartItem_variantId_fkey'
  ) THEN
    ALTER TABLE "CartItem"
      ADD CONSTRAINT "CartItem_variantId_fkey"
      FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "CheckoutOrderItem"
  ADD COLUMN IF NOT EXISTS "variantId" TEXT,
  ADD COLUMN IF NOT EXISTS "variantSku" TEXT,
  ADD COLUMN IF NOT EXISTS "variantName" TEXT;

CREATE INDEX IF NOT EXISTS "CheckoutOrderItem_variantId_idx" ON "CheckoutOrderItem"("variantId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CheckoutOrderItem_variantId_fkey'
  ) THEN
    ALTER TABLE "CheckoutOrderItem"
      ADD CONSTRAINT "CheckoutOrderItem_variantId_fkey"
      FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
