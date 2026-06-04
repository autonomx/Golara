import {
  type NormalizedPaymentWebhookEvent,
  type PaymentWebhookStatus
} from './payment-webhook-core';

export type PaymentWebhookPersistenceStatus = 'recorded' | 'duplicate' | 'needs_attention';

export type PaymentWebhookRecordPlan = {
  idempotencyKey: string;
  provider: string;
  eventName: string;
  providerReference?: string;
  orderNumber?: string;
  publicLookupToken?: string;
  amountCents?: number;
  currency?: string;
  status: PaymentWebhookStatus;
  persistenceStatus: PaymentWebhookPersistenceStatus;
  shouldApplyPaymentState: boolean;
  shouldReconcileSettlement: boolean;
  needsAttention: boolean;
  metadata: Record<string, string | number | boolean>;
};

export function planPaymentWebhookRecord(input: {
  event: NormalizedPaymentWebhookEvent;
  existingIdempotencyKey?: string | null;
}): PaymentWebhookRecordPlan {
  const duplicate = Boolean(input.existingIdempotencyKey && input.existingIdempotencyKey === input.event.idempotencyKey);
  const needsAttention = input.event.status === 'failed' || input.event.status === 'pending' || !input.event.providerReference;
  const persistenceStatus: PaymentWebhookPersistenceStatus = duplicate
    ? 'duplicate'
    : needsAttention
      ? 'needs_attention'
      : 'recorded';

  return {
    idempotencyKey: input.event.idempotencyKey,
    provider: input.event.provider,
    eventName: input.event.eventName,
    providerReference: input.event.providerReference,
    orderNumber: input.event.orderNumber,
    publicLookupToken: input.event.publicLookupToken,
    amountCents: input.event.amountCents,
    currency: input.event.currency,
    status: input.event.status,
    persistenceStatus,
    shouldApplyPaymentState: !duplicate && input.event.status === 'paid' && Boolean(input.event.providerReference),
    shouldReconcileSettlement: !duplicate && Boolean(input.event.providerReference) && Boolean(input.event.amountCents) && Boolean(input.event.currency),
    needsAttention,
    metadata: {
      duplicate,
      source: 'payment-webhook-record-planner',
      hasProviderReference: Boolean(input.event.providerReference),
      hasOrderReference: Boolean(input.event.orderNumber || input.event.publicLookupToken),
      hasSettlementAmount: Boolean(input.event.amountCents),
      hasSettlementCurrency: Boolean(input.event.currency),
      receivedAt: input.event.receivedAt.toISOString()
    }
  };
}

export function buildPaymentWebhookRecordSummary(plans: PaymentWebhookRecordPlan[]) {
  return plans.reduce((summary, plan) => {
    summary.total += 1;
    if (plan.persistenceStatus === 'recorded') summary.recorded += 1;
    if (plan.persistenceStatus === 'duplicate') summary.duplicate += 1;
    if (plan.persistenceStatus === 'needs_attention') summary.needsAttention += 1;
    if (plan.shouldApplyPaymentState) summary.paymentStateApplications += 1;
    if (plan.shouldReconcileSettlement) summary.settlementCandidates += 1;
    return summary;
  }, {
    total: 0,
    recorded: 0,
    duplicate: 0,
    needsAttention: 0,
    paymentStateApplications: 0,
    settlementCandidates: 0
  });
}
