CREATE TABLE IF NOT EXISTS "StoreSetting" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "key" TEXT NOT NULL DEFAULT 'primary',
  "storeName" TEXT NOT NULL DEFAULT 'Golara',
  "legalName" TEXT,
  "supportEmail" TEXT,
  "supportPhone" TEXT,
  "defaultLocale" TEXT NOT NULL DEFAULT 'fa-IR',
  "defaultCurrency" TEXT NOT NULL DEFAULT 'TOMAN',
  "timezone" TEXT NOT NULL DEFAULT 'America/Vancouver',
  "storefrontBaseUrl" TEXT,
  "isMaintenanceMode" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "StoreSetting_key_key" ON "StoreSetting" ("key");
CREATE INDEX IF NOT EXISTS "StoreSetting_defaultLocale_defaultCurrency_idx" ON "StoreSetting" ("defaultLocale", "defaultCurrency");

INSERT INTO "StoreSetting" (
  "key",
  "storeName",
  "defaultLocale",
  "defaultCurrency",
  "timezone",
  "isMaintenanceMode"
)
VALUES ('primary', 'Golara', 'fa-IR', 'TOMAN', 'America/Vancouver', false)
ON CONFLICT ("key") DO NOTHING;
