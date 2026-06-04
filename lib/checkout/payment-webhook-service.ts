import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';
import { normalizePaymentWebhookEvent, type PaymentWebhookEventInput } from './payment-webhook-core';
import {
  buildPaymentWebhookEventPersistenceInput,
  planPaymentWebhookRecord,
  type PaymentWebhookEventPersistenceInput,
  type PaymentWebhookRecordPlan
} from './payment-webhook-record';
import { planPaymentWebhookStateChange, type PaymentWebhookStatePlan } from './payment-webhook-transition-plan';

export type PaymentWebhookServiceResult = {
  status: 'recorded' | 'duplicate' | 'needs_attention';
  paymentAttemptId?: string;
  paymentEventId?: string;
  idempotencyKey: string;
  plan: PaymentWebhookRecordPlan;
  statePlan?: PaymentWebhookStatePlan;
  persistenceInput?: PaymentWebhookEventPersistenceInput;
};

type PaymentAttemptLookup = {
  id: string;
  provider: string;
  providerReference: string | null;
  status: string;
  order: {
    id: string;
    orderNumber: string;
    publicLookupToken: string | null;
    status: string;
    timelineEvents: { title: string; createdAt: Date }[];
  };
};

async function findPaymentAttemptForWebhook(input: {
  provider: string;
  providerReference?: string;
  orderNumber?: string;
  publicLookupToken?: string;
}): Promise<PaymentAttemptLookup | null> {
  const select = {
    id: true,
    provider: true,
    providerReference: true,
    status: true,
    order: {
      select: {
        id: true,
        orderNumber: true,
        publicLookupToken: true,
        status: true,
        timelineEvents: {
          where: { type: 'payment_result' },
          orderBy: { createdAt: 'desc' as const },
          take: 1,
          select: { title: true, createdAt: true }
        }
      }
    }
  };

  if (input.providerReference) {
    const byReference = await prisma.checkoutPaymentAttempt.findFirst({
      where: {
        provider: input.provider,
        providerReference: input.providerReference
      },
      orderBy: { createdAt: 'desc' },
      select
    });
    if (byReference) return byReference;
  }

  if (input.orderNumber || input.publicLookupToken) {
    return prisma.checkoutPaymentAttempt.findFirst({
      where: {
        provider: input.provider,
        order: {
          ...(input.orderNumber ? { orderNumber: input.orderNumber } : {}),
          ...(input.publicLookupToken ? { publicLookupToken: input.publicLookupToken } : {})
        }
      },
      orderBy: { createdAt: 'desc' },
      select
    });
  }

  return null;
}

async function applyTrustedWebhookStateChange(input: {
  paymentAttempt: PaymentAttemptLookup;
  statePlan: PaymentWebhookStatePlan;
  metadata: Record<string, string | number | boolean>;
}) {
  if (!input.statePlan.trusted) return;

  if (input.statePlan.shouldUpdateAttempt) {
    await prisma.checkoutPaymentAttempt.update({
      where: { id: input.paymentAttempt.id },
      data: {
        status: input.statePlan.nextAttemptStatus,
        metadata: input.metadata
      }
    });
  }

  if (input.statePlan.shouldUpdateOrder || input.statePlan.shouldCreateTimelineEvent) {
    await prisma.checkoutOrder.update({
      where: { id: input.paymentAttempt.order.id },
      data: {
        ...(input.statePlan.shouldUpdateOrder ? { status: input.statePlan.nextOrderStatus } : {}),
        ...(input.statePlan.shouldCreateTimelineEvent
          ? {
              timelineEvents: {
                create: {
                  type: 'payment_result',
                  title: input.statePlan.timelineTitle,
                  metadata: input.metadata
                }
              }
            }
          : {})
      }
    });
  }
}

export async function recordPaymentWebhookEvent(input: PaymentWebhookEventInput): Promise<PaymentWebhookServiceResult> {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for payment webhook persistence.');

  const event = normalizePaymentWebhookEvent(input);
  const existing = await prisma.checkoutPaymentEvent.findUnique({
    where: {
      provider_idempotencyKey: {
        provider: event.provider,
        idempotencyKey: event.idempotencyKey
      }
    },
    select: { id: true, paymentAttemptId: true }
  });
  const plan = planPaymentWebhookRecord({
    event,
    existingIdempotencyKey: existing ? event.idempotencyKey : null
  });

  if (existing) {
    return {
      status: 'duplicate',
      paymentAttemptId: existing.paymentAttemptId,
      paymentEventId: existing.id,
      idempotencyKey: event.idempotencyKey,
      plan
    };
  }

  const paymentAttempt = await findPaymentAttemptForWebhook({
    provider: event.provider,
    providerReference: event.providerReference,
    orderNumber: event.orderNumber,
    publicLookupToken: event.publicLookupToken
  });

  if (!paymentAttempt) {
    return {
      status: 'needs_attention',
      idempotencyKey: event.idempotencyKey,
      plan: {
        ...plan,
        persistenceStatus: 'needs_attention',
        shouldApplyPaymentState: false,
        shouldReconcileSettlement: false,
        needsAttention: true,
        metadata: {
          ...plan.metadata,
          missingPaymentAttempt: true
        }
      }
    };
  }

  const statePlan = planPaymentWebhookStateChange({
    event,
    currentOrderStatus: paymentAttempt.order.status,
    currentAttemptStatus: paymentAttempt.status,
    lastEvent: paymentAttempt.order.timelineEvents[0]
  });
  const persistenceInput = buildPaymentWebhookEventPersistenceInput({
    paymentAttemptId: paymentAttempt.id,
    event,
    plan,
    processedAt: statePlan.trusted ? new Date() : undefined
  });
  const metadata = {
    ...persistenceInput.metadata,
    webhookStateTrusted: statePlan.trusted,
    webhookStateReason: statePlan.reason,
    webhookNextOrderStatus: statePlan.nextOrderStatus,
    webhookNextAttemptStatus: statePlan.nextAttemptStatus
  };

  const created = await prisma.checkoutPaymentEvent.create({
    data: {
      ...persistenceInput,
      metadata
    },
    select: { id: true, paymentAttemptId: true }
  });

  await applyTrustedWebhookStateChange({
    paymentAttempt,
    statePlan,
    metadata
  });

  return {
    status: plan.persistenceStatus,
    paymentAttemptId: created.paymentAttemptId,
    paymentEventId: created.id,
    idempotencyKey: event.idempotencyKey,
    plan,
    statePlan,
    persistenceInput: {
      ...persistenceInput,
      metadata
    }
  };
}

export const paymentWebhookService = {
  record: recordPaymentWebhookEvent
};
