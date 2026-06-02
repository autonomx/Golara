-- Phase 7.3: Channel-specific product availability foundation.
-- This table keeps storefront/channel catalog visibility separate from global product activity.
CREATE TABLE IF NOT EXISTS "ProductChannelAvailability" (
  "id" TEXT NOT NULL,
  "channelId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "isAvailable" BOOLEAN NOT NULL DEFAULT true,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProductChannelAvailability_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductChannelAvailability_channel_fkey" FOREIGN KEY ("channelId") REFERENCES "StorefrontChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProductChannelAvailability_product_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProductChannelAvailability_window_order_chk" CHECK ("startsAt" IS NULL OR "endsAt" IS NULL OR "startsAt" <= "endsAt")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProductChannelAvailability_channel_product_key"
  ON "ProductChannelAvailability" ("channelId", "productId");

CREATE INDEX IF NOT EXISTS "ProductChannelAvailability_channel_available_idx"
  ON "ProductChannelAvailability" ("channelId", "isAvailable", "isPublished");

CREATE INDEX IF NOT EXISTS "ProductChannelAvailability_product_available_idx"
  ON "ProductChannelAvailability" ("productId", "isAvailable", "isPublished");

CREATE INDEX IF NOT EXISTS "ProductChannelAvailability_window_idx"
  ON "ProductChannelAvailability" ("startsAt", "endsAt");
