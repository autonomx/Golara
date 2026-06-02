CREATE TABLE IF NOT EXISTS "FulfillmentMethodSetting" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "requiresAddress" BOOLEAN NOT NULL DEFAULT false,
  "requiresScheduling" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "FulfillmentMethodSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FulfillmentMethodSetting_key_key" ON "FulfillmentMethodSetting"("key");
CREATE INDEX IF NOT EXISTS "FulfillmentMethodSetting_isActive_sortOrder_idx" ON "FulfillmentMethodSetting"("isActive", "sortOrder");
CREATE INDEX IF NOT EXISTS "FulfillmentMethodSetting_isDefault_idx" ON "FulfillmentMethodSetting"("isDefault");

INSERT INTO "FulfillmentMethodSetting" ("id", "key", "label", "description", "isActive", "isDefault", "requiresAddress", "requiresScheduling", "sortOrder")
VALUES
  ('fulfillment-method-delivery', 'delivery', 'Delivery', 'Local delivery handled by staff or a delivery partner.', true, true, true, true, 10),
  ('fulfillment-method-pickup', 'pickup', 'Pickup', 'Customer pickup from a configured shop or studio location.', true, false, false, true, 20),
  ('fulfillment-method-courier', 'courier', 'Courier', 'Courier or distance delivery coordinated manually.', false, false, true, true, 30),
  ('fulfillment-method-manual', 'manual', 'Manual', 'Staff-confirmed fulfillment for quote-only or custom orders.', true, false, false, false, 40)
ON CONFLICT ("key") DO NOTHING;
