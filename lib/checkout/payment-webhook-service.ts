import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';
import { normalizePaymentWebhookEvent, type PaymentWebhookEventInput } from './payment-webhook-core';
import {
  buildPaymentWebhookEventPersistenceInput,
  planPaymentWebhookRecord,
  type PaymentWebhookEventPersistenceInput,
  type PaymentWebhookRecordPlan
} from './payment-webhook-record';

export type PaymentWebhookServiceResult = {
  status: 'recorded' | 'duplicate' | 'needs_attention';
  paymentAttemptId?: string;
  paymentEventId?: string;
  idempotencyKey: string;
  plan: PaymentWebhookRecordPlan;
  persistenceInput?: PaymentWebhookEventPersistenceInput;
};

type PaymentAttemptLookup = {
  id: string;
  provider: string;
  providerReference: string | null;
  order: {
    orderNumber: string;
    publicLookupToken: string | null;
  };
};

async function findPaymentAttemptForWebhook(input: {
  provider: string;
  providerReference?: string;
  orderNumber?: string;
  publicLookupToken?: string;
}): Promise<PaymentAttemptLookup | null> {
  if (input.providerReference) {
    const byReference = await prisma.checkoutPaymentAttempt.findFirst({
      where: {
        provider: input.provider,
        providerReference: input.providerReference
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        provider: true,
        providerReference: true,
        order: { select: { orderNumber: true, publicLookupToken: true } }
      }
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
      select: {
        id: true,
        provider: true,
        providerReference: true,
        order: { select: { orderNumber: true, publicLookupToken: true } }
      }
    });
  }

  return null;
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

  const persistenceInput = buildPaymentWebhookEventPersistenceInput({
    paymentAttemptId: paymentAttempt.id,
    event,
    plan,
    processedAt: plan.shouldApplyPaymentState ? new Date() : undefined
  });

  const created = await prisma.checkoutPaymentEvent.create({
    data: persistenceInput,
    select: { id: true, paymentAttemptId: true }
  });

  return {
    status: plan.persistenceStatus,
    paymentAttemptId: created.paymentAttemptId,
    paymentEventId: created.id,
    idempotencyKey: event.idempotencyKey,
    plan,
    persistenceInput
  };
}

export const paymentWebhookService = {
  record: recordPaymentWebhookEvent
};
