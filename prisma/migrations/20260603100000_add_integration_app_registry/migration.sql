CREATE TABLE IF NOT EXISTS "IntegrationAppRegistry" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL DEFAULT 'custom',
  "provider" TEXT,
  "status" TEXT NOT NULL DEFAULT 'planned',
  "homepageUrl" TEXT,
  "docsUrl" TEXT,
  "webhookConfigurationKey" TEXT,
  "permissions" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "requiredEnvVars" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "isInternal" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "IntegrationAppRegistry_key_key" ON "IntegrationAppRegistry" ("key");
CREATE INDEX IF NOT EXISTS "IntegrationAppRegistry_category_idx" ON "IntegrationAppRegistry" ("category");
CREATE INDEX IF NOT EXISTS "IntegrationAppRegistry_status_idx" ON "IntegrationAppRegistry" ("status");
CREATE INDEX IF NOT EXISTS "IntegrationAppRegistry_isActive_idx" ON "IntegrationAppRegistry" ("isActive");
CREATE INDEX IF NOT EXISTS "IntegrationAppRegistry_webhookConfigurationKey_idx" ON "IntegrationAppRegistry" ("webhookConfigurationKey") WHERE "webhookConfigurationKey" IS NOT NULL;

INSERT INTO "IntegrationAppRegistry" (
  "key",
  "label",
  "description",
  "category",
  "provider",
  "status",
  "homepageUrl",
  "docsUrl",
  "webhookConfigurationKey",
  "permissions",
  "requiredEnvVars",
  "isInternal",
  "isActive"
)
VALUES (
  'default-webhook-app',
  'Default webhook app',
  'Placeholder integration registry entry for Golara webhook-based automations.',
  'webhook',
  'golara',
  'planned',
  NULL,
  NULL,
  'default-webhook-configuration',
  '["webhooks:read", "webhooks:write"]'::jsonb,
  '["GOLARA_WEBHOOK_SECRET"]'::jsonb,
  true,
  false
)
ON CONFLICT ("key") DO NOTHING;
