import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  WEBHOOK_EVENT_LOG_STATUSES,
  buildWebhookEventLogSummary,
  createWebhookPayloadDigest,
  normalizeWebhookEventLogInput
} from '../../lib/settings/webhook-event-log';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runWebhookEventLogTests() {
  const migration = source('prisma/migrations/20260603090000_add_webhook_event_log/migration.sql');
  const service = source('lib/settings/webhook-event-log.ts');
  const panel = source('components/admin/AdminWebhookEventLogPanel.tsx');
  const fulfillmentPanel = source('components/admin/AdminFulfillmentSettingsPanel.tsx');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "WebhookEventLog"/);
  assert.match(migration, /"webhookConfigurationKey" TEXT NOT NULL/);
  assert.match(migration, /"eventName" TEXT NOT NULL/);
  assert.match(migration, /"payloadDigest" TEXT NOT NULL/);
  assert.match(migration, /"status" TEXT NOT NULL DEFAULT 'queued'/);
  assert.match(migration, /"attemptCount" INTEGER NOT NULL DEFAULT 0/);
  assert.match(migration, /WebhookEventLog_payloadDigest_key/);
  assert.match(migration, /WebhookEventLog_nextAttemptAt_idx/);

  assert.deepEqual(WEBHOOK_EVENT_LOG_STATUSES, ['queued', 'delivering', 'delivered', 'failed', 'retry_scheduled', 'abandoned']);
  assert.match(service, /export type WebhookEventLogRecord/);
  assert.match(service, /createWebhookPayloadDigest/);
  assert.match(service, /normalizeWebhookEventLogInput/);
  assert.match(service, /buildWebhookEventLogSummary/);
  assert.match(service, /webhookEventLogService = \{/);
  assert.match(service, /FROM "WebhookEventLog"/);
  assert.match(service, /INSERT INTO "WebhookEventLog"/);
  assert.match(service, /action: 'settings\.webhook_event_log\.record'/);

  const digestA = createWebhookPayloadDigest({ b: 2, a: 1 });
  const digestB = createWebhookPayloadDigest({ a: 1, b: 2 });
  assert.equal(digestA, digestB);
  assert.equal(digestA.length, 64);

  const normalized = normalizeWebhookEventLogInput({
    webhookConfigurationKey: ' Owner Webhook! ',
    eventName: ' Order.Created ',
    targetUrl: 'https://example.com/webhooks/golara#payload',
    payload: { orderId: 'ord_123', total: 4200 },
    status: 'Retry Scheduled',
    attemptCount: 2.9,
    lastStatusCode: 503,
    lastError: '  Service unavailable  ',
    nextAttemptAt: '2026-06-03T10:00:00.000Z',
    metadata: { source: 'unit' }
  });

  assert.equal(normalized.webhookConfigurationKey, 'owner-webhook');
  assert.equal(normalized.eventName, 'order.created');
  assert.equal(normalized.targetUrl, 'https://example.com/webhooks/golara');
  assert.equal(normalized.status, 'retry_scheduled');
  assert.equal(normalized.attemptCount, 2);
  assert.equal(normalized.lastStatusCode, 503);
  assert.equal(normalized.lastError, 'Service unavailable');
  assert.equal(normalized.nextAttemptAt?.toISOString(), '2026-06-03T10:00:00.000Z');

  const fallback = normalizeWebhookEventLogInput({
    eventName: 'bad',
    targetUrl: 'ftp://example.com/file',
    payload: { ok: true },
    status: 'unknown',
    attemptCount: -3,
    lastStatusCode: 900
  });
  assert.equal(fallback.eventName, 'order.created');
  assert.equal(fallback.status, 'queued');
  assert.equal(fallback.attemptCount, 0);
  assert.equal(fallback.lastStatusCode, null);

  const summary = buildWebhookEventLogSummary([
    { ...fallback, id: '1', status: 'queued' },
    { ...fallback, id: '2', status: 'delivered' },
    { ...fallback, id: '3', status: 'failed' },
    { ...fallback, id: '4', status: 'retry_scheduled' },
    { ...fallback, id: '5', status: 'abandoned' }
  ]);
  assert.equal(summary.total, 5);
  assert.equal(summary.queued, 1);
  assert.equal(summary.delivered, 1);
  assert.equal(summary.failed, 1);
  assert.equal(summary.retryScheduled, 1);
  assert.equal(summary.abandoned, 1);
  assert.equal(summary.needsAttention, 3);
  assert.equal(summary.recent.length, 5);

  assert.match(panel, /export function AdminWebhookEventLogPanel/);
  assert.match(panel, /Webhook event log/);
  assert.match(panel, /payload digests and delivery metadata/);
  assert.match(panel, /No webhook event logs yet/);
  assert.match(panel, /StatusBadge/);

  assert.match(fulfillmentPanel, /webhookEventLogService\.summary\(10\)/);
  assert.match(fulfillmentPanel, /AdminWebhookEventLogPanel/);

  assert.match(roadmap, /- \[x\] Add event log for outgoing webhooks\./);

  console.log('webhook-event-log.test.ts passed');
}
