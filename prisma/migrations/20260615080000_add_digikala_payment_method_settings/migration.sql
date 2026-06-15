CREATE TABLE IF NOT EXISTS "PaymentMethodSetting" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "methodType" TEXT NOT NULL DEFAULT 'manual',
  "providerKey" TEXT NOT NULL DEFAULT 'manual',
  "settlementMode" TEXT NOT NULL DEFAULT 'manual',
  "captureMode" TEXT NOT NULL DEFAULT 'manual_review',
  "currency" TEXT NOT NULL DEFAULT 'TOMAN',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "requiresManualReview" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentMethodSetting_key_key" ON "PaymentMethodSetting" ("key");
CREATE INDEX IF NOT EXISTS "PaymentMethodSetting_isActive_sortOrder_idx" ON "PaymentMethodSetting" ("isActive", "sortOrder");
CREATE INDEX IF NOT EXISTS "PaymentMethodSetting_methodType_idx" ON "PaymentMethodSetting" ("methodType");
CREATE INDEX IF NOT EXISTS "PaymentMethodSetting_providerKey_idx" ON "PaymentMethodSetting" ("providerKey");

INSERT INTO "PaymentMethodSetting" (
  "key",
  "label",
  "description",
  "methodType",
  "providerKey",
  "settlementMode",
  "captureMode",
  "currency",
  "isActive",
  "isDefault",
  "requiresManualReview",
  "sortOrder",
  "metadata"
)
VALUES
  (
    'iranian-ipg',
    'Online card payment / Iranian IPG',
    'DigiKala-style domestic online card checkout through an Iranian IPG such as ZarinPal or a direct PSP adapter.',
    'gateway',
    'zarinpal',
    'gateway_settlement',
    'redirect_capture',
    'TOMAN',
    true,
    true,
    false,
    10,
    '{"digikalaLike":true,"requiresEnv":["ZARINPAL_MERCHANT_ID"],"checkoutSurface":"online_redirect"}'::jsonb
  ),
  (
    'wallet-credit',
    'Wallet / store credit',
    'DigiPay-style customer wallet or Golara store-credit balance. Enabled by default but requires wallet-ledger execution before live automated capture.',
    'wallet',
    'internal_wallet',
    'internal_ledger',
    'ledger_capture',
    'TOMAN',
    true,
    false,
    true,
    20,
    '{"digikalaLike":true,"requiresLedger":true,"checkoutSurface":"account_wallet"}'::jsonb
  ),
  (
    'installment-credit',
    'Installment / credit purchase',
    'BNPL or installment purchase lane similar to DigiPay credit. Enabled by default for admin configuration; manual review remains required until a credit provider adapter is connected.',
    'installment',
    'manual_credit',
    'provider_reconciliation',
    'manual_review',
    'TOMAN',
    true,
    false,
    true,
    30,
    '{"digikalaLike":true,"requiresProviderContract":true,"checkoutSurface":"credit_application"}'::jsonb
  ),
  (
    'bank-transfer',
    'Bank transfer / card-to-card',
    'Manual bank transfer or card-to-card confirmation lane for staff-assisted domestic orders.',
    'manual_transfer',
    'bank_transfer',
    'manual_reconciliation',
    'manual_review',
    'TOMAN',
    true,
    false,
    true,
    40,
    '{"digikalaLike":true,"checkoutSurface":"payment_instructions"}'::jsonb
  ),
  (
    'cash-on-delivery',
    'Cash / pay on delivery',
    'Pay-on-delivery lane for eligible local deliveries. Requires fulfillment/staff confirmation before order completion.',
    'cod',
    'cash_on_delivery',
    'delivery_collection',
    'manual_review',
    'TOMAN',
    true,
    false,
    true,
    50,
    '{"digikalaLike":true,"requiresFulfillmentEligibility":true,"checkoutSurface":"delivery_collection"}'::jsonb
  )
ON CONFLICT ("key") DO NOTHING;
