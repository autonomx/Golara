CREATE TABLE IF NOT EXISTS "PaymentOperationRecord" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId" TEXT NOT NULL,
  "paymentAttemptId" TEXT NOT NULL,
  "orderNumber" TEXT,
  "operationKind" TEXT NOT NULL,
  "requestedAmountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "originalPaymentAmountCents" INTEGER,
  "originalPaymentCurrency" TEXT,
  "provider" TEXT NOT NULL,
  "providerReference" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "operatorId" TEXT,
  "operatorLabel" TEXT,
  "operatorEmail" TEXT,
  "operatorReason" TEXT,
  "previewDecision" TEXT NOT NULL,
  "previewReasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" TEXT NOT NULL DEFAULT 'pending',
  "providerOperationReference" TEXT,
  "providerStatus" TEXT,
  "errorCategory" TEXT,
  "retryable" BOOLEAN NOT NULL DEFAULT false,
  "transitionPlan" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "submittedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentOperationRecord_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CheckoutOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PaymentOperationRecord_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "CheckoutPaymentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentOperationRecord_idempotencyKey_key" ON "PaymentOperationRecord" ("idempotencyKey");
CREATE INDEX IF NOT EXISTS "PaymentOperationRecord_orderId_idx" ON "PaymentOperationRecord" ("orderId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "PaymentOperationRecord_paymentAttemptId_idx" ON "PaymentOperationRecord" ("paymentAttemptId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "PaymentOperationRecord_provider_status_idx" ON "PaymentOperationRecord" ("provider", "status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "PaymentOperationRecord_kind_status_idx" ON "PaymentOperationRecord" ("operationKind", "status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "PaymentOperationRecord_provider_reference_idx" ON "PaymentOperationRecord" ("provider", "providerReference");
