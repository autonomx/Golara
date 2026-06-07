import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  assertAdminOrderNotificationChannel,
  buildNextOrderNotificationRetryDate,
  listAdminOrderNotificationActions,
  normalizeAdminOrderNotificationInput,
  queueAdminOrderNotificationAction,
  recordAdminOrderNotificationAttempt
} from '../../lib/checkout/admin-order-notification-repository';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runOrderNotificationActionsFlowTests() {
  const migration = source('prisma/migrations/20260602120000_add_order_notification_actions/migration.sql');
  const repository = source('lib/checkout/admin-order-notification-repository.ts');
  const actions = source('app/admin/order-actions.ts');

  assert.equal(assertAdminOrderNotificationChannel(' EMAIL '), 'email');
  assert.equal(assertAdminOrderNotificationChannel(' sms '), 'sms');
  assert.throws(() => assertAdminOrderNotificationChannel('push'), /Unsupported order notification channel: push/);

  assert.deepEqual(normalizeAdminOrderNotificationInput({
    channel: ' EMAIL ',
    templateKey: ' order_update ',
    recipient: ' customer@example.invalid ',
    subject: ' Order update ',
    body: ' Your order has been updated. ',
    maxAttempts: 0,
    actorLabel: ' Operator ',
    actorRole: ' Owner '
  }), {
    channel: 'email',
    recipient: 'customer@example.invalid',
    body: 'Your order has been updated.',
    templateKey: 'order_update',
    subject: 'Order update',
    maxAttempts: 1,
    actorLabel: 'Operator',
    actorRole: 'Owner'
  });

  assert.deepEqual(normalizeAdminOrderNotificationInput({
    channel: 'sms',
    recipient: '+15555550123',
    body: 'Ready for pickup',
    maxAttempts: '4' as unknown as number
  }), {
    channel: 'sms',
    recipient: '+15555550123',
    body: 'Ready for pickup',
    templateKey: 'manual_order_update',
    subject: null,
    maxAttempts: 4,
    actorLabel: 'Admin',
    actorRole: 'staff'
  });

  assert.throws(() => normalizeAdminOrderNotificationInput({
    channel: 'email',
    recipient: ' ',
    body: 'Body'
  }), /Notification recipient is required\./);
  assert.throws(() => normalizeAdminOrderNotificationInput({
    channel: 'email',
    recipient: 'customer@example.invalid',
    body: ' '
  }), /Notification body is required\./);

  const retryDate = buildNextOrderNotificationRetryDate(new Date('2026-06-06T12:00:00.000Z'), 0);
  assert.equal(retryDate.toISOString(), '2026-06-06T12:01:00.000Z');
  assert.equal(buildNextOrderNotificationRetryDate(new Date('2026-06-06T12:00:00.000Z'), 30.9).toISOString(), '2026-06-06T12:30:00.000Z');

  assert.deepEqual(await listAdminOrderNotificationActions('order_123'), []);
  await assert.rejects(() => queueAdminOrderNotificationAction('order_123', {
    channel: 'email',
    recipient: 'customer@example.invalid',
    body: 'Body'
  }), /(DATABASE_URL is not configured\.|Order not found\.)/);
  await assert.rejects(() => recordAdminOrderNotificationAttempt('notification_123', {
    status: 'failed',
    errorCode: 'provider_error',
    errorMessage: 'Provider unavailable',
    retryDelayMinutes: 5
  }), /(DATABASE_URL is not configured\.|Notification action not found\.)/);

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "CheckoutOrderNotificationAction"/);
  assert.match(migration, /"channel" TEXT NOT NULL/);
  assert.match(migration, /"status" TEXT NOT NULL DEFAULT 'queued'/);
  assert.match(migration, /"attemptCount" INTEGER NOT NULL DEFAULT 0/);
  assert.match(migration, /"maxAttempts" INTEGER NOT NULL DEFAULT 3/);
  assert.match(migration, /"nextRetryAt" TIMESTAMP\(3\)/);
  assert.match(migration, /"CheckoutOrderNotificationAction_orderId_fkey"/);
  assert.match(migration, /"CheckoutOrderNotificationAction_status_nextRetryAt_idx"/);
  assert.match(migration, /"CheckoutOrderNotificationAction_channel_status_idx"/);

  assert.match(repository, /ADMIN_ORDER_NOTIFICATION_CHANNELS = \['email', 'sms'\] as const/);
  assert.match(repository, /ADMIN_ORDER_NOTIFICATION_STATUSES = \['queued', 'delivered', 'failed', 'retry_scheduled', 'cancelled'\] as const/);
  assert.match(repository, /export function assertAdminOrderNotificationChannel/);
  assert.match(repository, /export function normalizeAdminOrderNotificationInput/);
  assert.match(repository, /export function buildNextOrderNotificationRetryDate/);
  assert.match(repository, /export async function listAdminOrderNotificationActions/);
  assert.match(repository, /export async function queueAdminOrderNotificationAction/);
  assert.match(repository, /export async function recordAdminOrderNotificationAttempt/);
  assert.match(repository, /INSERT INTO "CheckoutOrderNotificationAction"/);
  assert.match(repository, /UPDATE "CheckoutOrderNotificationAction"/);
  assert.match(repository, /type: 'order_notification_queued'/);
  assert.match(repository, /order_notification_retry_scheduled/);
  assert.match(repository, /nextAttemptCount < existing\.maxAttempts/);
  assert.match(repository, /status === 'delivered' \? 'delivered' : retryAvailable \? 'retry_scheduled' : 'failed'/);
  assert.match(repository, /buildNextOrderNotificationRetryDate\(now, input\.retryDelayMinutes\)/);
  assert.match(repository, /nextRetryAt:\ nextRetryAt\?\.toISOString\(\) \?\? null/);

  assert.match(actions, /queueOrderNotificationAction/);
  assert.match(actions, /recordOrderNotificationAttemptAction/);
  assert.match(actions, /queueAdminOrderNotificationAction\(orderId/);
  assert.match(actions, /recordAdminOrderNotificationAttempt\(notificationId/);
  assert.match(actions, /action: 'order.notification.queue'/);
  assert.match(actions, /action: status === 'delivered' \? 'order.notification.deliver' : 'order.notification.fail'/);
  assert.match(actions, /order-notification-queued/);
  assert.match(actions, /order-notification-delivered/);
  assert.match(actions, /order-notification-failed/);

  console.log('order-notification-actions-flow.test.ts passed');
}
