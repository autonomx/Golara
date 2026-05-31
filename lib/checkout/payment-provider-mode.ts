import {
  isAdapterPaymentProviderName,
  normalizeCheckoutProviderName,
  type AdapterPaymentProviderName,
  type LegacyPaymentProviderName
} from '@/lib/checkout/payment-provider-alias-core';

export type CheckoutProviderMode =
  | {
      provider: LegacyPaymentProviderName;
      kind: 'local';
    }
  | {
      provider: AdapterPaymentProviderName;
      kind: 'adapter';
    };

export function checkoutProviderMode(raw: string | null | undefined): CheckoutProviderMode {
  const provider = normalizeCheckoutProviderName(raw);
  if (isAdapterPaymentProviderName(provider)) {
    return {
      provider,
      kind: 'adapter'
    };
  }
  return {
    provider,
    kind: 'local'
  };
}
