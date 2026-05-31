import 'server-only';

import { initiatePaymentGateway, type PaymentGatewayAdapterProvider } from '@/lib/checkout/payment-gateway-adapters';
import { checkoutCurrency, mapGatewayResultToAttempt, type PaymentAttemptOrder } from '@/lib/checkout/payment-attempt-core';

export type AdapterAliasAttempt = {
  provider: PaymentGatewayAdapterProvider;
  status: 'manual_pending' | 'created' | 'redirect_required';
  providerReference?: string;
  redirectUrl?: string;
  metadata?: Record<string, string | number | boolean>;
};

function aliasReturnUrl(order: PaymentAttemptOrder) {
  return `/orders/confirmation?order=${encodeURIComponent(order.orderNumber)}`;
}

export async function createAdapterAliasAttempt(input: { provider: PaymentGatewayAdapterProvider; order: PaymentAttemptOrder }): Promise<AdapterAliasAttempt> {
  const result = await initiatePaymentGateway({
    provider: input.provider,
    payment: {
      orderId: input.order.id,
      orderNumber: input.order.orderNumber,
      amountCents: input.order.totalCents,
      currency: checkoutCurrency(input.order.currency),
      returnUrl: aliasReturnUrl(input.order),
      metadata: {
        routedBy: 'legacy-payment-provider-alias'
      }
    }
  });
  const attempt = mapGatewayResultToAttempt({ result, order: input.order, readinessBlockers: [] });
  return {
    provider: attempt.provider,
    status: attempt.status,
    providerReference: attempt.providerReference,
    redirectUrl: attempt.redirectUrl,
    metadata: {
      gatewayStatus: String(attempt.metadata.gatewayStatus),
      gatewayMessage: String(attempt.metadata.gatewayMessage),
      orderNumber: String(attempt.metadata.orderNumber)
    }
  };
}
