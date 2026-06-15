import 'server-only';

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

function isMissingPaymentMethodSettingTable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('PaymentMethodSetting') && (message.includes('does not exist') || message.includes('42P01'));
}

function normalizeMethodType(value: string): PaymentMethodType {
  return PAYMENT_METHOD_TYPES.includes(value as PaymentMethodType) ? value as PaymentMethodType : 'manual_transfer';
}

function normalizeCaptureMode(value: string): PaymentMethodCaptureMode {
  return PAYMENT_METHOD_CAPTURE_MODES.includes(value as PaymentMethodCaptureMode) ? value as PaymentMethodCaptureMode : 'manual_review';
}

function normalizeSettlementMode(value: string): PaymentMethodSettlementMode {
  return PAYMENT_METHOD_SETTLEMENT_MODES.includes(value as PaymentMethodSettlementMode) ? value as PaymentMethodSettlementMode : 'manual_reconciliation';
}

type PaymentMethodRow = Omit<PaymentMethodSetting, 'methodType' | 'captureMode' | 'settlementMode'> & {
  methodType: string;
  captureMode: string;
  settlementMode: string;
};

function mapPaymentMethodSetting(row: PaymentMethodRow): PaymentMethodSetting {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    description: row.description ?? null,
    methodType: normalizeMethodType(row.methodType),
    providerKey: row.providerKey,
    settlementMode: normalizeSettlementMode(row.settlementMode),
    captureMode: normalizeCaptureMode(row.captureMode),
    currency: row.currency,
    isActive: row.isActive,
    isDefault: row.isDefault,
    requiresManualReview: row.requiresManualReview,
    sortOrder: row.sortOrder,
    metadata: row.metadata ?? {},
    updatedAt: row.updatedAt
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
      const rows = await prisma.$queryRaw<PaymentMethodRow[]>`
        SELECT "id", "key", "label", "description", "methodType", "providerKey", "settlementMode", "captureMode", "currency", "isActive", "isDefault", "requiresManualReview", "sortOrder", "metadata", "updatedAt"
        FROM "PaymentMethodSetting"
        ORDER BY "sortOrder" ASC, "label" ASC
      `;
      return rows.length ? rows.map(mapPaymentMethodSetting) : DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS;
    } catch (error) {
      if (isMissingPaymentMethodSettingTable(error)) return DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS;
      throw error;
    }
  }
};
