CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "CustomerWalletBalance" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "customerId" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'TOMAN',
  "availableBalanceCents" INTEGER NOT NULL DEFAULT 0,
  "reservedBalanceCents" INTEGER NOT NULL DEFAULT 0,
  "lifetimeCreditCents" INTEGER NOT NULL DEFAULT 0,
  "lifetimeDebitCents" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerWalletBalance_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CustomerWalletBalance_available_nonnegative" CHECK ("availableBalanceCents" >= 0),
  CONSTRAINT "CustomerWalletBalance_reserved_nonnegative" CHECK ("reservedBalanceCents" >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS "CustomerWalletBalance_customerId_currency_key" ON "CustomerWalletBalance" ("customerId", "currency");
CREATE INDEX IF NOT EXISTS "CustomerWalletBalance_customerId_idx" ON "CustomerWalletBalance" ("customerId");
CREATE INDEX IF NOT EXISTS "CustomerWalletBalance_currency_available_idx" ON "CustomerWalletBalance" ("currency", "availableBalanceCents");

CREATE TABLE IF NOT EXISTS "CustomerWalletLedgerEntry" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "walletId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "orderId" TEXT,
  "paymentAttemptId" TEXT,
  "entryType" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'posted',
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'TOMAN',
  "availableBalanceAfterCents" INTEGER NOT NULL,
  "reservedBalanceAfterCents" INTEGER NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "note" TEXT,
  "actorLabel" TEXT,
  "actorRole" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerWalletLedgerEntry_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "CustomerWalletBalance"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CustomerWalletLedgerEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CustomerWalletLedgerEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CheckoutOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "CustomerWalletLedgerEntry_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "CheckoutPaymentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "CustomerWalletLedgerEntry_amount_positive" CHECK ("amountCents" > 0),
  CONSTRAINT "CustomerWalletLedgerEntry_direction_valid" CHECK ("direction" IN ('credit', 'debit', 'reserve', 'release', 'capture')),
  CONSTRAINT "CustomerWalletLedgerEntry_status_valid" CHECK ("status" IN ('posted', 'reserved', 'released', 'captured', 'voided'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "CustomerWalletLedgerEntry_idempotencyKey_key" ON "CustomerWalletLedgerEntry" ("idempotencyKey");
CREATE INDEX IF NOT EXISTS "CustomerWalletLedgerEntry_walletId_createdAt_idx" ON "CustomerWalletLedgerEntry" ("walletId", "createdAt");
CREATE INDEX IF NOT EXISTS "CustomerWalletLedgerEntry_customerId_createdAt_idx" ON "CustomerWalletLedgerEntry" ("customerId", "createdAt");
CREATE INDEX IF NOT EXISTS "CustomerWalletLedgerEntry_orderId_idx" ON "CustomerWalletLedgerEntry" ("orderId");
CREATE INDEX IF NOT EXISTS "CustomerWalletLedgerEntry_paymentAttemptId_idx" ON "CustomerWalletLedgerEntry" ("paymentAttemptId");
CREATE INDEX IF NOT EXISTS "CustomerWalletLedgerEntry_entryType_status_idx" ON "CustomerWalletLedgerEntry" ("entryType", "status");
