CREATE TABLE IF NOT EXISTS "InventoryStockReservation" (
  "id" TEXT NOT NULL,
  "orderItemId" TEXT NOT NULL,
  "variantStockId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'held',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InventoryStockReservation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InventoryStockReservation_orderItemId_status_idx" ON "InventoryStockReservation"("orderItemId", "status");
CREATE INDEX IF NOT EXISTS "InventoryStockReservation_variantStockId_status_idx" ON "InventoryStockReservation"("variantStockId", "status");
CREATE INDEX IF NOT EXISTS "InventoryStockReservation_variantId_locationId_status_idx" ON "InventoryStockReservation"("variantId", "locationId", "status");
CREATE INDEX IF NOT EXISTS "InventoryStockReservation_status_createdAt_idx" ON "InventoryStockReservation"("status", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'InventoryStockReservation_orderItemId_fkey'
  ) THEN
    ALTER TABLE "InventoryStockReservation"
      ADD CONSTRAINT "InventoryStockReservation_orderItemId_fkey"
      FOREIGN KEY ("orderItemId") REFERENCES "CheckoutOrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'InventoryStockReservation_variantStockId_fkey'
  ) THEN
    ALTER TABLE "InventoryStockReservation"
      ADD CONSTRAINT "InventoryStockReservation_variantStockId_fkey"
      FOREIGN KEY ("variantStockId") REFERENCES "ProductVariantLocationStock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
