import 'server-only';

import type { Prisma } from '@prisma/client';
import { hasDatabase, prisma } from '@/lib/prisma';

export const INSTALLMENT_COLLECTION_OUTCOMES = ['paid', 'failed', 'waived'] as const;

export type InstallmentCollectionOutcome = typeof INSTALLMENT_COLLECTION_OUTCOMES[number];

type InstallmentCollectionActor = {
  actorLabel?: string;
  actorRole?: string;
};

export type InstallmentCollectionInput = InstallmentCollectionActor & {
  entryId: string;
  outcome: InstallmentCollectionOutcome;
  collectedAmountCents?: number;
  providerReference?: string;
  note?: string;
  collectedAt?: Date;
};

export type InstallmentCollectionQueueEntry = {
  id: string;
  planId: string;
  orderId: string;
  orderNumber: string;
  paymentAttemptId: string;
  sequence: number;
  status: string;
  planStatus: string;
  dueAt: Date;
  paidAt: Date | null;
  totalCents: number;
  currency: string;
  termMonths: number;
  installmentCount: number;
  customerName?: string;
  customerPhone?: string;
};

export type InstallmentCollectionResult = InstallmentCollectionQueueEntry & {
  outcome: InstallmentCollectionOutcome;
  collectedAmountCents?: number;
  providerReference?: string;
  note?: string;
  nextPlanStatus: string;
};

type InstallmentCollectionQueueRow = InstallmentCollectionQueueEntry & {
  recipientName: string | null;
  recipientPhone: string | null;
  customerName: string | null;
  customerPhone: string | null;
};

type InstallmentCollectionDetailRow = InstallmentCollectionQueueRow & {
  metadata: Prisma.JsonValue | null;
  planMetadata: Prisma.JsonValue | null;
};

type EntryStatusCount = {
  status: string;
  count: number;
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

function normalizeOutcome(value: InstallmentCollectionOutcome): InstallmentCollectionOutcome {
  if (value === 'paid' || value === 'failed' || value === 'waived') return value;
  throw new Error('Unsupported installment collection outcome.');
}

function normalizeMoneyCents(value: number | undefined, fallback: number | undefined) {
  const candidate = Number.isFinite(value) ? Number(value) : fallback;
  if (!Number.isFinite(candidate)) return undefined;
  return Math.max(0, Math.floor(Number(candidate)));
}

function toQueueEntry(row: InstallmentCollectionQueueRow): InstallmentCollectionQueueEntry {
  return {
    id: row.id,
    planId: row.planId,
    orderId: row.orderId,
    orderNumber: row.orderNumber,
    paymentAttemptId: row.paymentAttemptId,
    sequence: row.sequence,
    status: row.status,
    planStatus: row.planStatus,
    dueAt: row.dueAt,
    paidAt: row.paidAt,
    totalCents: row.totalCents,
    currency: row.currency,
    termMonths: row.termMonths,
    installmentCount: row.installmentCount,
    customerName: row.customerName ?? row.recipientName ?? undefined,
    customerPhone: row.customerPhone ?? row.recipientPhone ?? undefined
  };
}

function nextPlanStatusAfter(counts: EntryStatusCount[], outcome: InstallmentCollectionOutcome) {
  const total = counts.reduce((sum, item) => sum + item.count, 0);
  const terminal = counts.filter((item) => item.status === 'paid' || item.status === 'waived').reduce((sum, item) => sum + item.count, 0);
  if (total > 0 && terminal === total) return 'completed';
  if (outcome === 'failed') return 'attention_required';
  return 'active';
}

export async function listInstallmentCollectionQueue(limit = 100): Promise<InstallmentCollectionQueueEntry[]> {
  if (!hasDatabase()) return [];

  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
  const rows = await prisma.$queryRaw<InstallmentCollectionQueueRow[]>`
    SELECT
      entry."id", entry."planId", entry."sequence", entry."status", entry."dueAt", entry."paidAt", entry."totalCents",
      plan."orderId", plan."paymentAttemptId", plan."status" AS "planStatus", plan."currency", plan."termMonths", plan."installmentCount",
      orders."orderNumber", orders."recipientName", orders."recipientPhone",
      customer."displayName" AS "customerName", customer."phone" AS "customerPhone"
    FROM "InstallmentPaymentScheduleEntry" entry
    INNER JOIN "InstallmentPaymentPlan" plan ON plan."id" = entry."planId"
    INNER JOIN "CheckoutOrder" orders ON orders."id" = plan."orderId"
    LEFT JOIN "CustomerProfile" customer ON customer."id" = plan."customerId"
    WHERE plan."status" IN ('active', 'attention_required')
      AND entry."status" IN ('scheduled', 'failed')
    ORDER BY entry."dueAt" ASC, entry."sequence" ASC
    LIMIT ${safeLimit}
  `;

  return rows.map(toQueueEntry);
}

export async function collectInstallmentScheduleEntry(input: InstallmentCollectionInput): Promise<InstallmentCollectionResult> {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for installment collection tracking.');

  const entryId = optionalText(input.entryId);
  if (!entryId) throw new Error('Installment schedule entry is required.');

  const outcome = normalizeOutcome(input.outcome);
  const actorLabel = boundedOptionalText(input.actorLabel, 120) ?? 'Admin';
  const actorRole = boundedOptionalText(input.actorRole, 80) ?? 'staff';
  const providerReference = boundedOptionalText(input.providerReference, 160);
  const note = boundedOptionalText(input.note, 1000);
  const collectedAt = input.collectedAt ?? new Date();
  const collectedAtIso = collectedAt.toISOString();

  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<InstallmentCollectionDetailRow[]>`
      SELECT
        entry."id", entry."planId", entry."sequence", entry."status", entry."dueAt", entry."paidAt", entry."totalCents", entry."metadata",
        plan."orderId", plan."paymentAttemptId", plan."status" AS "planStatus", plan."currency", plan."termMonths", plan."installmentCount", plan."metadata" AS "planMetadata",
        orders."orderNumber", orders."recipientName", orders."recipientPhone",
        customer."displayName" AS "customerName", customer."phone" AS "customerPhone"
      FROM "InstallmentPaymentScheduleEntry" entry
      INNER JOIN "InstallmentPaymentPlan" plan ON plan."id" = entry."planId"
      INNER JOIN "CheckoutOrder" orders ON orders."id" = plan."orderId"
      LEFT JOIN "CustomerProfile" customer ON customer."id" = plan."customerId"
      WHERE entry."id" = ${entryId}
      LIMIT 1
    `;

    const row = rows[0];
    if (!row) throw new Error('Installment schedule entry not found.');
    if (row.status === 'paid' || row.status === 'waived') throw new Error('Finalized installment schedule entries cannot be collected again.');

    const collectedAmountCents = normalizeMoneyCents(input.collectedAmountCents, outcome === 'paid' ? row.totalCents : undefined);
    const entryMetadata: Prisma.JsonObject = {
      ...metadataRecord(row.metadata),
      installmentCollectionStatus: outcome,
      installmentCollectionReviewedAt: collectedAtIso,
      installmentCollectionReviewedBy: actorLabel,
      installmentCollectionReviewedRole: actorRole,
      ...(outcome === 'paid' ? { installmentCollectedAt: collectedAtIso } : {}),
      ...(collectedAmountCents !== undefined ? { installmentCollectedAmountCents: collectedAmountCents } : {}),
      ...(providerReference ? { installmentCollectionProviderReference: providerReference } : {}),
      ...(note ? { installmentCollectionNote: note } : {})
    };

    await tx.$executeRaw`
      UPDATE "InstallmentPaymentScheduleEntry"
      SET "status" = ${outcome},
          "paidAt" = ${outcome === 'paid' ? collectedAt : null},
          "metadata" = CAST(${JSON.stringify(entryMetadata)} AS jsonb),
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${row.id}
    `;

    const counts = await tx.$queryRaw<EntryStatusCount[]>`
      SELECT "status", COUNT(*)::int AS "count"
      FROM "InstallmentPaymentScheduleEntry"
      WHERE "planId" = ${row.planId}
      GROUP BY "status"
    `;
    const nextPlanStatus = nextPlanStatusAfter(counts, outcome);
    const planMetadata: Prisma.JsonObject = {
      ...metadataRecord(row.planMetadata),
      installmentCollectionStatus: nextPlanStatus,
      lastInstallmentCollectionEvent: {
        entryId: row.id,
        sequence: row.sequence,
        outcome,
        reviewedAt: collectedAtIso,
        actorLabel,
        actorRole,
        ...(collectedAmountCents !== undefined ? { collectedAmountCents } : {}),
        ...(providerReference ? { providerReference } : {}),
        noteAdded: Boolean(note)
      }
    };

    await tx.$executeRaw`
      UPDATE "InstallmentPaymentPlan"
      SET "status" = ${nextPlanStatus},
          "metadata" = CAST(${JSON.stringify(planMetadata)} AS jsonb),
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${row.planId}
    `;

    await tx.checkoutOrderTimelineEvent.create({
      data: {
        orderId: row.orderId,
        type: `payment.installment.collection.${outcome}`,
        title: outcome === 'paid' ? 'Installment payment collected' : outcome === 'waived' ? 'Installment payment waived' : 'Installment payment failed',
        note: `Installment payment ${row.sequence} marked ${outcome}.`,
        actorLabel,
        actorRole,
        metadata: {
          paymentAttemptId: row.paymentAttemptId,
          planId: row.planId,
          entryId: row.id,
          sequence: row.sequence,
          outcome,
          nextPlanStatus,
          collectedAmountCents: collectedAmountCents ?? null,
          providerReference: providerReference ?? null,
          noteAdded: Boolean(note)
        }
      }
    });

    return {
      ...toQueueEntry(row),
      status: outcome,
      paidAt: outcome === 'paid' ? collectedAt : row.paidAt,
      outcome,
      collectedAmountCents,
      providerReference,
      note,
      nextPlanStatus
    };
  });
}
