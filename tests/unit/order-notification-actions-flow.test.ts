import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runOrderNotificationActionsFlowTests() {
  const migration = source('prisma/migrations/20260602120000_add_order_notification_actions/migration.sql');
  const repository = source('lib/checkout/admin-order-notification-repository.ts');
  const actions = source('app/admin/order-actions.ts');

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
