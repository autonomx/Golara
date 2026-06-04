import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';
import {
  planPaymentSettlementReconciliation,
  summarizePaymentSettlementPlans,
  type PaymentSettlementPlan
} from './payment-settlement-reconciliation';

type PaymentSettlementEventRow = {
  id: string;
  provider: string;
  idempotencyKey: string;
  status: string | null;
  metadata: unknown;
  createdAt: Date;
  paymentAttempt: {
    providerReference: string | null;
    amountCents: number;
    currency: string;
    order: {
      orderNumber: string;
      totalCents: number;
      currency: string;
    };
  };
};

export type PaymentSettlementSummary = ReturnType<typeof summarizePaymentSettlementPlans> & {
  recent: PaymentSettlementPlan[];
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

export function buildPaymentSettlementPlanFromEvent(row: PaymentSettlementEventRow): PaymentSettlementPlan {
  const metadata = metadataRecord(row.metadata);
  return planPaymentSettlementReconciliation({
    provider: row.provider,
    providerReference: metadataText(metadata, 'providerReference') || row.paymentAttempt.providerReference,
    webhookStatus: row.status,
    orderNumber: metadataText(metadata, 'orderNumber') || row.paymentAttempt.order.orderNumber,
    orderTotalCents: row.paymentAttempt.order.totalCents || row.paymentAttempt.amountCents,
    orderCurrency: row.paymentAttempt.order.currency || row.paymentAttempt.currency,
    webhookAmountCents: metadataNumber(metadata, 'amountCents'),
    webhookCurrency: metadataText(metadata, 'currency'),
    eventId: row.id,
    idempotencyKey: row.idempotencyKey
  });
}

export async function paymentSettlementSummaryService(limit = 25): Promise<PaymentSettlementSummary> {
  if (!hasDatabase()) {
    return {
      ...summarizePaymentSettlementPlans([]),
      recent: []
    };
  }

  const rows = await prisma.checkoutPaymentEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: Math.max(1, Math.min(limit, 100)),
    include: {
      paymentAttempt: {
        include: {
          order: true
        }
      }
    }
  });
  const recent = rows.map((row) => buildPaymentSettlementPlanFromEvent(row));
  return {
    ...summarizePaymentSettlementPlans(recent),
    recent
  };
}

export const paymentSettlementService = {
  summary: paymentSettlementSummaryService
};
