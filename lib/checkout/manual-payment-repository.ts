import 'server-only';

import { transitionCheckoutPaymentStatus } from '@/lib/checkout/checkout-status-service';
import { hasDatabase, prisma } from '@/lib/prisma';

type ManualPaymentActor = {
  actorLabel?: string;
  actorRole?: string;
};

export type MarkManualPaymentInput = {
  amountCents?: number;
  providerReference?: string;
  note?: string;
} & ManualPaymentActor;

function optionalText(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function normalizeAmount(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value)) return Math.max(0, fallback);
  return Math.max(0, Math.floor(value ?? fallback));
}

export async function markOrderManualPayment(orderId: string, input: MarkManualPaymentInput = {}) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for manual payment marking.');

  const order = await prisma.checkoutOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      currency: true,
      totalCents: true,
      paymentAttempts: { select: { id: true, status: true }, orderBy: { createdAt: 'desc' }, take: 1 }
    }
  });
  if (!order) throw new Error('Order not found.');
  if (order.status === 'cancelled') throw new Error('Cancelled orders cannot be manually marked paid.');
  if (order.paymentAttempts[0]?.status === 'paid') throw new Error('Order already has a paid payment attempt.');

  const amountCents = normalizeAmount(input.amountCents, order.totalCents);
  const attempt = await prisma.checkoutPaymentAttempt.create({
    data: {
      orderId,
      provider: 'manual',
      status: 'created',
      amountCents,
      currency: order.currency,
      providerReference: optionalText(input.providerReference),
      metadata: {
        source: 'admin_manual',
        note: optionalText(input.note) ?? null
      }
    },
    select: { id: true }
  });

  await transitionCheckoutPaymentStatus({
    paymentAttemptId: attempt.id,
    to: 'paid',
    note: optionalText(input.note),
    actorLabel: optionalText(input.actorLabel),
    actorRole: optionalText(input.actorRole)
  });

  return prisma.checkoutPaymentAttempt.findUniqueOrThrow({
    where: { id: attempt.id },
    include: { order: { select: { id: true, orderNumber: true } } }
  });
}
