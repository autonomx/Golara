CREATE TABLE IF NOT EXISTS "PaymentSettlementReconciliation" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "paymentEventId" TEXT NOT NULL,
  "paymentAttemptId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerReference" TEXT,
  "orderNumber" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "expectedAmountCents" INTEGER,
  "actualAmountCents" INTEGER,
  "expectedCurrency" TEXT,
  "actualCurrency" TEXT,
  "needsAttention" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentSettlementReconciliation_paymentEventId_fkey" FOREIGN KEY ("paymentEventId") REFERENCES "CheckoutPaymentEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PaymentSettlementReconciliation_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "CheckoutPaymentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PaymentSettlementReconciliation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CheckoutOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentSettlementReconciliation_paymentEventId_key" ON "PaymentSettlementReconciliation" ("paymentEventId");
CREATE INDEX IF NOT EXISTS "PaymentSettlementReconciliation_paymentAttemptId_idx" ON "PaymentSettlementReconciliation" ("paymentAttemptId");
CREATE INDEX IF NOT EXISTS "PaymentSettlementReconciliation_orderId_idx" ON "PaymentSettlementReconciliation" ("orderId");
CREATE INDEX IF NOT EXISTS "PaymentSettlementReconciliation_provider_idx" ON "PaymentSettlementReconciliation" ("provider", "status");
CREATE INDEX IF NOT EXISTS "PaymentSettlementReconciliation_status_idx" ON "PaymentSettlementReconciliation" ("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "PaymentSettlementReconciliation_needsAttention_idx" ON "PaymentSettlementReconciliation" ("needsAttention", "createdAt" DESC);
