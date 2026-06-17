import type { PaymentMethodSetting, PaymentMethodType } from '@/lib/settings/payment-method-settings';

export const PAYMENT_METHOD_READINESS_GATE_VERSION = 'p9.method-readiness.v1';

export const PAYMENT_METHOD_READINESS_EVIDENCE_KEYS = [
  'gatewayMerchantCredentials',
  'gatewayReturnMapping',
  'gatewayWebhookMapping',
  'gatewayProviderReference',
  'gatewayRefundVoidAdapter',
  'walletLedgerCapture',
  'walletRefundReceipt',
  'walletLiabilityDashboard',
  'manualTransferInstructions',
  'manualTransferVerification',
  'manualTransferSettlementTotals',
  'manualTransferRefundTracking',
  'installmentReviewWorkflow',
  'installmentSchedulePersistence',
  'installmentReceivablesDashboard',
  'installmentCustomerMessages',
  'codCollectionControls',
  'codFulfillmentGuard',
  'codSettlementEvidence',
  'codCustomerReminder'
] as const;

export type PaymentMethodReadinessEvidenceKey = typeof PAYMENT_METHOD_READINESS_EVIDENCE_KEYS[number];
export type PaymentMethodReadinessEvidence = Partial<Record<PaymentMethodReadinessEvidenceKey, boolean | string | number | null | undefined>>;
export type PaymentMethodReadinessStatus = 'disabled' | 'needs-evidence' | 'ready';

export type PaymentMethodReadinessGate = {
  version: typeof PAYMENT_METHOD_READINESS_GATE_VERSION;
  methodKey: string;
  label: string;
  methodType: PaymentMethodType;
  providerKey: string;
  currency: string;
  isActive: boolean;
  status: PaymentMethodReadinessStatus;
  requiredEvidence: PaymentMethodReadinessEvidenceKey[];
  satisfiedEvidence: PaymentMethodReadinessEvidenceKey[];
  missingEvidence: PaymentMethodReadinessEvidenceKey[];
  warnings: string[];
  blocksCheckout: false;
};

export type PaymentMethodReadinessGateSummary = {
  version: typeof PAYMENT_METHOD_READINESS_GATE_VERSION;
  methods: PaymentMethodReadinessGate[];
  enabledMethodCount: number;
  readyCount: number;
  needsEvidenceCount: number;
  disabledCount: number;
  checkoutBlockingCount: 0;
  missingEvidence: PaymentMethodReadinessEvidenceKey[];
};

const REQUIRED_EVIDENCE_BY_METHOD_TYPE: Record<PaymentMethodType, PaymentMethodReadinessEvidenceKey[]> = {
  gateway: ['gatewayMerchantCredentials', 'gatewayReturnMapping', 'gatewayWebhookMapping', 'gatewayProviderReference', 'gatewayRefundVoidAdapter'],
  wallet: ['walletLedgerCapture', 'walletRefundReceipt', 'walletLiabilityDashboard'],
  manual_transfer: ['manualTransferInstructions', 'manualTransferVerification', 'manualTransferSettlementTotals', 'manualTransferRefundTracking'],
  installment: ['installmentReviewWorkflow', 'installmentSchedulePersistence', 'installmentReceivablesDashboard', 'installmentCustomerMessages'],
  cod: ['codCollectionControls', 'codFulfillmentGuard', 'codSettlementEvidence', 'codCustomerReminder']
};

function evidenceIsPresent(value: boolean | string | number | null | undefined) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  return false;
}

function gatewayMerchantEvidence(method: PaymentMethodSetting, env: Record<string, string | undefined>) {
  if (method.methodType !== 'gateway') return undefined;
  if (method.providerKey === 'zarinpal') return env.ZARINPAL_MERCHANT_ID ?? env.IRANIAN_GATEWAY_MERCHANT_ID;
  if (method.providerKey === 'iranian') return env.IRANIAN_GATEWAY_MERCHANT_ID ?? env.ZARINPAL_MERCHANT_ID;
  return env.IRANIAN_GATEWAY_MERCHANT_ID ?? env.ZARINPAL_MERCHANT_ID;
}

function mergeAutomaticEvidence(method: PaymentMethodSetting, env: Record<string, string | undefined>, evidence: PaymentMethodReadinessEvidence) {
  return {
    ...evidence,
    gatewayMerchantCredentials: evidence.gatewayMerchantCredentials ?? gatewayMerchantEvidence(method, env)
  } satisfies PaymentMethodReadinessEvidence;
}

export function evaluatePaymentMethodReadinessGate(
  method: PaymentMethodSetting,
  options: { evidence?: PaymentMethodReadinessEvidence; env?: Record<string, string | undefined> } = {}
): PaymentMethodReadinessGate {
  const requiredEvidence = REQUIRED_EVIDENCE_BY_METHOD_TYPE[method.methodType] ?? [];
  const evidence = mergeAutomaticEvidence(method, options.env ?? {}, options.evidence ?? {});
  const satisfiedEvidence = requiredEvidence.filter((key) => evidenceIsPresent(evidence[key]));
  const missingEvidence = method.isActive ? requiredEvidence.filter((key) => !evidenceIsPresent(evidence[key])) : [];
  const warnings = missingEvidence.map((key) => `Missing production evidence: ${key}.`);
  if (method.requiresManualReview) warnings.push('Manual review remains required for this payment method.');

  return {
    version: PAYMENT_METHOD_READINESS_GATE_VERSION,
    methodKey: method.key,
    label: method.label,
    methodType: method.methodType,
    providerKey: method.providerKey,
    currency: method.currency,
    isActive: method.isActive,
    status: method.isActive ? (missingEvidence.length > 0 ? 'needs-evidence' : 'ready') : 'disabled',
    requiredEvidence,
    satisfiedEvidence,
    missingEvidence,
    warnings,
    blocksCheckout: false
  };
}

export function summarizePaymentMethodReadinessGates(
  methods: PaymentMethodSetting[],
  options: { evidenceByMethodKey?: Record<string, PaymentMethodReadinessEvidence>; env?: Record<string, string | undefined> } = {}
): PaymentMethodReadinessGateSummary {
  const gates = [...methods]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((method) => evaluatePaymentMethodReadinessGate(method, { evidence: options.evidenceByMethodKey?.[method.key], env: options.env }));

  const missingEvidence = Array.from(new Set(gates.flatMap((gate) => gate.missingEvidence))).sort();

  return {
    version: PAYMENT_METHOD_READINESS_GATE_VERSION,
    methods: gates,
    enabledMethodCount: gates.filter((gate) => gate.isActive).length,
    readyCount: gates.filter((gate) => gate.status === 'ready').length,
    needsEvidenceCount: gates.filter((gate) => gate.status === 'needs-evidence').length,
    disabledCount: gates.filter((gate) => gate.status === 'disabled').length,
    checkoutBlockingCount: 0,
    missingEvidence
  };
}
