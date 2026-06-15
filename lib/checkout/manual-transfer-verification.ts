import 'server-only';

import type { Prisma } from '@prisma/client';
import { transitionCheckoutPaymentStatus } from '@/lib/checkout/checkout-status-service';
import { hasDatabase, prisma } from '@/lib/prisma';

export const MANUAL_TRANSFER_VERIFICATION_OUTCOMES = ['received', 'rejected', 'needs_follow_up'] as const;

export type ManualTransferVerificationOutcome = typeof MANUAL_TRANSFER_VERIFICATION_OUTCOMES[number];

type ManualTransferActor = {
  actorLabel?: string;
  actorRole?: string;
};

export type ManualTransferVerificationInput = ManualTransferActor & {
  outcome: ManualTransferVerificationOutcome;
  receivedAmountCents?: number;
  providerReference?: string;
  note?: string;
};

export type ManualTransferReviewQueueItem = {
  id: string;
  orderId: string;
  orderNumber: string;
  status: string;
  amountCents: number;
  currency: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethodLabel?: string;
  manualPaymentReference?: string;
  manualPaymentProofUrl?: string;
  verificationStatus?: string;
  verificationNote?: string;
  providerReference?: string | null;
  createdAt: Date;
};

function optionalText(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function boundedOptionalText(value: string | undefined, maxLength: number) {
  return optionalText(value)?.slice(0, maxLength);
}

function metadataRecord(value: Prisma.JsonValue | null | undefined): Record<string, Prisma.JsonValue> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, Prisma.JsonValue>;
}

function textMetadataValue(value: Prisma.JsonValue | undefined) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
}

function isManualTransferMetadata(metadata: Record<string, Prisma.JsonValue>) {
  return textMetadataValue(metadata.paymentMethodType) === 'manual_transfer';
}

function normalizeReceivedAmount(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value)) return Math.max(0, fallback);
  return Math.max(0, Math.floor(value ?? fallback));
}

function transitionTargetForOutcome(outcome: ManualTransferVerificationOutcome) {
  if (outcome === 'received') return 'paid' as const;
  if (outcome === 'rejected') return 'failed' as const;
  return 'pending' as const;
}

export async function listManualTransferReviewQueue(limit = 100): Promise<ManualTransferReviewQueueItem[]> {
  if (!hasDatabase()) return [];

  const attempts = await prisma.checkoutPaymentAttempt.findMany({
    where: {
      provider: 'manual',
      status: { in: ['created', 'pending', 'failed'] }
    },
    orderBy: { createdAt: 'desc' },
    take: Math.max(1, Math.min(200, Math.floor(limit))),
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          customer: { select: { displayName: true, phone: true } },
          recipientName: true,
          recipientPhone: true
        }
      }
    }
  });

  return attempts.flatMap((attempt) => {
    const metadata = metadataRecord(attempt.metadata);
    if (!isManualTransferMetadata(metadata)) return [];
    return [{
      id: attempt.id,
      orderId: attempt.orderId,
      orderNumber: attempt.order.orderNumber,
      status: attempt.status,
      amountCents: attempt.amountCents,
      currency: attempt.currency,
      customerName: attempt.order.customer?.displayName ?? attempt.order.recipientName ?? undefined,
      customerPhone: attempt.order.customer?.phone ?? attempt.order.recipientPhone ?? undefined,
      paymentMethodLabel: textMetadataValue(metadata.paymentMethodLabel),
      manualPaymentReference: textMetadataValue(metadata.manualPaymentReference),
      manualPaymentProofUrl: textMetadataValue(metadata.manualPaymentProofUrl),
      verificationStatus: textMetadataValue(metadata.manualTransferVerificationStatus),
      verificationNote: textMetadataValue(metadata.manualTransferVerificationNote),
      providerReference: attempt.providerReference,
      createdAt: attempt.createdAt
    }];
  });
}

export async function verifyManualTransferPaymentAttempt(orderId: string, paymentAttemptId: string, input: ManualTransferVerificationInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for manual transfer verification.');

  const attempt = await prisma.checkoutPaymentAttempt.findFirst({
    where: { id: paymentAttemptId, orderId },
    select: {
      id: true,
      orderId: true,
      status: true,
      provider: true,
      amountCents: true,
      metadata: true,
      order: { select: { id: true, orderNumber: true } }
    }
  });
  if (!attempt) throw new Error('Payment attempt not found.');
  if (attempt.provider !== 'manual') throw new Error('Only manual payment attempts can be verified here.');

  const metadata = metadataRecord(attempt.metadata);
  if (!isManualTransferMetadata(metadata)) throw new Error('Only manual-transfer payment attempts can be verified here.');

  const note = boundedOptionalText(input.note, 1000);
  const providerReference = boundedOptionalText(input.providerReference, 120);
  const receivedAmountCents = normalizeReceivedAmount(input.receivedAmountCents, attempt.amountCents);
  const verifiedAt = new Date().toISOString();
  const outcome = input.outcome;
  const to = transitionTargetForOutcome(outcome);

  const updatedMetadata: Prisma.JsonObject = {
    ...metadata,
    manualTransferVerificationStatus: outcome,
    manualTransferVerifiedAt: verifiedAt,
    manualTransferVerifiedBy: boundedOptionalText(input.actorLabel, 120) ?? 'Admin',
    manualTransferVerifiedRole: boundedOptionalText(input.actorRole, 80) ?? 'staff',
    manualTransferReceivedAmountCents: receivedAmountCents,
    ...(note ? { manualTransferVerificationNote: note } : {})
  };

  await prisma.checkoutPaymentAttempt.update({
    where: { id: attempt.id },
    data: {
      providerReference: providerReference ?? undefined,
      metadata: updatedMetadata
    }
  });

  const updated = await transitionCheckoutPaymentStatus({
    paymentAttemptId: attempt.id,
    to,
    note,
    actorLabel: input.actorLabel,
    actorRole: input.actorRole
  });

  return {
    ...updated,
    order: attempt.order,
    verificationOutcome: outcome,
    receivedAmountCents,
    providerReference
  };
}
