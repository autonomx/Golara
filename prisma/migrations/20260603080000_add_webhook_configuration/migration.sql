CREATE TABLE IF NOT EXISTS "WebhookConfiguration" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "targetUrl" TEXT NOT NULL,
  "events" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "secretEnvVar" TEXT,
  "headerNames" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "WebhookConfiguration_key_key" ON "WebhookConfiguration" ("key");
CREATE INDEX IF NOT EXISTS "WebhookConfiguration_isActive_idx" ON "WebhookConfiguration" ("isActive");
CREATE INDEX IF NOT EXISTS "WebhookConfiguration_targetUrl_idx" ON "WebhookConfiguration" ("targetUrl");
CREATE UNIQUE INDEX IF NOT EXISTS "WebhookConfiguration_single_default_idx" ON "WebhookConfiguration" ("isDefault") WHERE "isDefault" = true;

INSERT INTO "WebhookConfiguration" (
  "key",
  "label",
  "description",
  "targetUrl",
  "events",
  "secretEnvVar",
  "headerNames",
  "isDefault",
  "isActive"
)
VALUES (
  'default-webhook-configuration',
  'Default webhook configuration',
  'Admin-managed webhook target and event subscription foundation. Secrets remain environment-managed.',
  'https://example.com/webhooks/golara',
  '["order.created", "order.updated"]'::jsonb,
  'GOLARA_WEBHOOK_SECRET',
  '["x-golara-signature"]'::jsonb,
  true,
  false
)
ON CONFLICT ("key") DO NOTHING;
