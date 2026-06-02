CREATE TABLE IF NOT EXISTS "NotificationProviderSetting" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "emailProvider" TEXT NOT NULL DEFAULT 'manual',
  "smsProvider" TEXT NOT NULL DEFAULT 'manual',
  "defaultFromEmail" TEXT,
  "defaultFromPhone" TEXT,
  "replyToEmail" TEXT,
  "enableOrderEmail" BOOLEAN NOT NULL DEFAULT true,
  "enableOrderSms" BOOLEAN NOT NULL DEFAULT false,
  "requireEmailProviderEnv" BOOLEAN NOT NULL DEFAULT false,
  "requireSmsProviderEnv" BOOLEAN NOT NULL DEFAULT false,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "NotificationProviderSetting_key_key" ON "NotificationProviderSetting" ("key");
CREATE INDEX IF NOT EXISTS "NotificationProviderSetting_emailProvider_idx" ON "NotificationProviderSetting" ("emailProvider");
CREATE INDEX IF NOT EXISTS "NotificationProviderSetting_smsProvider_idx" ON "NotificationProviderSetting" ("smsProvider");
CREATE INDEX IF NOT EXISTS "NotificationProviderSetting_isActive_idx" ON "NotificationProviderSetting" ("isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationProviderSetting_single_default_idx" ON "NotificationProviderSetting" ("isDefault") WHERE "isDefault" = true;

INSERT INTO "NotificationProviderSetting" (
  "key",
  "label",
  "description",
  "emailProvider",
  "smsProvider",
  "enableOrderEmail",
  "enableOrderSms",
  "requireEmailProviderEnv",
  "requireSmsProviderEnv",
  "isDefault",
  "isActive"
)
VALUES (
  'default-notification-readiness',
  'Default notification readiness',
  'Admin-managed notification provider readiness settings. Provider secrets remain environment-managed.',
  'manual',
  'manual',
  true,
  false,
  false,
  false,
  true,
  true
)
ON CONFLICT ("key") DO NOTHING;
