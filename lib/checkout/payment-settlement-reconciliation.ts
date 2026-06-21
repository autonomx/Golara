export type PaymentSettlementStatus = 'settled' | 'amount_mismatch' | 'currency_mismatch' | 'pending' | 'needs_attention';

export type PaymentSettlementInput = {
  provider: string;
  providerReference?: string | null;
  webhookStatus?: string | null;
  orderNumber?: string | null;
  orderTotalCents?: number | null;
  orderCurrency?: string | null;
  webhookAmountCents?: number | null;
  webhookCurrency?: string | null;
  eventId?: string | null;
  idempotencyKey?: string | null;
};

export type PaymentSettlementPlan = {
  status: PaymentSettlementStatus;
  provider: string;
  providerReference?: string;
  orderNumber?: string;
  expectedAmountCents?: number;
  actualAmountCents?: number;
  expectedCurrency?: string;
  actualCurrency?: string;
  needsAttention: boolean;
  metadata: Record<string, string | number | boolean>;
};

function cleanText(value?: string | null) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function cleanCurrency(value?: string | null) {
  return cleanText(value)?.toUpperCase();
}

function cleanAmount(value?: number | null) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.trunc(value) : undefined;
}

function determinePaymentSettlementStatus(input: {
  providerReference: string | undefined;
  orderNumber: string | undefined;
  webhookStatus: string;
  expectedAmountCents: number | undefined;
  actualAmountCents: number | undefined;
  expectedCurrency: string | undefined;
  actualCurrency: string | undefined;
}): PaymentSettlementStatus {
  if (!input.providerReference || !input.orderNumber || input.webhookStatus === 'failed' || input.webhookStatus === 'cancelled') {
    return 'needs_attention';
  }
  if (input.webhookStatus !== 'paid') return 'pending';
  if (input.expectedAmountCents !== undefined && input.actualAmountCents !== undefined && input.expectedAmountCents !== input.actualAmountCents) {
    return 'amount_mismatch';
  }
  if (input.expectedCurrency && input.actualCurrency && input.expectedCurrency !== input.actualCurrency) return 'currency_mismatch';
  return 'settled';
}

export function planPaymentSettlementReconciliation(input: PaymentSettlementInput): PaymentSettlementPlan {
  const provider = cleanText(input.provider) || 'unknown';
  const providerReference = cleanText(input.providerReference);
  const orderNumber = cleanText(input.orderNumber);
  const expectedAmountCents = cleanAmount(input.orderTotalCents);
  const actualAmountCents = cleanAmount(input.webhookAmountCents);
  const expectedCurrency = cleanCurrency(input.orderCurrency);
  const actualCurrency = cleanCurrency(input.webhookCurrency);
  const webhookStatus = cleanText(input.webhookStatus)?.toLowerCase() || 'pending';
  const status = determinePaymentSettlementStatus({
    providerReference,
    orderNumber,
    webhookStatus,
    expectedAmountCents,
    actualAmountCents,
    expectedCurrency,
    actualCurrency
  });

  return {
    status,
    provider,
    providerReference,
    orderNumber,
    expectedAmountCents,
    actualAmountCents,
    expectedCurrency,
    actualCurrency,
    needsAttention: status !== 'settled',
    metadata: {
      source: 'payment-settlement-reconciliation',
      eventId: cleanText(input.eventId) || '',
      idempotencyKey: cleanText(input.idempotencyKey) || '',
      webhookStatus,
      hasProviderReference: Boolean(providerReference),
      hasOrderNumber: Boolean(orderNumber),
      hasExpectedAmount: expectedAmountCents !== undefined,
      hasActualAmount: actualAmountCents !== undefined,
      hasExpectedCurrency: Boolean(expectedCurrency),
      hasActualCurrency: Boolean(actualCurrency)
    }
  };
}

export function summarizePaymentSettlementPlans(plans: PaymentSettlementPlan[]) {
  return plans.reduce((summary, plan) => {
    summary.total += 1;
    if (plan.status === 'settled') summary.settled += 1;
    if (plan.status === 'amount_mismatch') summary.amountMismatch += 1;
    if (plan.status === 'currency_mismatch') summary.currencyMismatch += 1;
    if (plan.status === 'pending') summary.pending += 1;
    if (plan.status === 'needs_attention') summary.needsAttention += 1;
    return summary;
  }, {
    total: 0,
    settled: 0,
    amountMismatch: 0,
    currencyMismatch: 0,
    pending: 0,
    needsAttention: 0
  });
}
