import 'server-only';

import type { Prisma } from '@prisma/client';
import { hasDatabase, prisma } from '@/lib/prisma';

export type InstallmentSchedulePlanRow = {
  id: string;
  orderId: string;
  paymentAttemptId: string;
  customerId: string | null;
  status: string;
  currency: string;
  principalCents: number;
  downPaymentCents: number;
  financedAmountCents: number;
  termMonths: number;
  installmentCount: number;
  intervalMonths: number;
  firstDueAt: Date;
  approvedAt: Date | null;
  createdAt: Date;
};

export type InstallmentScheduleEntryRow = {
  id: string;
  planId: string;
  sequence: number;
  status: string;
  dueAt: Date;
  principalCents: number;
  feeCents: number;
  totalCents: number;
};

export type CreateInstallmentScheduleInput = {
  orderId: string;
  paymentAttemptId: string;
  firstDueAt?: Date;
  actorLabel?: string;
  actorRole?: string;
};

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

function normalizeTermMonths(value: number | undefined) {
  if (!Number.isFinite(value)) return undefined;
  const normalized = Math.floor(Number(value));
  return [3, 6, 12, 18].includes(normalized) ? normalized : undefined;
}

function normalizeDownPayment(value: number | undefined, totalCents: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(0, Math.floor(Number(value))), Math.max(0, totalCents));
}

function addMonths(date: Date, months: number) {
  const copy = new Date(date.getTime());
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

function splitEvenly(totalCents: number, count: number) {
  const safeCount = Math.max(1, Math.floor(count));
  const base = Math.floor(totalCents / safeCount);
  const remainder = totalCents - base * safeCount;
  return Array.from({ length: safeCount }, (_, index) => base + (index < remainder ? 1 : 0));
}

function defaultFirstDueAt() {
  return addMonths(new Date(), 1);
}

async function getPlanWithEntries(planId: string, client: Prisma.TransactionClient | typeof prisma = prisma) {
  const plans = await client.$queryRaw<InstallmentSchedulePlanRow[]>`
    SELECT
      "id", "orderId", "paymentAttemptId", "customerId", "status", "currency",
      "principalCents", "downPaymentCents", "financedAmountCents", "termMonths",
      "installmentCount", "intervalMonths", "firstDueAt", "approvedAt", "createdAt"
    FROM "InstallmentPaymentPlan"
    WHERE "id" = ${planId}
    LIMIT 1
  `;
  const entries = await client.$queryRaw<InstallmentScheduleEntryRow[]>`
    SELECT "id", "planId", "sequence", "status", "dueAt", "principalCents", "feeCents", "totalCents"
    FROM "InstallmentPaymentScheduleEntry"
    WHERE "planId" = ${planId}
    ORDER BY "sequence" ASC
  `;
  return { plan: plans[0], entries };
}

export async function createInstallmentScheduleForApprovedAttempt(input: CreateInstallmentScheduleInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for installment schedule creation.');

  const attempt = await prisma.checkoutPaymentAttempt.findFirst({
    where: { id: input.paymentAttemptId, orderId: input.orderId },
    select: {
      id: true,
      orderId: true,
      provider: true,
      status: true,
      amountCents: true,
      currency: true,
      metadata: true,
      order: {
        select: {
          id: true,
          orderNumber: true,
          customerId: true
        }
      }
    }
  });

  if (!attempt) throw new Error('Payment attempt not found.');
  if (attempt.provider !== 'manual') throw new Error('Only manual installment payment attempts can receive schedules.');

  const metadata = metadataRecord(attempt.metadata);
  if (textMetadataValue(metadata.paymentMethodType) !== 'installment') throw new Error('Only installment payment attempts can receive schedules.');
  if (textMetadataValue(metadata.installmentApprovalStatus) !== 'approved') throw new Error('Installment request must be approved before schedule creation.');

  const termMonths = normalizeTermMonths(numberMetadataValue(metadata.installmentApprovedTermMonths) ?? numberMetadataValue(metadata.installmentRequestedTermMonths));
  if (!termMonths) throw new Error('Approved installment term is required before schedule creation.');

  const downPaymentCents = normalizeDownPayment(numberMetadataValue(metadata.installmentDownPaymentCents), attempt.amountCents);
  const financedAmountCents = Math.max(0, attempt.amountCents - downPaymentCents);
  const firstDueAt = input.firstDueAt ?? defaultFirstDueAt();
  const amounts = splitEvenly(financedAmountCents, termMonths);
  const approvedAt = textMetadataValue(metadata.installmentReviewedAt) ? new Date(textMetadataValue(metadata.installmentReviewedAt) as string) : new Date();
  const nowIso = new Date().toISOString();

  return prisma.$transaction(async (tx) => {
    const existing = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "InstallmentPaymentPlan"
      WHERE "paymentAttemptId" = ${attempt.id}
      LIMIT 1
    `;
    if (existing[0]) return getPlanWithEntries(existing[0].id, tx);

    const planMetadata = {
      orderNumber: attempt.order.orderNumber,
      createdBy: input.actorLabel ?? 'Admin',
      createdRole: input.actorRole ?? 'staff',
      source: 'installment_schedule_foundation'
    };

    const inserted = await tx.$queryRaw<InstallmentSchedulePlanRow[]>`
      INSERT INTO "InstallmentPaymentPlan" (
        "orderId", "paymentAttemptId", "customerId", "status", "currency", "principalCents",
        "downPaymentCents", "financedAmountCents", "termMonths", "installmentCount",
        "intervalMonths", "firstDueAt", "approvedAt", "metadata"
      ) VALUES (
        ${attempt.orderId}, ${attempt.id}, ${attempt.order.customerId}, 'active', ${attempt.currency}, ${attempt.amountCents},
        ${downPaymentCents}, ${financedAmountCents}, ${termMonths}, ${termMonths},
        1, ${firstDueAt}, ${approvedAt}, CAST(${JSON.stringify(planMetadata)} AS jsonb)
      )
      RETURNING
        "id", "orderId", "paymentAttemptId", "customerId", "status", "currency",
        "principalCents", "downPaymentCents", "financedAmountCents", "termMonths",
        "installmentCount", "intervalMonths", "firstDueAt", "approvedAt", "createdAt"
    `;

    const plan = inserted[0];
    for (const [index, totalCents] of amounts.entries()) {
      await tx.$executeRaw`
        INSERT INTO "InstallmentPaymentScheduleEntry" (
          "planId", "sequence", "status", "dueAt", "principalCents", "feeCents", "totalCents", "metadata"
        ) VALUES (
          ${plan.id}, ${index + 1}, 'scheduled', ${addMonths(firstDueAt, index)}, ${totalCents}, 0, ${totalCents},
          CAST(${JSON.stringify({ source: 'installment_schedule_foundation' })} AS jsonb)
        )
      `;
    }

    await tx.checkoutPaymentAttempt.update({
      where: { id: attempt.id },
      data: {
        metadata: {
          ...metadata,
          installmentSchedulePlanId: plan.id,
          installmentScheduleStatus: 'active',
          installmentScheduleCreatedAt: nowIso
        }
      }
    });

    await tx.checkoutOrderTimelineEvent.create({
      data: {
        orderId: attempt.orderId,
        type: 'payment.installment.schedule.created',
        title: 'Installment schedule created',
        note: `Installment schedule created for ${termMonths} monthly payments.`,
        actorLabel: input.actorLabel,
        actorRole: input.actorRole,
        metadata: {
          paymentAttemptId: attempt.id,
          planId: plan.id,
          termMonths,
          downPaymentCents,
          financedAmountCents
        }
      }
    });

    return getPlanWithEntries(plan.id, tx);
  });
}
