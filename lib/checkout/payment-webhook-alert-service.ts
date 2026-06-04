import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';
import { planPaymentSettlementReconciliation } from './payment-settlement-reconciliation';
import {
  planPaymentWebhookAlert,
  summarizePaymentWebhookAlerts,
  type PaymentWebhookAlertPlan
} from './payment-webhook-alerts';

type PaymentWebhookAlertEventRow = {
  id: string;
  provider: string;
  status: string | null;
  metadata: unknown;
  createdAt: Date;
  paymentAttempt: {
    id: string;
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

export type PaymentWebhookAlertSummary = ReturnType<typeof summarizePaymentWebhookAlerts> & {
  recent: PaymentWebhookAlertPlan[];
};

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function metadataText(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function metadataBoolean(metadata: Record<string, unknown>, key: string) {
  return metadata[key] === true;
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

function eventAgeMinutes(createdAt: Date, now = new Date()) {
  return Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / 60000));
}

export function buildPaymentWebhookAlertPlanFromEvent(row: PaymentWebhookAlertEventRow, now = new Date()): PaymentWebhookAlertPlan {
  const metadata = metadataRecord(row.metadata);
  const settlement = planPaymentSettlementReconciliation({
    provider: row.provider,
    providerReference: metadataText(metadata, 'providerReference') || row.paymentAttempt.providerReference,
    webhookStatus: row.status,
    orderNumber: metadataText(metadata, 'orderNumber') || row.paymentAttempt.order.orderNumber,
    orderTotalCents: row.paymentAttempt.order.totalCents || row.paymentAttempt.amountCents,
    orderCurrency: row.paymentAttempt.order.currency || row.paymentAttempt.currency,
    webhookAmountCents: metadataNumber(metadata, 'amountCents'),
    webhookCurrency: metadataText(metadata, 'currency'),
    eventId: row.id,
    idempotencyKey: metadataText(metadata, 'idempotencyKey')
  });

  return planPaymentWebhookAlert({
    provider: row.provider,
    status: row.status,
    providerReference: settlement.providerReference,
    orderNumber: settlement.orderNumber,
    paymentAttemptId: row.paymentAttempt.id,
    eventId: row.id,
    ageMinutes: eventAgeMinutes(row.createdAt, now),
    duplicate: metadataBoolean(metadata, 'duplicate'),
    missingPaymentAttempt: metadataBoolean(metadata, 'missingPaymentAttempt'),
    settlementStatus: settlement.status
  });
}

export async function paymentWebhookAlertSummaryService(limit = 25): Promise<PaymentWebhookAlertSummary> {
  if (!hasDatabase()) return { ...summarizePaymentWebhookAlerts([]), recent: [] };

  const rows = await prisma.checkoutPaymentEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: Math.max(1, Math.min(limit, 100)),
    include: {
      paymentAttempt: {
        include: { order: true }
      }
    }
  });
  const recent = rows.map((row) => buildPaymentWebhookAlertPlanFromEvent(row));
  return { ...summarizePaymentWebhookAlerts(recent), recent };
}

export const paymentWebhookAlertService = {
  summary: paymentWebhookAlertSummaryService
};
