import 'server-only';

import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import {
  CHECKOUT_CURRENCIES,
  CHECKOUT_MODES,
  OVERSEAS_FALLBACKS,
  PAYMENT_GATEWAY_PROVIDERS,
  getPaymentGatewayReadiness,
  type CheckoutCurrency,
  type CheckoutMode,
  type OverseasFallback,
  type PaymentGatewayConfig,
  type PaymentGatewayProvider,
  type PaymentGatewayReadiness
} from '@/lib/checkout/payment-gateway-config';
import { hasDatabase, prisma } from '@/lib/prisma';

export type PaymentProviderSetting = {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  checkoutMode: CheckoutMode;
  domesticProvider: PaymentGatewayProvider;
  overseasProvider?: PaymentGatewayProvider | null;
  domesticCurrency: CheckoutCurrency;
  overseasCurrency: CheckoutCurrency;
  overseasFallback: OverseasFallback;
  requireIranianGatewayMerchantId: boolean;
  requireStripeSecretKey: boolean;
  isDefault: boolean;
  isActive: boolean;
  updatedAt?: Date;
};

export type PaymentProviderSettingInput = {
  key: string;
  label: string;
  description?: string | null;
  checkoutMode: string;
  domesticProvider: string;
  overseasProvider?: string | null;
  domesticCurrency: string;
  overseasCurrency: string;
  overseasFallback: string;
  requireIranianGatewayMerchantId: boolean;
  requireStripeSecretKey: boolean;
  isDefault: boolean;
  isActive: boolean;
};

export type PaymentProviderReadinessSummary = PaymentGatewayReadiness & {
  settingKey: string;
  active: boolean;
  requiredEnvironmentVariables: string[];
};

export const DEFAULT_PAYMENT_PROVIDER_SETTING: PaymentProviderSetting = {
  id: 'payment-provider-default-readiness',
  key: 'default-payment-readiness',
  label: 'Default payment readiness',
  description: 'Admin-managed payment provider readiness settings. Provider secrets remain environment-managed.',
  checkoutMode: 'inquiry',
  domesticProvider: 'manual',
  overseasProvider: null,
  domesticCurrency: 'TOMAN',
  overseasCurrency: 'USD',
  overseasFallback: 'whatsapp',
  requireIranianGatewayMerchantId: false,
  requireStripeSecretKey: false,
  isDefault: true,
  isActive: true
};

function optionalText(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

function normalizeSlug(value?: string | null) {
  const normalized = optionalText(value)?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return normalized || DEFAULT_PAYMENT_PROVIDER_SETTING.key;
}

function normalizeEnum<T extends string>(value: string | null | undefined, allowed: readonly T[], fallback: T): T {
  const normalized = value?.trim().toLowerCase();
  return allowed.find((item) => item.toLowerCase() === normalized) ?? fallback;
}

function normalizeOptionalProvider(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  return PAYMENT_GATEWAY_PROVIDERS.find((provider) => provider === normalized) ?? null;
}

function isMissingPaymentProviderSettingTable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('PaymentProviderSetting') && (message.includes('does not exist') || message.includes('42P01'));
}

export function normalizePaymentProviderSettingInput(input: PaymentProviderSettingInput): PaymentProviderSettingInput {
  return {
    key: normalizeSlug(input.key),
    label: optionalText(input.label) ?? DEFAULT_PAYMENT_PROVIDER_SETTING.label,
    description: optionalText(input.description),
    checkoutMode: normalizeEnum(input.checkoutMode, CHECKOUT_MODES, DEFAULT_PAYMENT_PROVIDER_SETTING.checkoutMode),
    domesticProvider: normalizeEnum(input.domesticProvider, PAYMENT_GATEWAY_PROVIDERS, DEFAULT_PAYMENT_PROVIDER_SETTING.domesticProvider),
    overseasProvider: normalizeOptionalProvider(input.overseasProvider),
    domesticCurrency: normalizeEnum(input.domesticCurrency, CHECKOUT_CURRENCIES, DEFAULT_PAYMENT_PROVIDER_SETTING.domesticCurrency),
    overseasCurrency: normalizeEnum(input.overseasCurrency, CHECKOUT_CURRENCIES, DEFAULT_PAYMENT_PROVIDER_SETTING.overseasCurrency),
    overseasFallback: normalizeEnum(input.overseasFallback, OVERSEAS_FALLBACKS, DEFAULT_PAYMENT_PROVIDER_SETTING.overseasFallback),
    requireIranianGatewayMerchantId: input.requireIranianGatewayMerchantId,
    requireStripeSecretKey: input.requireStripeSecretKey,
    isDefault: input.isDefault,
    isActive: input.isActive
  };
}

export function buildPaymentGatewayConfigFromSetting(setting: PaymentProviderSetting): PaymentGatewayConfig {
  return {
    checkoutMode: setting.checkoutMode,
    domesticProvider: setting.domesticProvider,
    overseasProvider: setting.overseasProvider ?? undefined,
    domesticCurrency: setting.domesticCurrency,
    overseasCurrency: setting.overseasCurrency,
    overseasFallback: setting.overseasFallback
  };
}

export function listRequiredPaymentProviderEnvironmentVariables(setting: PaymentProviderSetting) {
  const required = new Set<string>();
  if (setting.requireIranianGatewayMerchantId || setting.domesticProvider === 'iranian' || setting.overseasProvider === 'iranian') {
    required.add('IRANIAN_GATEWAY_MERCHANT_ID');
  }
  if (setting.requireStripeSecretKey || setting.domesticProvider === 'stripe' || setting.overseasProvider === 'stripe' || setting.overseasFallback === 'stripe') {
    required.add('STRIPE_SECRET_KEY');
  }
  return Array.from(required).sort();
}

export function buildPaymentProviderReadinessSummary(setting: PaymentProviderSetting, env: Record<string, string | undefined>): PaymentProviderReadinessSummary {
  const readiness = getPaymentGatewayReadiness(buildPaymentGatewayConfigFromSetting(setting), env);
  const requiredEnvironmentVariables = listRequiredPaymentProviderEnvironmentVariables(setting);
  return {
    ...readiness,
    ready: setting.isActive && readiness.ready,
    settingKey: setting.key,
    active: setting.isActive,
    requiredEnvironmentVariables
  };
}

function mapPaymentProviderSetting(row: PaymentProviderSetting): PaymentProviderSetting {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    description: row.description ?? null,
    checkoutMode: row.checkoutMode,
    domesticProvider: row.domesticProvider,
    overseasProvider: row.overseasProvider ?? null,
    domesticCurrency: row.domesticCurrency,
    overseasCurrency: row.overseasCurrency,
    overseasFallback: row.overseasFallback,
    requireIranianGatewayMerchantId: row.requireIranianGatewayMerchantId,
    requireStripeSecretKey: row.requireStripeSecretKey,
    isDefault: row.isDefault,
    isActive: row.isActive,
    updatedAt: row.updatedAt
  };
}

export const paymentProviderSettingsService = {
  async list(): Promise<PaymentProviderSetting[]> {
    if (!hasDatabase()) return [DEFAULT_PAYMENT_PROVIDER_SETTING];

    try {
      const rows = await prisma.$queryRaw<PaymentProviderSetting[]>`
        SELECT "id", "key", "label", "description", "checkoutMode", "domesticProvider", "overseasProvider", "domesticCurrency", "overseasCurrency", "overseasFallback", "requireIranianGatewayMerchantId", "requireStripeSecretKey", "isDefault", "isActive", "updatedAt"
        FROM "PaymentProviderSetting"
        ORDER BY "isDefault" DESC, "label" ASC
      `;

      return rows.length ? rows.map(mapPaymentProviderSetting) : [DEFAULT_PAYMENT_PROVIDER_SETTING];
    } catch (error) {
      if (isMissingPaymentProviderSettingTable(error)) return [DEFAULT_PAYMENT_PROVIDER_SETTING];
      throw error;
    }
  },

  async update(input: PaymentProviderSettingInput): Promise<PaymentProviderSetting> {
    if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

    const normalized = normalizePaymentProviderSettingInput(input);
    try {
      if (normalized.isDefault) {
        await prisma.$executeRaw`
          UPDATE "PaymentProviderSetting"
          SET "isDefault" = false, "updatedAt" = CURRENT_TIMESTAMP
          WHERE "key" <> ${normalized.key}
        `;
      }

      const rows = await prisma.$queryRaw<PaymentProviderSetting[]>`
        INSERT INTO "PaymentProviderSetting" ("key", "label", "description", "checkoutMode", "domesticProvider", "overseasProvider", "domesticCurrency", "overseasCurrency", "overseasFallback", "requireIranianGatewayMerchantId", "requireStripeSecretKey", "isDefault", "isActive")
        VALUES (${normalized.key}, ${normalized.label}, ${normalized.description}, ${normalized.checkoutMode}, ${normalized.domesticProvider}, ${normalized.overseasProvider}, ${normalized.domesticCurrency}, ${normalized.overseasCurrency}, ${normalized.overseasFallback}, ${normalized.requireIranianGatewayMerchantId}, ${normalized.requireStripeSecretKey}, ${normalized.isDefault}, ${normalized.isActive})
        ON CONFLICT ("key") DO UPDATE SET
          "label" = EXCLUDED."label",
          "description" = EXCLUDED."description",
          "checkoutMode" = EXCLUDED."checkoutMode",
          "domesticProvider" = EXCLUDED."domesticProvider",
          "overseasProvider" = EXCLUDED."overseasProvider",
          "domesticCurrency" = EXCLUDED."domesticCurrency",
          "overseasCurrency" = EXCLUDED."overseasCurrency",
          "overseasFallback" = EXCLUDED."overseasFallback",
          "requireIranianGatewayMerchantId" = EXCLUDED."requireIranianGatewayMerchantId",
          "requireStripeSecretKey" = EXCLUDED."requireStripeSecretKey",
          "isDefault" = EXCLUDED."isDefault",
          "isActive" = EXCLUDED."isActive",
          "updatedAt" = CURRENT_TIMESTAMP
        RETURNING "id", "key", "label", "description", "checkoutMode", "domesticProvider", "overseasProvider", "domesticCurrency", "overseasCurrency", "overseasFallback", "requireIranianGatewayMerchantId", "requireStripeSecretKey", "isDefault", "isActive", "updatedAt"
      `;
      const setting = mapPaymentProviderSetting(rows[0]);

      await recordAdminAuditLog({
        action: 'settings.payment_provider.update',
        entity: 'paymentProviderSetting',
        entityId: setting.id,
        summary: `Updated payment provider setting: ${setting.label}`,
        metadata: {
          key: setting.key,
          checkoutMode: setting.checkoutMode,
          domesticProvider: setting.domesticProvider,
          overseasProvider: setting.overseasProvider,
          domesticCurrency: setting.domesticCurrency,
          overseasCurrency: setting.overseasCurrency,
          overseasFallback: setting.overseasFallback,
          requiredEnvironmentVariables: listRequiredPaymentProviderEnvironmentVariables(setting),
          isDefault: setting.isDefault,
          isActive: setting.isActive
        }
      });

      return setting;
    } catch (error) {
      if (isMissingPaymentProviderSettingTable(error)) {
        throw new Error('Payment provider settings are not available until the PaymentProviderSetting table exists. Run the latest database schema setup before saving payment settings.');
      }
      throw error;
    }
  }
};
