import { mapAdapterAliasAttempt, type AdapterAliasAttempt } from '@/lib/checkout/checkout-adapter-alias-attempt';
import type { PaymentAttemptOrder } from '@/lib/checkout/payment-attempt-core';
import type { PaymentGatewayInitiationResult } from '@/lib/checkout/payment-gateway-adapters';

export const LEGACY_PAYMENT_PROVIDER_NAMES = ['manual', 'domestic_redirect', 'zarinpal'] as const;
export const ADAPTER_PAYMENT_PROVIDER_NAMES = ['iranian', 'stripe', 'whatsapp', 'inquiry'] as const;

export type LegacyPaymentProviderName = typeof LEGACY_PAYMENT_PROVIDER_NAMES[number];
export type AdapterPaymentProviderName = typeof ADAPTER_PAYMENT_PROVIDER_NAMES[number];
export type CheckoutPaymentProviderName = LegacyPaymentProviderName | AdapterPaymentProviderName;
export type AdapterPaymentGatewayResult = PaymentGatewayInitiationResult & { provider: AdapterPaymentProviderName };

function normalizedProviderName(value: string) {
  return value.trim().toLowerCase();
}

export function isLegacyPaymentProviderName(provider: string): provider is LegacyPaymentProviderName {
  return LEGACY_PAYMENT_PROVIDER_NAMES.includes(normalizedProviderName(provider) as LegacyPaymentProviderName);
}

export function isAdapterPaymentProviderName(provider: string): provider is AdapterPaymentProviderName {
  return ADAPTER_PAYMENT_PROVIDER_NAMES.includes(normalizedProviderName(provider) as AdapterPaymentProviderName);
}

export function normalizeCheckoutProviderName(raw: string | null | undefined): CheckoutPaymentProviderName {
  const provider = normalizedProviderName(raw ?? '');
  if (isLegacyPaymentProviderName(provider)) return provider;
  if (isAdapterPaymentProviderName(provider)) return provider;
  return 'manual';
}

export function mapAliasGatewayResultToLegacyAttempt(input: { result: AdapterPaymentGatewayResult; order: PaymentAttemptOrder }): AdapterAliasAttempt {
  return mapAdapterAliasAttempt(input);
}
