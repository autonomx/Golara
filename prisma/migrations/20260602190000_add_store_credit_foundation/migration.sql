CREATE TABLE IF NOT EXISTS "PromotionStoreCredit" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "customerId" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'TOMAN',
  "initialBalanceCents" INTEGER NOT NULL,
  "balanceCents" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "expiresAt" TIMESTAMP(3),
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PromotionStoreCredit_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PromotionStoreCredit_initial_balance_nonnegative_chk" CHECK ("initialBalanceCents" >= 0),
  CONSTRAINT "PromotionStoreCredit_balance_nonnegative_chk" CHECK ("balanceCents" >= 0),
  CONSTRAINT "PromotionStoreCredit_balance_not_above_initial_chk" CHECK ("balanceCents" <= "initialBalanceCents")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PromotionStoreCredit_code_key"
  ON "PromotionStoreCredit"("code");

CREATE INDEX IF NOT EXISTS "PromotionStoreCredit_customer_idx"
  ON "PromotionStoreCredit"("customerId");

CREATE INDEX IF NOT EXISTS "PromotionStoreCredit_status_active_idx"
  ON "PromotionStoreCredit"("status", "isActive");

CREATE INDEX IF NOT EXISTS "PromotionStoreCredit_balance_idx"
  ON "PromotionStoreCredit"("balanceCents");

CREATE INDEX IF NOT EXISTS "PromotionStoreCredit_expiry_idx"
  ON "PromotionStoreCredit"("expiresAt");
