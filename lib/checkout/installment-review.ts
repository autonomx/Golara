import 'server-only';

import type { Prisma } from '@prisma/client';
import { transitionCheckoutPaymentStatus } from '@/lib/checkout/checkout-status-service';
import { hasDatabase, prisma } from '@/lib/prisma';

export const INSTALLMENT_REVIEW_OUTCOMES = ['approved', 'rejected', 'needs_follow_up'] as const;

export type InstallmentReviewOutcome = typeof INSTALLMENT_REVIEW_OUTCOMES[number];

type InstallmentReviewActor = {
  actorLabel?: string;
  actorRole?: string;
};

export type InstallmentReviewInput = InstallmentReviewActor & {
  outcome: InstallmentReviewOutcome;
  approvedTermMonths?: number;
  downPaymentCents?: number;
  note?: string;
};

export type InstallmentReviewQueueItem = {
  id: string;
  orderId: string;
  orderNumber: string;
  status: string;
  amountCents: number;
  currency: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethodLabel?: string;
  requestedTermMonths?: number;
  requestNote?: string;
  approvalStatus?: string;
  reviewNote?: string;
  approvedTermMonths?: number;
  downPaymentCents?: number;
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

function numberMetadataValue(value: Prisma.JsonValue | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function isInstallmentMetadata(metadata: Record<string, Prisma.JsonValue>) {
  return textMetadataValue(metadata.paymentMethodType) === 'installment';
}

function normalizeTermMonths(value: number | undefined, fallback: number | undefined) {
  const candidate = Number.isFinite(value) ? Number(value) : fallback;
  if (!Number.isFinite(candidate)) return undefined;
  const normalized = Math.floor(Number(candidate));
  return [3, 6, 12, 18].includes(normalized) ? normalized : undefined;
}

function normalizeMoneyCents(value: number | undefined) {
  if (!Number.isFinite(value)) return undefined;
  return Math.max(0, Math.floor(Number(value)));
}

function transitionTargetForOutcome(outcome: InstallmentReviewOutcome) {
  if (outcome === 'approved') return 'pending' as const;
  if (outcome === 'rejected') return 'failed' as const;
  return 'pending' as const;
}

export async function listInstallmentReviewQueue(limit = 100): Promise<InstallmentReviewQueueItem[]> {
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
    if (!isInstallmentMetadata(metadata)) return [];
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
      requestedTermMonths: numberMetadataValue(metadata.installmentRequestedTermMonths),
      requestNote: textMetadataValue(metadata.installmentRequestNote),
      approvalStatus: textMetadataValue(metadata.installmentApprovalStatus),
      reviewNote: textMetadataValue(metadata.installmentReviewNote),
      approvedTermMonths: numberMetadataValue(metadata.installmentApprovedTermMonths),
      downPaymentCents: numberMetadataValue(metadata.installmentDownPaymentCents),
      createdAt: attempt.createdAt
    }];
  });
}

export async function reviewInstallmentPaymentAttempt(orderId: string, paymentAttemptId: string, input: InstallmentReviewInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for installment review.');

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
  if (attempt.provider !== 'manual') throw new Error('Only manual installment payment attempts can be reviewed here.');

  const metadata = metadataRecord(attempt.metadata);
  if (!isInstallmentMetadata(metadata)) throw new Error('Only installment payment attempts can be reviewed here.');

  const note = boundedOptionalText(input.note, 1000);
  const reviewedAt = new Date().toISOString();
  const outcome = input.outcome;
  const requestedTerm = numberMetadataValue(metadata.installmentRequestedTermMonths);
  const approvedTermMonths = normalizeTermMonths(input.approvedTermMonths, requestedTerm);
  const downPaymentCents = normalizeMoneyCents(input.downPaymentCents);
  const approvalStatus = outcome === 'approved' ? 'approved' : outcome === 'rejected' ? 'rejected' : 'needs_follow_up';

  const updatedMetadata: Prisma.JsonObject = {
    ...metadata,
    installmentApprovalStatus: approvalStatus,
    installmentReviewedAt: reviewedAt,
    installmentReviewedBy: boundedOptionalText(input.actorLabel, 120) ?? 'Admin',
    installmentReviewedRole: boundedOptionalText(input.actorRole, 80) ?? 'staff',
    ...(approvedTermMonths ? { installmentApprovedTermMonths: approvedTermMonths } : {}),
    ...(downPaymentCents !== undefined ? { installmentDownPaymentCents: downPaymentCents } : {}),
    ...(note ? { installmentReviewNote: note } : {})
  };

  await prisma.checkoutPaymentAttempt.update({
    where: { id: attempt.id },
    data: { metadata: updatedMetadata }
  });

  const updated = await transitionCheckoutPaymentStatus({
    paymentAttemptId: attempt.id,
    to: transitionTargetForOutcome(outcome),
    note,
    actorLabel: input.actorLabel,
    actorRole: input.actorRole
  });

  return {
    ...updated,
    order: attempt.order,
    reviewOutcome: outcome,
    approvedTermMonths,
    downPaymentCents
  };
}
