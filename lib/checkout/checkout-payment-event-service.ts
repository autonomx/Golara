import 'server-only';

import type { Prisma } from '@prisma/client';
import { transitionCheckoutPaymentStatus } from '@/lib/checkout/checkout-status-service';
import { assertCheckoutPaymentStatus, type CheckoutPaymentStatus } from '@/lib/checkout/checkout-state-machine';
import { hasDatabase, prisma } from '@/lib/prisma';

export type RecordCheckoutPaymentEventInput = {
  paymentAttemptId: string;
  provider: string;
  eventType: string;
  idempotencyKey: string;
  status?: CheckoutPaymentStatus;
  metadata?: Record<string, string | number | boolean | null>;
  note?: string;
  actorLabel?: string;
  actorRole?: string;
};

function optionalText(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function metadataJson(metadata?: Record<string, string | number | boolean | null>): Prisma.InputJsonObject | undefined {
  if (!metadata) return undefined;
  return metadata;
}

function assertDatabaseReady() {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for checkout payment events.');
}

export async function recordCheckoutPaymentEvent(input: RecordCheckoutPaymentEventInput) {
  assertDatabaseReady();

  const provider = optionalText(input.provider);
  const eventType = optionalText(input.eventType);
  const idempotencyKey = optionalText(input.idempotencyKey);
  if (!provider) throw new Error('Payment event provider is required.');
  if (!eventType) throw new Error('Payment event type is required.');
  if (!idempotencyKey) throw new Error('Payment event idempotency key is required.');

  const existingEvent = await prisma.checkoutPaymentEvent.findUnique({
    where: { provider_idempotencyKey: { provider, idempotencyKey } }
  });
  if (existingEvent) {
    return { ok: true as const, duplicate: true as const, event: existingEvent };
  }

  const paymentAttempt = await prisma.checkoutPaymentAttempt.findUnique({
    where: { id: input.paymentAttemptId },
    select: { id: true, status: true }
  });
  if (!paymentAttempt) throw new Error(`Checkout payment attempt not found: ${input.paymentAttemptId}`);

  const targetStatus = input.status ? assertCheckoutPaymentStatus(input.status) : undefined;
  const event = await prisma.checkoutPaymentEvent.create({
    data: {
      paymentAttemptId: paymentAttempt.id,
      provider,
      eventType,
      idempotencyKey,
      status: targetStatus,
      metadata: metadataJson(input.metadata)
    }
  });

  if (targetStatus && paymentAttempt.status !== targetStatus) {
    await transitionCheckoutPaymentStatus({
      paymentAttemptId: paymentAttempt.id,
      to: targetStatus,
      note: input.note,
      actorLabel: input.actorLabel,
      actorRole: input.actorRole
    });
  }

  const processedEvent = await prisma.checkoutPaymentEvent.update({
    where: { id: event.id },
    data: { processedAt: new Date() }
  });

  return { ok: true as const, duplicate: false as const, event: processedEvent };
}
