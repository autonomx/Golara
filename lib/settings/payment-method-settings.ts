import 'server-only';

import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { hasDatabase, prisma } from '@/lib/prisma';

export const PAYMENT_METHOD_TYPES = ['gateway', 'wallet', 'installment', 'manual_transfer', 'cod'] as const;
export const PAYMENT_METHOD_CAPTURE_MODES = ['redirect_capture', 'ledger_capture', 'manual_review'] as const;
export const PAYMENT_METHOD_SETTLEMENT_MODES = ['gateway_settlement', 'internal_ledger', 'provider_reconciliation', 'manual_reconciliation', 'delivery_collection'] as const;

export type PaymentMethodType = typeof PAYMENT_METHOD_TYPES[number];
export type PaymentMethodCaptureMode = typeof PAYMENT_METHOD_CAPTURE_MODES[number];
export type PaymentMethodSettlementMode = typeof PAYMENT_METHOD_SETTLEMENT_MODES[number];

export type PaymentMethodSetting = {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  methodType: PaymentMethodType;
  providerKey: string;
  settlementMode: PaymentMethodSettlementMode;
  captureMode: PaymentMethodCaptureMode;
  currency: string;
  isActive: boolean;
  isDefault: boolean;
  requiresManualReview: boolean;
  sortOrder: number;
  metadata?: unknown;
  updatedAt?: Date;
};

export type PaymentMethodSettingInput = {
  key: string;
  label: string;
  description?: string | null;
  methodType: string;
  providerKey: string;
  settlementMode: string;
  captureMode: string;
  currency: string;
  isActive: boolean;
  isDefault: boolean;
  requiresManualReview: boolean;
  sortOrder: number;
};

export const DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS: PaymentMethodSetting[] = [
  {
    id: 'payment-method-iranian-ipg',
    key: 'iranian-ipg',
    label: 'Online card payment / Iranian IPG',
    description: 'DigiKala-style domestic online card checkout through an Iranian IPG such as ZarinPal or a direct PSP adapter.',
    methodType: 'gateway',
    providerKey: 'zarinpal',
    settlementMode: 'gateway_settlement',
    captureMode: 'redirect_capture',
    currency: 'TOMAN',
    isActive: true,
    isDefault: true,
    requiresManualReview: false,
    sortOrder: 10,
    metadata: { digikalaLike: true, requiresEnv: ['ZARINPAL_MERCHANT_ID'], checkoutSurface: 'online_redirect' }
  },
  {
    id: 'payment-method-wallet-credit',
    key: 'wallet-credit',
    label: 'Wallet / store credit',
    description: 'DigiPay-style customer wallet or Golara store-credit balance. Enabled by default but requires wallet-ledger execution before live automated capture.',
    methodType: 'wallet',
    providerKey: 'internal_wallet',
    settlementMode: 'internal_ledger',
    captureMode: 'ledger_capture',
    currency: 'TOMAN',
    isActive: true,
    isDefault: false,
    requiresManualReview: true,
    sortOrder: 20,
    metadata: { digikalaLike: true, requiresLedger: true, checkoutSurface: 'account_wallet' }
  },
  {
    id: 'payment-method-installment-credit',
    key: 'installment-credit',
    label: 'Installment / credit purchase',
    description: 'BNPL or installment purchase lane similar to DigiPay credit. Enabled by default for admin configuration; manual review remains required until a credit provider adapter is connected.',
    methodType: 'installment',
    providerKey: 'manual_credit',
    settlementMode: 'provider_reconciliation',
    captureMode: 'manual_review',
    currency: 'TOMAN',
    isActive: true,
    isDefault: false,
    requiresManualReview: true,
    sortOrder: 30,
    metadata: { digikalaLike: true, requiresProviderContract: true, checkoutSurface: 'credit_application' }
  },
  {
    id: 'payment-method-bank-transfer',
    key: 'bank-transfer',
    label: 'Bank transfer / card-to-card',
    description: 'Manual bank transfer or card-to-card confirmation lane for staff-assisted domestic orders.',
    methodType: 'manual_transfer',
    providerKey: 'bank_transfer',
    settlementMode: 'manual_reconciliation',
    captureMode: 'manual_review',
    currency: 'TOMAN',
    isActive: true,
    isDefault: false,
    requiresManualReview: true,
    sortOrder: 40,
    metadata: { digikalaLike: true, checkoutSurface: 'payment_instructions' }
  },
  {
    id: 'payment-method-cash-on-delivery',
    key: 'cash-on-delivery',
    label: 'Cash / pay on delivery',
    description: 'Pay-on-delivery lane for eligible local deliveries. Requires fulfillment/staff confirmation before order completion.',
    methodType: 'cod',
    providerKey: 'cash_on_delivery',
    settlementMode: 'delivery_collection',
    captureMode: 'manual_review',
    currency: 'TOMAN',
    isActive: true,
    isDefault: false,
    requiresManualReview: true,
    sortOrder: 50,
    metadata: { digikalaLike: true, requiresFulfillmentEligibility: true, checkoutSurface: 'delivery_collection' }
  }
];

function optionalText(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

function normalizeSlug(value?: string | null) {
  const normalized = optionalText(value)?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return normalized || 'iranian-ipg';
}

function normalizeEnum<T extends string>(value: string | null | undefined, allowed: readonly T[], fallback: T): T {
  const normalized = value?.trim().toLowerCase();
  return allowed.find((item) => item.toLowerCase() === normalized) ?? fallback;
}

function normalizeProviderKey(value?: string | null) {
  return normalizeSlug(value).replace(/-/g, '_');
}

function isMissingPaymentMethodSettingTable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('PaymentMethodSetting') && (message.includes('does not exist') || message.includes('42P01'));
}

function mapPaymentMethodSetting(row: PaymentMethodSetting): PaymentMethodSetting {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    description: row.description ?? null,
    methodType: row.methodType,
    providerKey: row.providerKey,
    settlementMode: row.settlementMode,
    captureMode: row.captureMode,
    currency: row.currency,
    isActive: row.isActive,
    isDefault: row.isDefault,
    requiresManualReview: row.requiresManualReview,
    sortOrder: row.sortOrder,
    metadata: row.metadata ?? {},
    updatedAt: row.updatedAt
  };
}

export function normalizePaymentMethodSettingInput(input: PaymentMethodSettingInput): PaymentMethodSettingInput {
  return {
    key: normalizeSlug(input.key),
    label: optionalText(input.label) ?? 'Payment method',
    description: optionalText(input.description),
    methodType: normalizeEnum(input.methodType, PAYMENT_METHOD_TYPES, 'manual_transfer'),
    providerKey: normalizeProviderKey(input.providerKey),
    settlementMode: normalizeEnum(input.settlementMode, PAYMENT_METHOD_SETTLEMENT_MODES, 'manual_reconciliation'),
    captureMode: normalizeEnum(input.captureMode, PAYMENT_METHOD_CAPTURE_MODES, 'manual_review'),
    currency: optionalText(input.currency)?.toUpperCase() ?? 'TOMAN',
    isActive: input.isActive,
    isDefault: input.isDefault,
    requiresManualReview: input.requiresManualReview,
    sortOrder: Number.isFinite(input.sortOrder) ? input.sortOrder : 0
  };
}

export function listEnabledPaymentMethodKeys(settings: PaymentMethodSetting[]) {
  return settings.filter((setting) => setting.isActive).sort((a, b) => a.sortOrder - b.sortOrder).map((setting) => setting.key);
}

export function buildPaymentMethodReadinessNotes(setting: PaymentMethodSetting, env: Record<string, string | undefined>) {
  const notes: string[] = [];
  if (setting.key === 'iranian-ipg' && !env.ZARINPAL_MERCHANT_ID && !env.IRANIAN_GATEWAY_MERCHANT_ID) {
    notes.push('Set ZARINPAL_MERCHANT_ID or IRANIAN_GATEWAY_MERCHANT_ID before live online capture.');
  }
  if (setting.methodType === 'wallet') notes.push('Wallet capture requires internal wallet ledger execution before live automation.');
  if (setting.methodType === 'installment') notes.push('Installment capture requires a credit provider contract or manual approval workflow.');
  if (setting.requiresManualReview) notes.push('Manual review is required before this method completes an order.');
  return notes;
}

export const paymentMethodSettingsService = {
  async list(): Promise<PaymentMethodSetting[]> {
    if (!hasDatabase()) return DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS;

    try {
      const rows = await prisma.$queryRaw<PaymentMethodSetting[]>`
        SELECT "id", "key", "label", "description", "methodType", "providerKey", "settlementMode", "captureMode", "currency", "isActive", "isDefault", "requiresManualReview", "sortOrder", "metadata", "updatedAt"
        FROM "PaymentMethodSetting"
        ORDER BY "sortOrder" ASC, "label" ASC
      `;
      return rows.length ? rows.map(mapPaymentMethodSetting) : DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS;
    } catch (error) {
      if (isMissingPaymentMethodSettingTable(error)) return DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS;
      throw error;
    }
  },

  async update(input: PaymentMethodSettingInput): Promise<PaymentMethodSetting> {
    if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');
    const normalized = normalizePaymentMethodSettingInput(input);

    try {
      if (normalized.isDefault) {
        await prisma.$executeRaw`
          UPDATE "PaymentMethodSetting"
          SET "isDefault" = false, "updatedAt" = CURRENT_TIMESTAMP
          WHERE "key" <> ${normalized.key}
        `;
      }

      const rows = await prisma.$queryRaw<PaymentMethodSetting[]>`
        INSERT INTO "PaymentMethodSetting" ("key", "label", "description", "methodType", "providerKey", "settlementMode", "captureMode", "currency", "isActive", "isDefault", "requiresManualReview", "sortOrder")
        VALUES (${normalized.key}, ${normalized.label}, ${normalized.description}, ${normalized.methodType}, ${normalized.providerKey}, ${normalized.settlementMode}, ${normalized.captureMode}, ${normalized.currency}, ${normalized.isActive}, ${normalized.isDefault}, ${normalized.requiresManualReview}, ${normalized.sortOrder})
        ON CONFLICT ("key") DO UPDATE SET
          "label" = EXCLUDED."label",
          "description" = EXCLUDED."description",
          "methodType" = EXCLUDED."methodType",
          "providerKey" = EXCLUDED."providerKey",
          "settlementMode" = EXCLUDED."settlementMode",
          "captureMode" = EXCLUDED."captureMode",
          "currency" = EXCLUDED."currency",
          "isActive" = EXCLUDED."isActive",
          "isDefault" = EXCLUDED."isDefault",
          "requiresManualReview" = EXCLUDED."requiresManualReview",
          "sortOrder" = EXCLUDED."sortOrder",
          "updatedAt" = CURRENT_TIMESTAMP
        RETURNING "id", "key", "label", "description", "methodType", "providerKey", "settlementMode", "captureMode", "currency", "isActive", "isDefault", "requiresManualReview", "sortOrder", "metadata", "updatedAt"
      `;
      const setting = mapPaymentMethodSetting(rows[0]);

      await recordAdminAuditLog({
        action: 'settings.payment_method.update',
        entity: 'paymentMethodSetting',
        entityId: setting.id,
        summary: `Updated payment method setting: ${setting.label}`,
        metadata: {
          key: setting.key,
          methodType: setting.methodType,
          providerKey: setting.providerKey,
          settlementMode: setting.settlementMode,
          captureMode: setting.captureMode,
          currency: setting.currency,
          isActive: setting.isActive,
          isDefault: setting.isDefault,
          requiresManualReview: setting.requiresManualReview
        }
      });

      return setting;
    } catch (error) {
      if (isMissingPaymentMethodSettingTable(error)) {
        throw new Error('Payment method settings are not available until the PaymentMethodSetting table exists. Run the latest database migration before saving payment methods.');
      }
      throw error;
    }
  }
};
