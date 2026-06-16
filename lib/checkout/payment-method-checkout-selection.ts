import { checkoutProviderRoutingKind, resolvePaymentMethodGatewayAdapter, type CheckoutPaymentProviderName } from '@/lib/checkout/payment-provider-alias-core';
import type { PaymentMethodSetting } from '@/lib/settings/payment-method-settings';

export const COD_COLLECTION_STATUSES = ['pending', 'collected', 'failed', 'waived'] as const;
export type CodCollectionStatus = typeof COD_COLLECTION_STATUSES[number];
export const COD_SETTLEMENT_STATUSES = ['pending', 'settled', 'disputed'] as const;
export type CodSettlementStatus = typeof COD_SETTLEMENT_STATUSES[number];
export const GATEWAY_READINESS_EVIDENCE_VERSION = 'p5.gateway-readiness.v1';
const GATEWAY_READINESS_PROVIDERS = new Set<CheckoutPaymentProviderName>(['iranian', 'zarinpal']);
type CheckoutPaymentMetadataFragment = Record<string, string | number | boolean | string[]>;

export type CheckoutPaymentMethodSelection = {
  methodKey: string;
  label: string;
  methodType: PaymentMethodSetting['methodType'];
  provider: CheckoutPaymentProviderName;
  providerKey: string;
  captureMode: PaymentMethodSetting['captureMode'];
  settlementMode: PaymentMethodSetting['settlementMode'];
  requiresManualReview: boolean;
};

export type CheckoutPaymentMethodSelectionFailureCode = 'payment-method-disabled' | 'payment-method-unavailable' | 'payment-method-required';

export type CheckoutPaymentMethodSelectionResult =
  | { ok: true; selection: CheckoutPaymentMethodSelection; methods: PaymentMethodSetting[] }
  | { ok: false; code: CheckoutPaymentMethodSelectionFailureCode; methods: PaymentMethodSetting[] };

const manualReviewProvider: CheckoutPaymentProviderName = 'manual';

function methodProvider(method: PaymentMethodSetting): CheckoutPaymentProviderName {
  if (method.methodType === 'gateway') return resolvePaymentMethodGatewayAdapter({ methodKey: method.key, providerKey: method.providerKey });
  return manualReviewProvider;
}

function activeMethods(settings: PaymentMethodSetting[]) {
  return settings.filter((setting) => setting.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

function requestedDisabledMethod(settings: PaymentMethodSetting[], requestedKey?: string | null) {
  const normalizedKey = requestedKey?.trim();
  if (!normalizedKey) return undefined;
  return settings.find((method) => method.key === normalizedKey && !method.isActive);
}

function preferredMethod(methods: PaymentMethodSetting[], requestedKey?: string | null) {
  const normalizedKey = requestedKey?.trim();
  if (normalizedKey) return methods.find((method) => method.key === normalizedKey);
  return methods.find((method) => method.isDefault) ?? methods[0];
}

export function resolveCheckoutPaymentMethodSelection(settings: PaymentMethodSetting[], requestedKey?: string | null): CheckoutPaymentMethodSelectionResult {
  const disabledMethod = requestedDisabledMethod(settings, requestedKey);
  const methods = activeMethods(settings);
  if (disabledMethod) return { ok: false, code: 'payment-method-disabled', methods };
  if (methods.length === 0) return { ok: false, code: 'payment-method-required', methods };

  const method = preferredMethod(methods, requestedKey);
  if (!method) return { ok: false, code: 'payment-method-unavailable', methods };

  const requested = requestedKey?.trim();
  if (requested && method.key !== requested) return { ok: false, code: 'payment-method-unavailable', methods };

  return {
    ok: true,
    methods,
    selection: {
      methodKey: method.key,
      label: method.label,
      methodType: method.methodType,
      provider: methodProvider(method),
      providerKey: method.providerKey,
      captureMode: method.captureMode,
      settlementMode: method.settlementMode,
      requiresManualReview: method.requiresManualReview
    }
  };
}

function gatewayProductionReadinessMetadata(selection: CheckoutPaymentMethodSelection): CheckoutPaymentMetadataFragment {
  if (selection.methodType !== 'gateway') return {};
  if (!GATEWAY_READINESS_PROVIDERS.has(selection.provider)) return {};

  return {
    gatewayReadinessEvidenceVersion: GATEWAY_READINESS_EVIDENCE_VERSION,
    gatewayReadinessState: 'pending-production-evidence',
    gatewayReadinessMethodKey: selection.methodKey,
    gatewayReadinessProvider: selection.provider,
    gatewayReadinessProviderKey: selection.providerKey,
    gatewayReadinessRequiredCurrency: 'TOMAN',
    gatewayReadinessRequiresMerchantId: true,
    gatewayReadinessRequiresReturnMapping: true,
    gatewayReadinessRequiresWebhookMapping: true,
    gatewayReadinessSettlementMode: selection.settlementMode
  };
}

export function checkoutPaymentMethodMetadata(selection: CheckoutPaymentMethodSelection) {
  return {
    paymentMethodKey: selection.methodKey,
    paymentMethodLabel: selection.label,
    paymentMethodType: selection.methodType,
    paymentProviderKey: selection.providerKey,
    paymentProvider: selection.provider,
    paymentProviderRoutingKind: checkoutProviderRoutingKind(selection.provider),
    paymentCaptureMode: selection.captureMode,
    paymentSettlementMode: selection.settlementMode,
    paymentRequiresManualReview: selection.requiresManualReview,
    ...gatewayProductionReadinessMetadata(selection)
  };
}

export function codSelectedMethodMetadata(selection: CheckoutPaymentMethodSelection): CheckoutPaymentMetadataFragment {
  if (selection.methodType !== 'cod') return {};

  return {
    codPaymentSelected: true,
    codCollectionStatus: 'pending' satisfies CodCollectionStatus,
    codCollectionProviderKey: selection.providerKey,
    codSettlementMode: selection.settlementMode,
    codSettlementStatus: 'pending' satisfies CodSettlementStatus,
    codRequiresDeliveryCollection: true
  };
}
