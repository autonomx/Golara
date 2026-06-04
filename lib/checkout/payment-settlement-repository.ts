import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';
import { planPaymentSettlementReconciliation, type PaymentSettlementPlan } from './payment-settlement-reconciliation';

type SettlementSourceRow = {
  paymentEventId: string;
  paymentAttemptId: string;
  orderId: string;
  provider: string;
  providerReference: string | null;
  orderNumber: string | null;
  eventStatus: string | null;
  orderTotalCents: number | null;
  orderCurrency: string | null;
  attemptAmountCents: number | null;
  attemptCurrency: string | null;
  eventMetadata: unknown;
  idempotencyKey: string | null;
};

export type PaymentSettlementReconciliationRecord = PaymentSettlementPlan & {
  id: string;
  paymentEventId: string;
  paymentAttemptId: string;
  orderId: string;
  createdAt: Date;
  updatedAt: Date;
};

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function metadataText(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function metadataNumber(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function buildSettlementPlanFromSource(row: SettlementSourceRow): PaymentSettlementPlan {
  const metadata = metadataRecord(row.eventMetadata);
  return planPaymentSettlementReconciliation({
    provider: row.provider,
    providerReference: metadataText(metadata, 'providerReference') || row.providerReference,
    webhookStatus: row.eventStatus,
    orderNumber: metadataText(metadata, 'orderNumber') || row.orderNumber,
    orderTotalCents: row.orderTotalCents ?? row.attemptAmountCents,
    orderCurrency: row.orderCurrency ?? row.attemptCurrency,
    webhookAmountCents: metadataNumber(metadata, 'amountCents'),
    webhookCurrency: metadataText(metadata, 'currency'),
    eventId: row.paymentEventId,
    idempotencyKey: row.idempotencyKey
  });
}

export async function upsertPaymentSettlementReconciliation(paymentEventId: string) {
  if (!hasDatabase()) return null;
  const rows = await prisma.$queryRaw<SettlementSourceRow[]>`
    SELECT
      e."id" AS "paymentEventId",
      e."paymentAttemptId" AS "paymentAttemptId",
      a."orderId" AS "orderId",
      e."provider" AS "provider",
      a."providerReference" AS "providerReference",
      o."orderNumber" AS "orderNumber",
      e."status" AS "eventStatus",
      o."totalCents" AS "orderTotalCents",
      o."currency" AS "orderCurrency",
      a."amountCents" AS "attemptAmountCents",
      a."currency" AS "attemptCurrency",
      e."metadata" AS "eventMetadata",
      e."idempotencyKey" AS "idempotencyKey"
    FROM "CheckoutPaymentEvent" e
    INNER JOIN "CheckoutPaymentAttempt" a ON a."id" = e."paymentAttemptId"
    INNER JOIN "CheckoutOrder" o ON o."id" = a."orderId"
    WHERE e."id" = ${paymentEventId}
    LIMIT 1
  `;
  const source = rows[0];
  if (!source) return null;
  const plan = buildSettlementPlanFromSource(source);
  const inserted = await prisma.$queryRaw<PaymentSettlementReconciliationRecord[]>`
    INSERT INTO "PaymentSettlementReconciliation" (
      "paymentEventId", "paymentAttemptId", "orderId", "provider", "providerReference", "orderNumber", "status",
      "expectedAmountCents", "actualAmountCents", "expectedCurrency", "actualCurrency", "needsAttention", "metadata", "updatedAt"
    ) VALUES (
      ${source.paymentEventId}, ${source.paymentAttemptId}, ${source.orderId}, ${plan.provider}, ${plan.providerReference ?? null}, ${plan.orderNumber ?? null}, ${plan.status},
      ${plan.expectedAmountCents ?? null}, ${plan.actualAmountCents ?? null}, ${plan.expectedCurrency ?? null}, ${plan.actualCurrency ?? null}, ${plan.needsAttention}, ${plan.metadata}, CURRENT_TIMESTAMP
    )
    ON CONFLICT ("paymentEventId") DO UPDATE SET
      "status" = EXCLUDED."status",
      "providerReference" = EXCLUDED."providerReference",
      "orderNumber" = EXCLUDED."orderNumber",
      "expectedAmountCents" = EXCLUDED."expectedAmountCents",
      "actualAmountCents" = EXCLUDED."actualAmountCents",
      "expectedCurrency" = EXCLUDED."expectedCurrency",
      "actualCurrency" = EXCLUDED."actualCurrency",
      "needsAttention" = EXCLUDED."needsAttention",
      "metadata" = EXCLUDED."metadata",
      "updatedAt" = CURRENT_TIMESTAMP
    RETURNING *
  `;
  return inserted[0] ?? null;
}

export async function listPaymentSettlementReconciliations(limit = 25) {
  if (!hasDatabase()) return [];
  return prisma.$queryRaw<PaymentSettlementReconciliationRecord[]>`
    SELECT * FROM "PaymentSettlementReconciliation"
    ORDER BY "createdAt" DESC
    LIMIT ${Math.max(1, Math.min(limit, 100))}
  `;
}

export const paymentSettlementRepository = {
  upsertForPaymentEvent: upsertPaymentSettlementReconciliation,
  list: listPaymentSettlementReconciliations
};
