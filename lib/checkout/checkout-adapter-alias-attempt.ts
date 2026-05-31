import type { PaymentGatewayAdapterProvider, PaymentGatewayInitiationResult } from '@/lib/checkout/payment-gateway-adapters';
import { mapGatewayResultToAttempt, type PaymentAttemptOrder } from '@/lib/checkout/payment-attempt-core';

export type AdapterAliasAttempt = {
  provider: PaymentGatewayAdapterProvider;
  status: 'manual_pending' | 'created' | 'redirect_required';
  providerReference?: string;
  redirectUrl?: string;
  metadata?: Record<string, string | number | boolean>;
};

export function mapAdapterAliasAttempt(input: { result: PaymentGatewayInitiationResult; order: PaymentAttemptOrder }): AdapterAliasAttempt {
  const attempt = mapGatewayResultToAttempt({ result: input.result, order: input.order, readinessBlockers: [] });
  const aliasAttempt: AdapterAliasAttempt = {
    provider: attempt.provider,
    status: attempt.status,
    metadata: {
      gatewayStatus: String(attempt.metadata.gatewayStatus),
      gatewayMessage: String(attempt.metadata.gatewayMessage),
      orderNumber: String(attempt.metadata.orderNumber)
    }
  };
  if (attempt.providerReference) aliasAttempt.providerReference = attempt.providerReference;
  if (attempt.redirectUrl) aliasAttempt.redirectUrl = attempt.redirectUrl;
  return aliasAttempt;
}
