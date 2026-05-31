import { checkoutCurrency, type PaymentAttemptOrder, type PaymentAttemptMetadata } from '@/lib/checkout/payment-attempt-core';
import type { PaymentGatewayInitiationInput, PaymentGatewayInitiationResult } from '@/lib/checkout/payment-gateway-adapters';
import {
  mapAliasGatewayResultToLegacyAttempt,
  type AdapterPaymentProviderName,
  type CheckoutPaymentProviderName,
  type LegacyPaymentProviderName
} from '@/lib/checkout/payment-provider-alias-core';
import { checkoutProviderMode } from '@/lib/checkout/payment-provider-mode';

export type CheckoutPaymentProviderResult = {
  provider: CheckoutPaymentProviderName;
  status: 'manual_pending' | 'created' | 'redirect_required';
  providerReference?: string;
  redirectUrl?: string;
  metadata?: PaymentAttemptMetadata;
};

export type LocalPaymentProviderAttempt = (provider: LegacyPaymentProviderName, order: PaymentAttemptOrder) => Promise<CheckoutPaymentProviderResult>;
export type AdapterPaymentProviderAttempt = (provider: AdapterPaymentProviderName, payment: PaymentGatewayInitiationInput) => Promise<PaymentGatewayInitiationResult>;

export async function createCheckoutProviderRuntimeAttempt(input: {
  order: PaymentAttemptOrder;
  provider: string | null | undefined;
  returnUrl: string;
  localAttempt: LocalPaymentProviderAttempt;
  adapterAttempt: AdapterPaymentProviderAttempt;
}): Promise<CheckoutPaymentProviderResult> {
  const mode = checkoutProviderMode(input.provider);
  if (mode.kind === 'local') {
    return input.localAttempt(mode.provider, input.order);
  }

  const result = await input.adapterAttempt(mode.provider, {
    orderId: input.order.id,
    orderNumber: input.order.orderNumber,
    amountCents: input.order.totalCents,
    currency: checkoutCurrency(input.order.currency),
    returnUrl: input.returnUrl,
    metadata: {
      orderNumber: input.order.orderNumber
    }
  });

  return mapAliasGatewayResultToLegacyAttempt({
    result: { ...result, provider: mode.provider },
    order: input.order
  });
}
