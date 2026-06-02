CREATE TABLE IF NOT EXISTS "CheckoutOrderNotificationAction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastAttemptAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "actorLabel" TEXT,
    "actorRole" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckoutOrderNotificationAction_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CheckoutOrderNotificationAction"
    ADD CONSTRAINT "CheckoutOrderNotificationAction_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "CheckoutOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "CheckoutOrderNotificationAction_orderId_createdAt_idx"
    ON "CheckoutOrderNotificationAction"("orderId", "createdAt");

CREATE INDEX IF NOT EXISTS "CheckoutOrderNotificationAction_status_nextRetryAt_idx"
    ON "CheckoutOrderNotificationAction"("status", "nextRetryAt");

CREATE INDEX IF NOT EXISTS "CheckoutOrderNotificationAction_channel_status_idx"
    ON "CheckoutOrderNotificationAction"("channel", "status");
