CREATE TABLE IF NOT EXISTS "PaymentProviderSetting" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "checkoutMode" TEXT NOT NULL DEFAULT 'inquiry',
  "domesticProvider" TEXT NOT NULL DEFAULT 'manual',
  "overseasProvider" TEXT,
  "domesticCurrency" TEXT NOT NULL DEFAULT 'TOMAN',
  "overseasCurrency" TEXT NOT NULL DEFAULT 'USD',
  "overseasFallback" TEXT NOT NULL DEFAULT 'whatsapp',
  "requireIranianGatewayMerchantId" BOOLEAN NOT NULL DEFAULT false,
  "requireStripeSecretKey" BOOLEAN NOT NULL DEFAULT false,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentProviderSetting_key_key" ON "PaymentProviderSetting" ("key");
CREATE INDEX IF NOT EXISTS "PaymentProviderSetting_checkoutMode_idx" ON "PaymentProviderSetting" ("checkoutMode");
CREATE INDEX IF NOT EXISTS "PaymentProviderSetting_isActive_idx" ON "PaymentProviderSetting" ("isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentProviderSetting_single_default_idx" ON "PaymentProviderSetting" ("isDefault") WHERE "isDefault" = true;

INSERT INTO "PaymentProviderSetting" (
  "key",
  "label",
  "description",
  "checkoutMode",
  "domesticProvider",
  "overseasProvider",
  "domesticCurrency",
  "overseasCurrency",
  "overseasFallback",
  "requireIranianGatewayMerchantId",
  "requireStripeSecretKey",
  "isDefault",
  "isActive"
)
VALUES (
  'default-payment-readiness',
  'Default payment readiness',
  'Admin-managed payment provider readiness settings. Provider secrets remain environment-managed.',
  'inquiry',
  'manual',
  NULL,
  'TOMAN',
  'USD',
  'whatsapp',
  false,
  false,
  true,
  true
)
ON CONFLICT ("key") DO NOTHING;
