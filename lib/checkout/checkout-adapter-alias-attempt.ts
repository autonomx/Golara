import type { PaymentGatewayAdapterProvider, PaymentGatewayInitiationResult } from '@/lib/checkout/payment-gateway-adapters';
import type { PaymentAttemptOrder } from '@/lib/checkout/payment-attempt-core';

export type AdapterAliasAttempt = {
  provider: PaymentGatewayAdapterProvider;
  status: 'manual_pending' | 'created' | 'redirect_required';
  providerReference?: string;
  redirectUrl?: string;
  metadata: Record<string, string>;
};

function statusFromGateway(status: PaymentGatewayInitiationResult['status']): AdapterAliasAttempt['status'] {
  if (status === 'redirect') return 'redirect_required';
  if (status === 'started') return 'created';
  return 'manual_pending';
}

export function mapAdapterAliasAttempt(input: { result: PaymentGatewayInitiationResult; order: PaymentAttemptOrder }): AdapterAliasAttempt {
  const aliasAttempt: AdapterAliasAttempt = {
    provider: input.result.provider,
    status: statusFromGateway(input.result.status),
    metadata: {
      gatewayStatus: input.result.status,
      gatewayMessage: input.result.message,
      orderNumber: input.order.orderNumber
    }
  };
  if (input.result.reference) aliasAttempt.providerReference = input.result.reference;
  if (input.result.redirectUrl) aliasAttempt.redirectUrl = input.result.redirectUrl;
  return aliasAttempt;
}
