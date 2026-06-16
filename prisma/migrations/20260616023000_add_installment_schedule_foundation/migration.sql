CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "InstallmentPaymentPlan" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "orderId" TEXT NOT NULL,
  "paymentAttemptId" TEXT NOT NULL,
  "customerId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "currency" TEXT NOT NULL DEFAULT 'TOMAN',
  "principalCents" INTEGER NOT NULL,
  "downPaymentCents" INTEGER NOT NULL DEFAULT 0,
  "financedAmountCents" INTEGER NOT NULL,
  "termMonths" INTEGER NOT NULL,
  "installmentCount" INTEGER NOT NULL,
  "intervalMonths" INTEGER NOT NULL DEFAULT 1,
  "firstDueAt" TIMESTAMP(3) NOT NULL,
  "approvedAt" TIMESTAMP(3),
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InstallmentPaymentPlan_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InstallmentPaymentPlan_amounts_non_negative" CHECK ("principalCents" >= 0 AND "downPaymentCents" >= 0 AND "financedAmountCents" >= 0),
  CONSTRAINT "InstallmentPaymentPlan_terms_positive" CHECK ("termMonths" > 0 AND "installmentCount" > 0 AND "intervalMonths" > 0)
);

CREATE TABLE IF NOT EXISTS "InstallmentPaymentScheduleEntry" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "planId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "dueAt" TIMESTAMP(3) NOT NULL,
  "principalCents" INTEGER NOT NULL,
  "feeCents" INTEGER NOT NULL DEFAULT 0,
  "totalCents" INTEGER NOT NULL,
  "paidAt" TIMESTAMP(3),
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InstallmentPaymentScheduleEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InstallmentPaymentScheduleEntry_sequence_positive" CHECK ("sequence" > 0),
  CONSTRAINT "InstallmentPaymentScheduleEntry_amounts_non_negative" CHECK ("principalCents" >= 0 AND "feeCents" >= 0 AND "totalCents" >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS "InstallmentPaymentPlan_paymentAttemptId_key" ON "InstallmentPaymentPlan"("paymentAttemptId");
CREATE INDEX IF NOT EXISTS "InstallmentPaymentPlan_orderId_idx" ON "InstallmentPaymentPlan"("orderId");
CREATE INDEX IF NOT EXISTS "InstallmentPaymentPlan_customerId_idx" ON "InstallmentPaymentPlan"("customerId");
CREATE INDEX IF NOT EXISTS "InstallmentPaymentPlan_status_createdAt_idx" ON "InstallmentPaymentPlan"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "InstallmentPaymentPlan_firstDueAt_idx" ON "InstallmentPaymentPlan"("firstDueAt");

CREATE UNIQUE INDEX IF NOT EXISTS "InstallmentPaymentScheduleEntry_planId_sequence_key" ON "InstallmentPaymentScheduleEntry"("planId", "sequence");
CREATE INDEX IF NOT EXISTS "InstallmentPaymentScheduleEntry_planId_status_idx" ON "InstallmentPaymentScheduleEntry"("planId", "status");
CREATE INDEX IF NOT EXISTS "InstallmentPaymentScheduleEntry_status_dueAt_idx" ON "InstallmentPaymentScheduleEntry"("status", "dueAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'InstallmentPaymentPlan_orderId_fkey'
  ) THEN
    ALTER TABLE "InstallmentPaymentPlan"
      ADD CONSTRAINT "InstallmentPaymentPlan_orderId_fkey"
      FOREIGN KEY ("orderId") REFERENCES "CheckoutOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'InstallmentPaymentPlan_paymentAttemptId_fkey'
  ) THEN
    ALTER TABLE "InstallmentPaymentPlan"
      ADD CONSTRAINT "InstallmentPaymentPlan_paymentAttemptId_fkey"
      FOREIGN KEY ("paymentAttemptId") REFERENCES "CheckoutPaymentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'InstallmentPaymentPlan_customerId_fkey'
  ) THEN
    ALTER TABLE "InstallmentPaymentPlan"
      ADD CONSTRAINT "InstallmentPaymentPlan_customerId_fkey"
      FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'InstallmentPaymentScheduleEntry_planId_fkey'
  ) THEN
    ALTER TABLE "InstallmentPaymentScheduleEntry"
      ADD CONSTRAINT "InstallmentPaymentScheduleEntry_planId_fkey"
      FOREIGN KEY ("planId") REFERENCES "InstallmentPaymentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
