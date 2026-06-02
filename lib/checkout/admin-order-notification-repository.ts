import 'server-only';

import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { hasDatabase, prisma } from '@/lib/prisma';

export const ADMIN_ORDER_NOTIFICATION_CHANNELS = ['email', 'sms'] as const;
export const ADMIN_ORDER_NOTIFICATION_STATUSES = ['queued', 'delivered', 'failed', 'retry_scheduled', 'cancelled'] as const;

export type AdminOrderNotificationChannel = (typeof ADMIN_ORDER_NOTIFICATION_CHANNELS)[number];
export type AdminOrderNotificationStatus = (typeof ADMIN_ORDER_NOTIFICATION_STATUSES)[number];

export type AdminOrderNotificationInput = {
  channel: string;
  templateKey?: string;
  recipient: string;
  subject?: string;
  body: string;
  maxAttempts?: number;
  actorLabel?: string;
  actorRole?: string;
};

export type AdminOrderNotificationAttemptInput = {
  status: 'delivered' | 'failed';
  errorCode?: string;
  errorMessage?: string;
  retryDelayMinutes?: number;
  actorLabel?: string;
  actorRole?: string;
};

export type AdminOrderNotificationActionRecord = {
  id: string;
  orderId: string;
  channel: AdminOrderNotificationChannel;
  templateKey: string;
  recipient: string;
  subject: string | null;
  body: string;
  status: AdminOrderNotificationStatus;
  attemptCount: number;
  maxAttempts: number;
  lastAttemptAt: Date | null;
  nextRetryAt: Date | null;
  deliveredAt: Date | null;
  failedAt: Date | null;
  errorCode: string | null;
  errorMessage: string | null;
  actorLabel: string | null;
  actorRole: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function optionalText(value?: string | null) {
  const normalized = value?.trim();
  return normalized || null;
}

function positiveInteger(value: unknown, fallback: number) {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : fallback;
}

export function assertAdminOrderNotificationChannel(value: string): AdminOrderNotificationChannel {
  const normalized = optionalText(value)?.toLowerCase();
  if (ADMIN_ORDER_NOTIFICATION_CHANNELS.includes(normalized as AdminOrderNotificationChannel)) {
    return normalized as AdminOrderNotificationChannel;
  }
  throw new Error(`Unsupported order notification channel: ${value}`);
}

export function normalizeAdminOrderNotificationInput(input: AdminOrderNotificationInput) {
  const channel = assertAdminOrderNotificationChannel(input.channel);
  const recipient = optionalText(input.recipient);
  const body = optionalText(input.body);
  if (!recipient) throw new Error('Notification recipient is required.');
  if (!body) throw new Error('Notification body is required.');

  return {
    channel,
    recipient,
    body,
    templateKey: optionalText(input.templateKey) ?? 'manual_order_update',
    subject: optionalText(input.subject),
    maxAttempts: positiveInteger(input.maxAttempts, 3),
    actorLabel: optionalText(input.actorLabel) ?? 'Admin',
    actorRole: optionalText(input.actorRole) ?? 'staff'
  };
}

export function buildNextOrderNotificationRetryDate(now = new Date(), retryDelayMinutes = 15) {
  const safeMinutes = Math.max(1, Math.floor(retryDelayMinutes));
  return new Date(now.getTime() + safeMinutes * 60_000);
}

export async function listAdminOrderNotificationActions(orderId: string): Promise<AdminOrderNotificationActionRecord[]> {
  if (!hasDatabase()) return [];

  return prisma.$queryRaw<AdminOrderNotificationActionRecord[]>`
    SELECT
      "id",
      "orderId",
      "channel",
      "templateKey",
      "recipient",
      "subject",
      "body",
      "status",
      "attemptCount",
      "maxAttempts",
      "lastAttemptAt",
      "nextRetryAt",
      "deliveredAt",
      "failedAt",
      "errorCode",
      "errorMessage",
      "actorLabel",
      "actorRole",
      "createdAt",
      "updatedAt"
    FROM "CheckoutOrderNotificationAction"
    WHERE "orderId" = ${orderId}
    ORDER BY "createdAt" DESC
  `;
}

export async function queueAdminOrderNotificationAction(orderId: string, input: AdminOrderNotificationInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const order = await prisma.checkoutOrder.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true }
  });
  if (!order) throw new Error('Order not found.');

  const notification = normalizeAdminOrderNotificationInput(input);
  const id = randomUUID();
  const metadata = {
    channel: notification.channel,
    templateKey: notification.templateKey,
    recipientConfigured: Boolean(notification.recipient),
    actorLabel: notification.actorLabel,
    actorRole: notification.actorRole
  };

  const inserted = await prisma.$queryRaw<AdminOrderNotificationActionRecord[]>`
    INSERT INTO "CheckoutOrderNotificationAction" (
      "id",
      "orderId",
      "channel",
      "templateKey",
      "recipient",
      "subject",
      "body",
      "maxAttempts",
      "actorLabel",
      "actorRole",
      "metadata"
    ) VALUES (
      ${id},
      ${orderId},
      ${notification.channel},
      ${notification.templateKey},
      ${notification.recipient},
      ${notification.subject},
      ${notification.body},
      ${notification.maxAttempts},
      ${notification.actorLabel},
      ${notification.actorRole},
      ${JSON.stringify(metadata)}::jsonb
    )
    RETURNING
      "id",
      "orderId",
      "channel",
      "templateKey",
      "recipient",
      "subject",
      "body",
      "status",
      "attemptCount",
      "maxAttempts",
      "lastAttemptAt",
      "nextRetryAt",
      "deliveredAt",
      "failedAt",
      "errorCode",
      "errorMessage",
      "actorLabel",
      "actorRole",
      "createdAt",
      "updatedAt"
  `;

  await prisma.checkoutOrderTimelineEvent.create({
    data: {
      orderId,
      type: 'order_notification_queued',
      title: `Order ${notification.channel.toUpperCase()} notification queued`,
      note: notification.subject ?? notification.body,
      actorLabel: notification.actorLabel,
      actorRole: notification.actorRole,
      metadata: metadata as Prisma.InputJsonObject
    }
  });

  return { order, notification: inserted[0] };
}

export async function recordAdminOrderNotificationAttempt(notificationId: string, input: AdminOrderNotificationAttemptInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const existingRows = await prisma.$queryRaw<AdminOrderNotificationActionRecord[]>`
    SELECT
      "id",
      "orderId",
      "channel",
      "templateKey",
      "recipient",
      "subject",
      "body",
      "status",
      "attemptCount",
      "maxAttempts",
      "lastAttemptAt",
      "nextRetryAt",
      "deliveredAt",
      "failedAt",
      "errorCode",
      "errorMessage",
      "actorLabel",
      "actorRole",
      "createdAt",
      "updatedAt"
    FROM "CheckoutOrderNotificationAction"
    WHERE "id" = ${notificationId}
    LIMIT 1
  `;
  const existing = existingRows[0];
  if (!existing) throw new Error('Notification action not found.');

  const now = new Date();
  const nextAttemptCount = existing.attemptCount + 1;
  const retryAvailable = input.status === 'failed' && nextAttemptCount < existing.maxAttempts;
  const status: AdminOrderNotificationStatus = input.status === 'delivered' ? 'delivered' : retryAvailable ? 'retry_scheduled' : 'failed';
  const nextRetryAt = retryAvailable ? buildNextOrderNotificationRetryDate(now, input.retryDelayMinutes) : null;
  const deliveredAt = status === 'delivered' ? now : null;
  const failedAt = status === 'failed' ? now : null;
  const errorCode = optionalText(input.errorCode);
  const errorMessage = optionalText(input.errorMessage);
  const actorLabel = optionalText(input.actorLabel) ?? existing.actorLabel ?? 'Admin';
  const actorRole = optionalText(input.actorRole) ?? existing.actorRole ?? 'staff';

  const updatedRows = await prisma.$queryRaw<AdminOrderNotificationActionRecord[]>`
    UPDATE "CheckoutOrderNotificationAction"
    SET
      "status" = ${status},
      "attemptCount" = ${nextAttemptCount},
      "lastAttemptAt" = ${now},
      "nextRetryAt" = ${nextRetryAt},
      "deliveredAt" = ${deliveredAt},
      "failedAt" = ${failedAt},
      "errorCode" = ${errorCode},
      "errorMessage" = ${errorMessage},
      "updatedAt" = ${now}
    WHERE "id" = ${notificationId}
    RETURNING
      "id",
      "orderId",
      "channel",
      "templateKey",
      "recipient",
      "subject",
      "body",
      "status",
      "attemptCount",
      "maxAttempts",
      "lastAttemptAt",
      "nextRetryAt",
      "deliveredAt",
      "failedAt",
      "errorCode",
      "errorMessage",
      "actorLabel",
      "actorRole",
      "createdAt",
      "updatedAt"
  `;

  await prisma.checkoutOrderTimelineEvent.create({
    data: {
      orderId: existing.orderId,
      type: status === 'delivered' ? 'order_notification_delivered' : status === 'retry_scheduled' ? 'order_notification_retry_scheduled' : 'order_notification_failed',
      title: `Order ${existing.channel.toUpperCase()} notification ${status.replace('_', ' ')}`,
      note: errorMessage ?? undefined,
      actorLabel,
      actorRole,
      metadata: {
        notificationId,
        channel: existing.channel,
        attemptCount: nextAttemptCount,
        maxAttempts: existing.maxAttempts,
        nextRetryAt: nextRetryAt?.toISOString() ?? null,
        errorCode
      } as Prisma.InputJsonObject
    }
  });

  return updatedRows[0];
}
