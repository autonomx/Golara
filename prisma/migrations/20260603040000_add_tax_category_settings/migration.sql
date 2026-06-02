CREATE TABLE IF NOT EXISTS "TaxCategorySetting" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "taxRateBasisPoints" INTEGER NOT NULL DEFAULT 0,
  "countryCode" TEXT NOT NULL DEFAULT 'CA',
  "regionCode" TEXT,
  "appliesToShipping" BOOLEAN NOT NULL DEFAULT false,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "TaxCategorySetting_key_key" ON "TaxCategorySetting" ("key");
CREATE INDEX IF NOT EXISTS "TaxCategorySetting_country_region_idx" ON "TaxCategorySetting" ("countryCode", "regionCode");
CREATE INDEX IF NOT EXISTS "TaxCategorySetting_isActive_idx" ON "TaxCategorySetting" ("isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "TaxCategorySetting_single_default_idx" ON "TaxCategorySetting" ("isDefault") WHERE "isDefault" = true;

INSERT INTO "TaxCategorySetting" (
  "key",
  "label",
  "description",
  "taxRateBasisPoints",
  "countryCode",
  "regionCode",
  "appliesToShipping",
  "isDefault",
  "isActive"
)
VALUES (
  'standard-ca',
  'Standard Canadian tax',
  'Default tax category foundation for taxable products and delivery rules.',
  500,
  'CA',
  NULL,
  false,
  true,
  true
)
ON CONFLICT ("key") DO NOTHING;
