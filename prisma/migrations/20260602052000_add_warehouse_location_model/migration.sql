CREATE TABLE IF NOT EXISTS "WarehouseLocation" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "addressLine1" TEXT,
  "addressLine2" TEXT,
  "city" TEXT,
  "region" TEXT,
  "countryCode" TEXT NOT NULL DEFAULT 'CA',
  "postalCode" TEXT,
  "phone" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WarehouseLocation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WarehouseLocation_slug_key" ON "WarehouseLocation"("slug");
CREATE INDEX IF NOT EXISTS "WarehouseLocation_isActive_sortOrder_idx" ON "WarehouseLocation"("isActive", "sortOrder");
CREATE INDEX IF NOT EXISTS "WarehouseLocation_countryCode_city_idx" ON "WarehouseLocation"("countryCode", "city");
