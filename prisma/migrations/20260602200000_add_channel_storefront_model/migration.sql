-- Phase 7.1: Channel/storefront model foundation.
-- Provides a durable multi-market/storefront context without wiring products or checkout yet.
CREATE TABLE IF NOT EXISTS "StorefrontChannel" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'TOMAN',
  "locale" TEXT NOT NULL DEFAULT 'fa-IR',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StorefrontChannel_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StorefrontChannel_slug_key"
  ON "StorefrontChannel" ("slug");

CREATE UNIQUE INDEX IF NOT EXISTS "StorefrontChannel_default_unique_idx"
  ON "StorefrontChannel" ("isDefault")
  WHERE "isDefault" = true;

CREATE INDEX IF NOT EXISTS "StorefrontChannel_active_default_idx"
  ON "StorefrontChannel" ("isActive", "isDefault");

CREATE INDEX IF NOT EXISTS "StorefrontChannel_currency_locale_idx"
  ON "StorefrontChannel" ("currency", "locale");
