CREATE TABLE IF NOT EXISTS "WebhookEventLog" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "webhookConfigurationKey" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  "targetUrl" TEXT NOT NULL,
  "payloadDigest" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastStatusCode" INTEGER,
  "lastError" TEXT,
  "nextAttemptAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "WebhookEventLog_configuration_idx" ON "WebhookEventLog" ("webhookConfigurationKey");
CREATE INDEX IF NOT EXISTS "WebhookEventLog_eventName_idx" ON "WebhookEventLog" ("eventName");
CREATE INDEX IF NOT EXISTS "WebhookEventLog_status_idx" ON "WebhookEventLog" ("status");
CREATE INDEX IF NOT EXISTS "WebhookEventLog_createdAt_idx" ON "WebhookEventLog" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "WebhookEventLog_nextAttemptAt_idx" ON "WebhookEventLog" ("nextAttemptAt") WHERE "nextAttemptAt" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "WebhookEventLog_payloadDigest_key" ON "WebhookEventLog" ("payloadDigest");
