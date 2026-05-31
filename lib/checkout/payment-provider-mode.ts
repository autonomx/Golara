import {
  checkoutProviderRoutingKind,
  normalizeCheckoutProviderName,
  type CheckoutPaymentProviderName,
  type CheckoutProviderRoutingKind
} from '@/lib/checkout/payment-provider-alias-core';

export type CheckoutProviderMode = {
  provider: CheckoutPaymentProviderName;
  kind: CheckoutProviderRoutingKind;
};

export function checkoutProviderMode(raw: string | null | undefined): CheckoutProviderMode {
  const provider = normalizeCheckoutProviderName(raw);
  return {
    provider,
    kind: checkoutProviderRoutingKind(provider)
  };
}
