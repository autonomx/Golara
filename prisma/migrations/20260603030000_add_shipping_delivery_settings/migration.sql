CREATE TABLE IF NOT EXISTS "ShippingDeliverySetting" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "deliveryFeeCents" INTEGER NOT NULL DEFAULT 0,
  "freeDeliveryMinimumCents" INTEGER,
  "minimumOrderCents" INTEGER,
  "deliveryRadiusKm" INTEGER,
  "deliveryPostalCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "pickupAddress" TEXT,
  "deliveryInstructions" TEXT,
  "sameDayCutoffMinutes" INTEGER,
  "timezone" TEXT NOT NULL DEFAULT 'America/Vancouver',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "ShippingDeliverySetting_key_key" ON "ShippingDeliverySetting" ("key");
CREATE INDEX IF NOT EXISTS "ShippingDeliverySetting_isActive_idx" ON "ShippingDeliverySetting" ("isActive");
CREATE INDEX IF NOT EXISTS "ShippingDeliverySetting_deliveryRadiusKm_idx" ON "ShippingDeliverySetting" ("deliveryRadiusKm");

INSERT INTO "ShippingDeliverySetting" (
  "key",
  "label",
  "description",
  "deliveryFeeCents",
  "freeDeliveryMinimumCents",
  "minimumOrderCents",
  "deliveryRadiusKm",
  "deliveryPostalCodes",
  "pickupAddress",
  "deliveryInstructions",
  "sameDayCutoffMinutes",
  "timezone",
  "isActive"
)
VALUES (
  'primary',
  'Local delivery settings',
  'Default local shipping and delivery rules for checkout and staff workflows.',
  1500,
  NULL,
  NULL,
  25,
  ARRAY[]::TEXT[],
  NULL,
  'Delivery windows are confirmed by staff after checkout.',
  780,
  'America/Vancouver',
  true
)
ON CONFLICT ("key") DO NOTHING;
