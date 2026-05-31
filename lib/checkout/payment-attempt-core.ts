import { mapCheckoutAttemptStatus } from '@/lib/checkout/checkout-attempt-status';
import type { PaymentGatewayAdapterProvider, PaymentGatewayInitiationResult } from '@/lib/checkout/payment-gateway-adapters';
import { selectPaymentGatewayForOrder, type CheckoutCurrency, type PaymentGatewayConfig } from '@/lib/checkout/payment-gateway-config';

export type PaymentAttemptOrder = {
  id: string;
  orderNumber: string;
  totalCents: number;
  currency: string;
  status: string;
  publicLookupToken?: string | null;
};

export type PaymentAttemptMetadata = Record<string, string | number | boolean | string[]>;

export function checkoutCurrency(value: string): CheckoutCurrency {
  const normalized = value.trim().toUpperCase();
  if (normalized === 'USD' || normalized === 'CAD' || normalized === 'TOMAN') return normalized;
  return 'TOMAN';
}

export function checkoutRegion(order: PaymentAttemptOrder): 'domestic' | 'overseas' {
  return checkoutCurrency(order.currency) === 'TOMAN' ? 'domestic' : 'overseas';
}

export function selectProviderForCheckoutAttempt(input: { order: PaymentAttemptOrder; config: PaymentGatewayConfig; readinessBlockers?: string[] }): PaymentGatewayAdapterProvider {
  if (input.config.checkoutMode === 'inquiry') return 'inquiry';
  if (input.config.checkoutMode === 'assisted') return 'manual';
  if (input.readinessBlockers?.length) return 'manual';
  return selectPaymentGatewayForOrder({ region: checkoutRegion(input.order), config: input.config });
}

export function mapGatewayResultToAttempt(input: { result: PaymentGatewayInitiationResult; order: PaymentAttemptOrder; readinessBlockers: string[] }) {
  const { result, order, readinessBlockers } = input;
  const metadata: PaymentAttemptMetadata = {
    gatewayStatus: result.status,
    gatewayMessage: result.message,
    orderNumber: order.orderNumber
  };
  if (readinessBlockers.length > 0) metadata.readinessBlockers = readinessBlockers;

  return {
    provider: result.provider,
    status: mapCheckoutAttemptStatus(result.status),
    providerReference: result.reference,
    redirectUrl: result.redirectUrl,
    metadata
  };
}
