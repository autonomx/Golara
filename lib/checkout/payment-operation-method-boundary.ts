import type { PaymentOperationAdapterProvider } from './payment-operation-adapters';

export const GATEWAY_REFUND_VOID_ADAPTER_BOUNDARY_VERSION = 'p6.gateway-refund-void-boundary.v1';

export type PaymentOperationMethodBoundaryInput = {
  methodKey?: string | null;
  methodType?: string | null;
  provider?: string | null;
  providerKey?: string | null;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

export type PaymentOperationMethodBoundaryMetadata = Record<string, string | number | boolean | null>;

const METHOD_KEY_REFUND_VOID_ADAPTERS: Record<string, PaymentOperationAdapterProvider> = {
  'iranian-ipg': 'zarinpal',
  'domestic-ipg': 'zarinpal',
  zarinpal: 'zarinpal',
  'stripe-card': 'stripe',
  'international-card': 'stripe',
  'manual-transfer': 'manual',
  'card-to-card': 'manual',
  wallet: 'manual',
  cod: 'manual',
  installment: 'manual'
};

const PROVIDER_REFUND_VOID_ADAPTERS: Record<string, PaymentOperationAdapterProvider> = {
  stripe: 'stripe',
  zarinpal: 'zarinpal',
  'zarin-pal': 'zarinpal',
  iranian: 'zarinpal',
  manual: 'manual',
  inquiry: 'manual',
  whatsapp: 'manual',
  domestic_redirect: 'manual'
};

function normalize(value: string | number | boolean | null | undefined) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

function metadataString(metadata: PaymentOperationMethodBoundaryInput['metadata'], key: string) {
  const value = metadata?.[key];
  return typeof value === 'string' ? value : undefined;
}

function adapterFromProvider(value: string | null | undefined) {
  const normalized = normalize(value);
  return normalized ? PROVIDER_REFUND_VOID_ADAPTERS[normalized] : undefined;
}

function adapterFromMethodKey(value: string | null | undefined) {
  const normalized = normalize(value);
  return normalized ? METHOD_KEY_REFUND_VOID_ADAPTERS[normalized] : undefined;
}

function selectedMethodKey(input: PaymentOperationMethodBoundaryInput) {
  return input.methodKey
    ?? metadataString(input.metadata, 'paymentMethodKey')
    ?? metadataString(input.metadata, 'gatewayReadinessMethodKey')
    ?? null;
}

function selectedProvider(input: PaymentOperationMethodBoundaryInput) {
  return input.provider
    ?? metadataString(input.metadata, 'paymentProvider')
    ?? metadataString(input.metadata, 'gatewayReadinessProvider')
    ?? null;
}

function selectedProviderKey(input: PaymentOperationMethodBoundaryInput) {
  return input.providerKey
    ?? metadataString(input.metadata, 'paymentProviderKey')
    ?? metadataString(input.metadata, 'gatewayReadinessProviderKey')
    ?? null;
}

function selectedMethodType(input: PaymentOperationMethodBoundaryInput) {
  return input.methodType
    ?? metadataString(input.metadata, 'paymentMethodType')
    ?? null;
}

export function resolvePaymentOperationAdapterProviderForMethod(input: PaymentOperationMethodBoundaryInput): PaymentOperationAdapterProvider {
  const providerAdapter = adapterFromProvider(selectedProvider(input));
  if (providerAdapter) return providerAdapter;

  const providerKeyAdapter = adapterFromProvider(selectedProviderKey(input));
  if (providerKeyAdapter) return providerKeyAdapter;

  const methodKeyAdapter = adapterFromMethodKey(selectedMethodKey(input));
  if (methodKeyAdapter) return methodKeyAdapter;

  const methodType = normalize(selectedMethodType(input));
  if (methodType && methodType !== 'gateway') return 'manual';

  return methodType === 'gateway' ? 'unknown' : 'manual';
}

export function refundVoidAdapterBoundaryMetadata(input: PaymentOperationMethodBoundaryInput): PaymentOperationMethodBoundaryMetadata {
  const adapterProvider = resolvePaymentOperationAdapterProviderForMethod(input);
  return {
    gatewayRefundVoidBoundaryVersion: GATEWAY_REFUND_VOID_ADAPTER_BOUNDARY_VERSION,
    gatewayRefundVoidMethodKey: selectedMethodKey(input)?.trim() || null,
    gatewayRefundVoidProvider: selectedProvider(input)?.trim() || null,
    gatewayRefundVoidProviderKey: selectedProviderKey(input)?.trim() || null,
    gatewayRefundVoidAdapterProvider: adapterProvider,
    gatewayRefundVoidSupportsRefund: adapterProvider !== 'unknown',
    gatewayRefundVoidSupportsVoid: adapterProvider !== 'unknown'
  };
}
