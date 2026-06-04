export type PaymentOperationKind = 'refund' | 'void';
export type PaymentOperationDecision = 'ready' | 'manual_review' | 'blocked';

export type PaymentOperationPayment = {
  provider: string;
  status: string;
  amountCents: number;
  currency: string;
  providerReference?: string | null;
};

export type PaymentOperationOrder = {
  status: string;
  totalCents: number;
  currency: string;
};

export type PaymentOperationPlanInput = {
  operation: PaymentOperationKind;
  order: PaymentOperationOrder;
  payment: PaymentOperationPayment;
  amountCents?: number | null;
  reason?: string | null;
};

export type PaymentOperationPlan = {
  operation: PaymentOperationKind;
  decision: PaymentOperationDecision;
  provider: string;
  amountCents: number;
  currency: string;
  requiresProviderReference: boolean;
  manualOnly: boolean;
  reasons: string[];
  metadata: Record<string, string | number | boolean>;
};

const REFUNDABLE_PAYMENT_STATUSES = new Set(['paid', 'captured', 'settled', 'succeeded']);
const VOIDABLE_PAYMENT_STATUSES = new Set(['created', 'pending', 'pending_payment', 'redirect_required', 'authorized']);
const CLOSED_ORDER_STATUSES = new Set(['cancelled', 'refunded', 'voided']);
const MANUAL_PROVIDERS = new Set(['manual', 'inquiry', 'assisted']);

function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() || '';
}

function normalizeProvider(provider: string) {
  return normalizeText(provider) || 'unknown';
}

function normalizeStatus(status: string) {
  return normalizeText(status) || 'unknown';
}

function normalizeCurrency(currency: string) {
  return currency.trim().toUpperCase() || 'UNKNOWN';
}

function requestedAmount(input: PaymentOperationPlanInput) {
  return input.amountCents ?? input.payment.amountCents;
}

export function planPaymentOperation(input: PaymentOperationPlanInput): PaymentOperationPlan {
  const provider = normalizeProvider(input.payment.provider);
  const paymentStatus = normalizeStatus(input.payment.status);
  const orderStatus = normalizeStatus(input.order.status);
  const amountCents = requestedAmount(input);
  const currency = normalizeCurrency(input.payment.currency || input.order.currency);
  const reasons: string[] = [];
  const metadata: Record<string, string | number | boolean> = {
    paymentStatus,
    orderStatus,
    requestedAmountCents: amountCents,
    originalPaymentAmountCents: input.payment.amountCents,
    fullAmount: amountCents === input.payment.amountCents,
    partialAmount: amountCents > 0 && amountCents < input.payment.amountCents
  };

  if (input.reason?.trim()) metadata.reason = input.reason.trim();
  if (input.payment.providerReference?.trim()) metadata.providerReference = input.payment.providerReference.trim();

  if (amountCents <= 0) reasons.push('operation_amount_must_be_positive');
  if (amountCents > input.payment.amountCents) reasons.push('operation_amount_exceeds_payment_amount');
  if (input.order.currency && input.payment.currency && normalizeCurrency(input.order.currency) !== normalizeCurrency(input.payment.currency)) {
    reasons.push('order_payment_currency_mismatch');
  }
  if (CLOSED_ORDER_STATUSES.has(orderStatus)) reasons.push('order_status_not_operation_eligible');

  if (input.operation === 'refund' && !REFUNDABLE_PAYMENT_STATUSES.has(paymentStatus)) {
    reasons.push('payment_status_not_refundable');
  }
  if (input.operation === 'void' && !VOIDABLE_PAYMENT_STATUSES.has(paymentStatus)) {
    reasons.push('payment_status_not_voidable');
  }

  const manualOnly = MANUAL_PROVIDERS.has(provider);
  const requiresProviderReference = !manualOnly;
  if (requiresProviderReference && !input.payment.providerReference?.trim()) {
    reasons.push('provider_reference_required');
  }

  let decision: PaymentOperationDecision = 'ready';
  if (reasons.length > 0) decision = 'blocked';
  else if (manualOnly) decision = 'manual_review';

  return {
    operation: input.operation,
    decision,
    provider,
    amountCents,
    currency,
    requiresProviderReference,
    manualOnly,
    reasons,
    metadata
  };
}
