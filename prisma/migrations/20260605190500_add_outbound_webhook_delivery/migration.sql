CREATE TABLE IF NOT EXISTS "OutboundWebhookDelivery" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "configurationKey" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "eventRef" TEXT NOT NULL,
  "payloadDigest" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'planned',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastOutcomeCategory" TEXT,
  "nextEligibleAttemptAt" TIMESTAMP(3),
  "lastResponseCode" INTEGER,
  "deadLetterSummary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OutboundWebhookDelivery_attemptCount_nonnegative_check" CHECK ("attemptCount" >= 0),
  CONSTRAINT "OutboundWebhookDelivery_status_check" CHECK (
    "status" IN (
      'planned',
      'queued',
      'sending',
      'accepted',
      'non_2xx',
      'timeout',
      'unavailable',
      'retry_wait',
      'cancelled',
      'dead_letter',
      'failed'
    )
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS "OutboundWebhookDelivery_idempotencyKey_key" ON "OutboundWebhookDelivery" ("idempotencyKey");
CREATE INDEX IF NOT EXISTS "OutboundWebhookDelivery_configurationKey_status_idx" ON "OutboundWebhookDelivery" ("configurationKey", "status");
CREATE INDEX IF NOT EXISTS "OutboundWebhookDelivery_eventType_eventRef_idx" ON "OutboundWebhookDelivery" ("eventType", "eventRef");
CREATE INDEX IF NOT EXISTS "OutboundWebhookDelivery_status_nextEligibleAttemptAt_idx" ON "OutboundWebhookDelivery" ("status", "nextEligibleAttemptAt");
CREATE INDEX IF NOT EXISTS "OutboundWebhookDelivery_createdAt_idx" ON "OutboundWebhookDelivery" ("createdAt");
