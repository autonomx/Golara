-- Phase 7.4: Channel-specific price override foundation.
-- This table allows per-channel product or variant pricing without changing global catalog prices.
CREATE TABLE IF NOT EXISTS "ProductChannelPriceOverride" (
  "id" TEXT NOT NULL,
  "channelId" TEXT NOT NULL,
  "productId" TEXT,
  "variantId" TEXT,
  "priceCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'TOMAN',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProductChannelPriceOverride_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductChannelPriceOverride_channel_fkey" FOREIGN KEY ("channelId") REFERENCES "StorefrontChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProductChannelPriceOverride_product_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProductChannelPriceOverride_variant_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProductChannelPriceOverride_target_chk" CHECK (("productId" IS NOT NULL AND "variantId" IS NULL) OR ("productId" IS NULL AND "variantId" IS NOT NULL)),
  CONSTRAINT "ProductChannelPriceOverride_price_nonnegative_chk" CHECK ("priceCents" >= 0),
  CONSTRAINT "ProductChannelPriceOverride_window_order_chk" CHECK ("startsAt" IS NULL OR "endsAt" IS NULL OR "startsAt" <= "endsAt")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProductChannelPriceOverride_channel_product_key"
  ON "ProductChannelPriceOverride" ("channelId", "productId")
  WHERE "productId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "ProductChannelPriceOverride_channel_variant_key"
  ON "ProductChannelPriceOverride" ("channelId", "variantId")
  WHERE "variantId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "ProductChannelPriceOverride_channel_active_idx"
  ON "ProductChannelPriceOverride" ("channelId", "isActive");

CREATE INDEX IF NOT EXISTS "ProductChannelPriceOverride_currency_idx"
  ON "ProductChannelPriceOverride" ("currency");

CREATE INDEX IF NOT EXISTS "ProductChannelPriceOverride_window_idx"
  ON "ProductChannelPriceOverride" ("startsAt", "endsAt");
