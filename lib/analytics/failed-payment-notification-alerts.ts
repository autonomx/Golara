import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';

type AlertKind = 'payment' | 'notification';
type AlertSeverity = 'failed' | 'retry_scheduled';

export type FailedPaymentAlertSourceRow = {
  id: string;
  orderId: string;
  orderNumber: string;
  provider: string;
  status: string;
  amountCents: number;
  currency: string;
  providerReference?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FailedNotificationAlertSourceRow = {
  id: string;
  orderId: string;
  orderNumber: string;
  channel: string;
  templateKey: string;
  recipient: string;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt: Date | null;
  failedAt: Date | null;
  errorCode: string | null;
  errorMessage: string | null;
  updatedAt: Date;
};

export type FailedPaymentNotificationAlert = {
  id: string;
  kind: AlertKind;
  severity: AlertSeverity;
  title: string;
  detail: string;
  orderId: string;
  orderNumber: string;
  status: string;
  occurredAt: Date;
};

export type FailedPaymentNotificationAlertsSummary = {
  alerts: FailedPaymentNotificationAlert[];
  failedPayments: number;
  failedNotifications: number;
  retryScheduledNotifications: number;
  totalAlerts: number;
  byKind: { kind: AlertKind; count: number }[];
  generatedAt: Date;
};

const PAYMENT_FAILURE_STATUSES = new Set(['failed', 'declined', 'cancelled', 'canceled', 'voided', 'refunded', 'error']);
const NOTIFICATION_FAILURE_STATUSES = new Set(['failed']);
const NOTIFICATION_RETRY_STATUSES = new Set(['retry_scheduled']);

export const EMPTY_FAILED_PAYMENT_NOTIFICATION_ALERTS_SUMMARY: FailedPaymentNotificationAlertsSummary = {
  alerts: [],
  failedPayments: 0,
  failedNotifications: 0,
  retryScheduledNotifications: 0,
  totalAlerts: 0,
  byKind: [],
  generatedAt: new Date(0)
};

function normalizeStatus(value?: string | null) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'unknown';
}

function normalizeCurrency(value?: string | null) {
  const normalized = value?.trim().toUpperCase().replace(/[^A-Z]/g, '');
  return normalized || 'CAD';
}

function normalizeCents(value?: number | null) {
  if (!Number.isFinite(value ?? NaN)) return 0;
  return Math.max(0, Math.trunc(value ?? 0));
}

function isMissingNotificationActionTableError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const meta = 'meta' in error ? (error as { meta?: { code?: string; message?: string } }).meta : undefined;
  const message = 'message' in error ? String((error as { message?: unknown }).message ?? '') : '';
  return meta?.code === '42P01' || meta?.message?.includes('CheckoutOrderNotificationAction') || message.includes('CheckoutOrderNotificationAction');
}

export function formatFailureAlertAmount(value: number, currency: string) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: normalizeCurrency(currency) }).format(normalizeCents(value) / 100);
}

export function isFailedPaymentStatus(status: string) {
  return PAYMENT_FAILURE_STATUSES.has(normalizeStatus(status));
}

export function isFailedNotificationStatus(status: string) {
  return NOTIFICATION_FAILURE_STATUSES.has(normalizeStatus(status));
}

export function isRetryScheduledNotificationStatus(status: string) {
  return NOTIFICATION_RETRY_STATUSES.has(normalizeStatus(status));
}

function severityRank(severity: AlertSeverity) {
  return severity === 'failed' ? 0 : 1;
}

export function buildFailedPaymentNotificationAlertsSummary(
  payments: FailedPaymentAlertSourceRow[],
  notifications: FailedNotificationAlertSourceRow[],
  now = new Date(),
  limit = 10
): FailedPaymentNotificationAlertsSummary {
  const alerts: FailedPaymentNotificationAlert[] = [];
  let failedPayments = 0;
  let failedNotifications = 0;
  let retryScheduledNotifications = 0;
  const byKind = new Map<AlertKind, number>();

  for (const payment of payments) {
    const status = normalizeStatus(payment.status);
    if (!isFailedPaymentStatus(status)) continue;
    failedPayments += 1;
    byKind.set('payment', (byKind.get('payment') ?? 0) + 1);
    alerts.push({
      id: `payment:${payment.id}`,
      kind: 'payment',
      severity: 'failed',
      title: `${payment.provider} payment ${status}`,
      detail: `${formatFailureAlertAmount(payment.amountCents, payment.currency)}${payment.providerReference ? ` / ${payment.providerReference}` : ''}`,
      orderId: payment.orderId,
      orderNumber: payment.orderNumber,
      status,
      occurredAt: payment.updatedAt ?? payment.createdAt
    });
  }

  for (const notification of notifications) {
    const status = normalizeStatus(notification.status);
    const failed = isFailedNotificationStatus(status);
    const retryScheduled = isRetryScheduledNotificationStatus(status);
    if (!failed && !retryScheduled) continue;
    if (failed) failedNotifications += 1;
    if (retryScheduled) retryScheduledNotifications += 1;
    byKind.set('notification', (byKind.get('notification') ?? 0) + 1);
    alerts.push({
      id: `notification:${notification.id}`,
      kind: 'notification',
      severity: failed ? 'failed' : 'retry_scheduled',
      title: `${notification.channel.toUpperCase()} notification ${status.replace('_', ' ')}`,
      detail: `${notification.templateKey} to ${notification.recipient} · attempt ${notification.attemptCount}/${notification.maxAttempts}${notification.errorCode ? ` · ${notification.errorCode}` : ''}${notification.errorMessage ? ` · ${notification.errorMessage}` : ''}`,
      orderId: notification.orderId,
      orderNumber: notification.orderNumber,
      status,
      occurredAt: notification.failedAt ?? notification.nextRetryAt ?? notification.updatedAt
    });
  }

  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));
  alerts.sort((a, b) => severityRank(a.severity) - severityRank(b.severity) || b.occurredAt.getTime() - a.occurredAt.getTime() || a.id.localeCompare(b.id));

  return {
    alerts: alerts.slice(0, safeLimit),
    failedPayments,
    failedNotifications,
    retryScheduledNotifications,
    totalAlerts: alerts.length,
    byKind: Array.from(byKind.entries())
      .map(([kind, count]) => ({ kind, count }))
      .sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind)),
    generatedAt: now
  };
}

async function listFailedNotificationRows() {
  try {
    return await prisma.$queryRaw<FailedNotificationAlertSourceRow[]>`
      SELECT
        n."id",
        n."orderId",
        o."orderNumber",
        n."channel",
        n."templateKey",
        n."recipient",
        n."status",
        n."attemptCount",
        n."maxAttempts",
        n."nextRetryAt",
        n."failedAt",
        n."errorCode",
        n."errorMessage",
        n."updatedAt"
      FROM "CheckoutOrderNotificationAction" n
      INNER JOIN "CheckoutOrder" o ON o."id" = n."orderId"
      WHERE n."status" IN ('failed', 'retry_scheduled')
      ORDER BY n."updatedAt" DESC
      LIMIT 50
    `;
  } catch (error) {
    if (isMissingNotificationActionTableError(error)) return [];
    throw error;
  }
}

export const failedPaymentNotificationAlertsService = {
  async summary(): Promise<FailedPaymentNotificationAlertsSummary> {
    if (!hasDatabase()) return { ...EMPTY_FAILED_PAYMENT_NOTIFICATION_ALERTS_SUMMARY, generatedAt: new Date() };

    const [payments, notifications] = await Promise.all([
      prisma.checkoutPaymentAttempt.findMany({
        where: { status: { in: Array.from(PAYMENT_FAILURE_STATUSES) } },
        orderBy: { updatedAt: 'desc' },
        take: 50,
        select: {
          id: true,
          orderId: true,
          provider: true,
          status: true,
          amountCents: true,
          currency: true,
          providerReference: true,
          createdAt: true,
          updatedAt: true,
          order: { select: { orderNumber: true } }
        }
      }),
      listFailedNotificationRows()
    ]);

    return buildFailedPaymentNotificationAlertsSummary(
      payments.map((payment) => ({ ...payment, orderNumber: payment.order.orderNumber })),
      notifications
    );
  }
};
