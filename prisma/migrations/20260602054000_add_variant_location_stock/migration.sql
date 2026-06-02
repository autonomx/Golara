CREATE TABLE IF NOT EXISTS "ProductVariantLocationStock" (
  "id" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
  "lowStockThreshold" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProductVariantLocationStock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProductVariantLocationStock_variantId_locationId_key" ON "ProductVariantLocationStock"("variantId", "locationId");
CREATE INDEX IF NOT EXISTS "ProductVariantLocationStock_locationId_idx" ON "ProductVariantLocationStock"("locationId");
CREATE INDEX IF NOT EXISTS "ProductVariantLocationStock_variantId_quantity_idx" ON "ProductVariantLocationStock"("variantId", "quantity");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductVariantLocationStock_variantId_fkey'
  ) THEN
    ALTER TABLE "ProductVariantLocationStock"
      ADD CONSTRAINT "ProductVariantLocationStock_variantId_fkey"
      FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductVariantLocationStock_locationId_fkey'
  ) THEN
    ALTER TABLE "ProductVariantLocationStock"
      ADD CONSTRAINT "ProductVariantLocationStock_locationId_fkey"
      FOREIGN KEY ("locationId") REFERENCES "WarehouseLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
