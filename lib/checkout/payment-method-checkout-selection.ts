import type { CheckoutPaymentProviderName } from '@/lib/checkout/payment-provider-alias-core';
import { normalizeCheckoutProviderName } from '@/lib/checkout/payment-provider-alias-core';
import type { PaymentMethodSetting } from '@/lib/settings/payment-method-settings';

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

export type CheckoutPaymentMethodSelectionResult =
  | { ok: true; selection: CheckoutPaymentMethodSelection; methods: PaymentMethodSetting[] }
  | { ok: false; code: 'payment-method-unavailable' | 'payment-method-required'; methods: PaymentMethodSetting[] };

const manualReviewProvider: CheckoutPaymentProviderName = 'manual';

function methodProvider(method: PaymentMethodSetting): CheckoutPaymentProviderName {
  if (method.methodType === 'gateway') return normalizeCheckoutProviderName(method.providerKey || 'zarinpal');
  return manualReviewProvider;
}

function activeMethods(settings: PaymentMethodSetting[]) {
  return settings.filter((setting) => setting.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

function preferredMethod(methods: PaymentMethodSetting[], requestedKey?: string | null) {
  const normalizedKey = requestedKey?.trim();
  if (normalizedKey) return methods.find((method) => method.key === normalizedKey);
  return methods.find((method) => method.isDefault) ?? methods[0];
}

export function resolveCheckoutPaymentMethodSelection(settings: PaymentMethodSetting[], requestedKey?: string | null): CheckoutPaymentMethodSelectionResult {
  const methods = activeMethods(settings);
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

export function checkoutPaymentMethodMetadata(selection: CheckoutPaymentMethodSelection) {
  return {
    paymentMethodKey: selection.methodKey,
    paymentMethodLabel: selection.label,
    paymentMethodType: selection.methodType,
    paymentProviderKey: selection.providerKey,
    paymentCaptureMode: selection.captureMode,
    paymentSettlementMode: selection.settlementMode,
    paymentRequiresManualReview: selection.requiresManualReview
  };
}
