import 'server-only';

import type { Prisma } from '@prisma/client';
import { hasDatabase, prisma } from '@/lib/prisma';
import {
  buildInstallmentReversalBoundaryMetadata,
  normalizeInstallmentReversalOperation,
  type InstallmentReversalOperation
} from '@/lib/checkout/installment-reversal-boundary';

type InstallmentReversalActor = {
  actorLabel?: string;
  actorRole?: string;
};

export type InstallmentReversalPersistenceInput = InstallmentReversalActor & {
  planId: string;
  operation: InstallmentReversalOperation;
  requestedAmountCents?: number;
  reason?: string;
  recordedAt?: Date;
};

export type InstallmentReversalPersistenceResult = {
  planId: string;
  orderId: string;
  orderNumber: string;
  paymentAttemptId: string;
  operation: InstallmentReversalOperation;
  nextPlanStatus: 'cancelled' | 'refund_pending';
  affectedScheduleEntries: number;
  metadata: ReturnType<typeof buildInstallmentReversalBoundaryMetadata>;
};

type InstallmentReversalPlanRow = {
  id: string;
  orderId: string;
  orderNumber: string;
  paymentAttemptId: string;
  status: string;
  currency: string;
  financedAmountCents: number;
  metadata: Prisma.JsonValue | null;
};

type UpdatedCountRow = {
  count: number;
};

function optionalText(value?: string, fallback = '') {
  const normalized = value?.trim();
  return normalized || fallback;
}

function metadataObject(value: Prisma.JsonValue | null | undefined): Prisma.JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Prisma.JsonObject;
}

function nextPlanStatusFor(operation: InstallmentReversalOperation) {
  return operation === 'refund' ? 'refund_pending' : 'cancelled';
}

function scheduleStatusesFor(operation: InstallmentReversalOperation) {
  return operation === 'refund' ? ['paid', 'waived', 'scheduled', 'failed'] : ['scheduled', 'failed'];
}

function nextScheduleStatusFor(operation: InstallmentReversalOperation, status: string) {
  if (operation === 'cancel') return 'cancelled';
  return status === 'paid' || status === 'waived' ? 'refund_pending' : 'cancelled';
}

export async function persistInstallmentReversalBoundary(input: InstallmentReversalPersistenceInput): Promise<InstallmentReversalPersistenceResult> {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for installment reversal persistence.');

  const planId = optionalText(input.planId);
  if (!planId) throw new Error('Installment payment plan is required.');

  const operation = normalizeInstallmentReversalOperation(input.operation);
  const actorLabel = optionalText(input.actorLabel, 'Admin').slice(0, 120);
  const actorRole = optionalText(input.actorRole, 'owner').slice(0, 80);
  const recordedAt = input.recordedAt ?? new Date();

  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<InstallmentReversalPlanRow[]>`
      SELECT
        plan."id", plan."orderId", plan."paymentAttemptId", plan."status", plan."currency", plan."financedAmountCents", plan."metadata",
        orders."orderNumber"
      FROM "InstallmentPaymentPlan" plan
      INNER JOIN "CheckoutOrder" orders ON orders."id" = plan."orderId"
      WHERE plan."id" = ${planId}
      LIMIT 1
    `;

    const plan = rows[0];
    if (!plan) throw new Error('Installment payment plan not found.');
    if (plan.status === 'completed' || plan.status === 'cancelled' || plan.status === 'refunded') {
      throw new Error('Finalized installment plans cannot be reversed again.');
    }

    const metadata = buildInstallmentReversalBoundaryMetadata({
      operation,
      planId: plan.id,
      orderId: plan.orderId,
      paymentAttemptId: plan.paymentAttemptId,
      fromPlanStatus: plan.status,
      requestedAmountCents: input.requestedAmountCents ?? plan.financedAmountCents,
      currency: plan.currency,
      reason: input.reason,
      actorLabel,
      actorRole,
      recordedAt
    });
    const nextPlanStatus = nextPlanStatusFor(operation);
    const nextPlanMetadata: Prisma.JsonObject = {
      ...metadataObject(plan.metadata),
      ...metadata,
      installmentReversalLastUpdatedAt: metadata.installmentReversalRecordedAt
    };

    await tx.$executeRaw`
      UPDATE "InstallmentPaymentPlan"
      SET "status" = ${nextPlanStatus},
          "metadata" = CAST(${JSON.stringify(nextPlanMetadata)} AS jsonb),
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${plan.id}
    `;

    let affectedScheduleEntries = 0;
    for (const status of scheduleStatusesFor(operation)) {
      const nextStatus = nextScheduleStatusFor(operation, status);
      const entryMetadata = {
        ...metadata,
        installmentReversalPreviousScheduleStatus: status,
        installmentReversalScheduleStatus: nextStatus
      };
      const updatedRows = await tx.$queryRaw<UpdatedCountRow[]>`
        WITH updated_entries AS (
          UPDATE "InstallmentPaymentScheduleEntry"
          SET "status" = ${nextStatus},
              "metadata" = "metadata" || CAST(${JSON.stringify(entryMetadata)} AS jsonb),
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE "planId" = ${plan.id}
            AND "status" = ${status}
          RETURNING "id"
        )
        SELECT COUNT(*)::int AS "count" FROM updated_entries
      `;
      affectedScheduleEntries += updatedRows[0]?.count ?? 0;
    }

    await tx.checkoutOrderTimelineEvent.create({
      data: {
        orderId: plan.orderId,
        type: `payment.installment.reversal.${operation}`,
        title: operation === 'refund' ? 'Installment refund requested' : 'Installment plan cancelled',
        note: operation === 'refund' ? 'Installment refund boundary was recorded.' : 'Installment cancellation boundary was recorded.',
        actorLabel,
        actorRole,
        metadata: {
          planId: plan.id,
          paymentAttemptId: plan.paymentAttemptId,
          operation,
          nextPlanStatus,
          affectedScheduleEntries,
          ...metadata
        }
      }
    });

    return {
      planId: plan.id,
      orderId: plan.orderId,
      orderNumber: plan.orderNumber,
      paymentAttemptId: plan.paymentAttemptId,
      operation,
      nextPlanStatus,
      affectedScheduleEntries,
      metadata
    };
  });
}
