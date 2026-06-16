import 'server-only';

import type { Prisma } from '@prisma/client';
import { COD_COLLECTION_STATUSES, type CodCollectionStatus } from '@/lib/checkout/payment-method-checkout-selection';
import { hasDatabase, prisma } from '@/lib/prisma';

type CodCollectionUpdateInput = {
  orderId: string;
  paymentAttemptId: string;
  status: CodCollectionStatus;
  note?: string;
  actorLabel?: string;
  actorRole?: string;
};

type JsonMetadata = Record<string, Prisma.JsonValue>;

const NOTE_MAX_LENGTH = 1000;
const ACTOR_LABEL_MAX_LENGTH = 120;
const ACTOR_ROLE_MAX_LENGTH = 80;

export function assertCodCollectionStatus(value: string): CodCollectionStatus {
  if ((COD_COLLECTION_STATUSES as readonly string[]).includes(value)) return value as CodCollectionStatus;
  throw new Error(`Unknown COD collection status: ${value}`);
}

function metadataObject(value: Prisma.JsonValue | null | undefined): JsonMetadata {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return { ...(value as JsonMetadata) };
}

function isCodAttemptMetadata(metadata: JsonMetadata) {
  return metadata.codPaymentSelected === true || metadata.codRequiresDeliveryCollection === true || metadata.paymentMethodType === 'cod';
}

function boundedOptionalText(value: string | undefined, maxLength: number) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

export async function updateCodCollectionStatus(input: CodCollectionUpdateInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for COD collection status updates.');

  const note = boundedOptionalText(input.note, NOTE_MAX_LENGTH);
  const actorLabel = boundedOptionalText(input.actorLabel, ACTOR_LABEL_MAX_LENGTH);
  const actorRole = boundedOptionalText(input.actorRole, ACTOR_ROLE_MAX_LENGTH);
  const updatedAt = new Date().toISOString();

  return prisma.$transaction(async (tx) => {
    const attempt = await tx.checkoutPaymentAttempt.findFirst({
      where: { id: input.paymentAttemptId, orderId: input.orderId },
      select: {
        id: true,
        provider: true,
        metadata: true,
        order: { select: { id: true, orderNumber: true } }
      }
    });

    if (!attempt) throw new Error('COD payment attempt not found.');
    const metadata = metadataObject(attempt.metadata);
    if (!isCodAttemptMetadata(metadata)) throw new Error('Only COD payment attempts can update delivery collection status.');

    const fromStatus = typeof metadata.codCollectionStatus === 'string' ? metadata.codCollectionStatus : 'pending';
    const nextMetadata = {
      ...metadata,
      codCollectionStatus: input.status,
      codCollectionUpdatedAt: updatedAt,
      codCollectionUpdatedBy: actorLabel ?? 'staff',
      codCollectionUpdatedByRole: actorRole ?? 'staff'
    } as Prisma.InputJsonObject;
    if (note) nextMetadata.codCollectionNote = note;

    const paymentAttempt = await tx.checkoutPaymentAttempt.update({
      where: { id: attempt.id },
      data: { metadata: nextMetadata },
      select: {
        id: true,
        provider: true,
        metadata: true,
        order: { select: { id: true, orderNumber: true } }
      }
    });

    await tx.checkoutOrderTimelineEvent.create({
      data: {
        orderId: attempt.order.id,
        type: 'cod_collection_status_updated',
        title: `COD collection marked ${input.status}`,
        note,
        actorLabel,
        actorRole,
        metadata: {
          paymentAttemptId: attempt.id,
          fromStatus,
          toStatus: input.status,
          provider: attempt.provider
        }
      }
    });

    return { order: paymentAttempt.order, paymentAttempt, fromStatus, toStatus: input.status };
  });
}
