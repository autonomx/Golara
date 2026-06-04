import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  normalizePaymentWebhookEvent,
  normalizeStripeWebhookStatus,
  normalizeZarinpalWebhookStatus,
  paymentWebhookIdempotencyKey,
  summarizePaymentWebhookSettlement
} from '../../lib/checkout/payment-webhook-core';
import {
  buildPaymentWebhookEventPersistenceInput,
  buildPaymentWebhookRecordSummary,
  planPaymentWebhookRecord
} from '../../lib/checkout/payment-webhook-record';
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
  const schema = source('prisma/schema.prisma');
  const migration = source('prisma/migrations/20260603090000_add_webhook_event_log/migration.sql');
  const service = source('lib/settings/webhook-event-log.ts');
  const paymentWebhookCore = source('lib/checkout/payment-webhook-core.ts');
  const paymentWebhookRecord = source('lib/checkout/payment-webhook-record.ts');
  const panel = source('components/admin/AdminWebhookEventLogPanel.tsx');
  const fulfillmentPanel = source('components/admin/AdminFulfillmentSettingsPanel.tsx');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  assert.match(schema, /model CheckoutPaymentEvent/);
  assert.match(schema, /paymentAttemptId String/);
  assert.match(schema, /provider         String/);
  assert.match(schema, /eventType        String/);
  assert.match(schema, /idempotencyKey   String/);
  assert.match(schema, /@@unique\(\[provider, idempotencyKey\]\)/);

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

  assert.match(paymentWebhookCore, /export function normalizePaymentWebhookEvent/);
  assert.match(paymentWebhookCore, /export function paymentWebhookIdempotencyKey/);
  assert.match(paymentWebhookCore, /export function summarizePaymentWebhookSettlement/);
  assert.match(paymentWebhookRecord, /export function planPaymentWebhookRecord/);
  assert.match(paymentWebhookRecord, /export function buildPaymentWebhookEventPersistenceInput/);
  assert.match(paymentWebhookRecord, /export function buildPaymentWebhookRecordSummary/);

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

  assert.equal(normalizeStripeWebhookStatus('checkout.session.completed', 'paid'), 'paid');
  assert.equal(normalizeStripeWebhookStatus('checkout.session.expired'), 'cancelled');
  assert.equal(normalizeStripeWebhookStatus('payment_intent.payment_failed'), 'failed');
  assert.equal(normalizeZarinpalWebhookStatus('OK'), 'paid');
  assert.equal(normalizeZarinpalWebhookStatus('NOK'), 'failed');
  assert.equal(normalizeZarinpalWebhookStatus('cancelled'), 'cancelled');

  const stripePaid = normalizePaymentWebhookEvent({
    provider: 'stripe',
    eventType: 'checkout.session.completed',
    receivedAt: '2026-06-04T08:00:00.000Z',
    payload: {
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_paid_123',
          payment_status: 'paid',
          amount_total: 420000,
          currency: 'USD',
          metadata: {
            orderNumber: 'GOL-2001',
            publicLookupToken: 'public-token-stripe'
          }
        }
      }
    }
  });
  assert.equal(stripePaid.provider, 'stripe');
  assert.equal(stripePaid.eventName, 'checkout.session.completed');
  assert.equal(stripePaid.status, 'paid');
  assert.equal(stripePaid.providerReference, 'cs_test_paid_123');
  assert.equal(stripePaid.orderNumber, 'GOL-2001');
  assert.equal(stripePaid.publicLookupToken, 'public-token-stripe');
  assert.equal(stripePaid.amountCents, 420000);
  assert.equal(stripePaid.currency, 'usd');
  assert.equal(stripePaid.payloadDigest.length, 64);
  assert.equal(stripePaid.idempotencyKey, paymentWebhookIdempotencyKey(stripePaid));

  const stripeExpired = normalizePaymentWebhookEvent({
    provider: 'stripe',
    eventType: 'checkout.session.expired',
    payload: {
      data: {
        object: {
          id: 'cs_test_expired_123',
          metadata: { order_number: 'GOL-2002' }
        }
      }
    }
  });
  assert.equal(stripeExpired.status, 'cancelled');
  assert.equal(stripeExpired.orderNumber, 'GOL-2002');

  const zarinpalPaid = normalizePaymentWebhookEvent({
    provider: 'zarin-pal',
    eventType: 'zarinpal.verify',
    receivedAt: '2026-06-04T09:00:00.000Z',
    payload: {
      Status: 'OK',
      Authority: 'A0001',
      RefID: '123456',
      order: 'GOL-3001',
      token: 'public-token-zarinpal',
      amount: '850000',
      currency: 'IRT'
    }
  });
  assert.equal(zarinpalPaid.provider, 'zarinpal');
  assert.equal(zarinpalPaid.status, 'paid');
  assert.equal(zarinpalPaid.providerReference, '123456');
  assert.equal(zarinpalPaid.orderNumber, 'GOL-3001');
  assert.equal(zarinpalPaid.publicLookupToken, 'public-token-zarinpal');
  assert.equal(zarinpalPaid.amountCents, 850000);
  assert.equal(zarinpalPaid.currency, 'irt');

  const settlement = summarizePaymentWebhookSettlement([
    stripePaid,
    stripeExpired,
    zarinpalPaid,
    normalizePaymentWebhookEvent({ provider: 'zarinpal', payload: { Status: 'NOK', Authority: 'A0002' } }),
    normalizePaymentWebhookEvent({ provider: 'unknown', payload: { id: 'evt_unknown' } })
  ]);
  assert.deepEqual(settlement, {
    total: 5,
    paid: 2,
    failed: 1,
    cancelled: 1,
    pending: 1,
    needsAttention: 2
  });

  const paidRecord = planPaymentWebhookRecord({ event: stripePaid });
  assert.equal(paidRecord.persistenceStatus, 'recorded');
  assert.equal(paidRecord.shouldApplyPaymentState, true);
  assert.equal(paidRecord.shouldReconcileSettlement, true);
  assert.equal(paidRecord.needsAttention, false);
  assert.equal(paidRecord.metadata.hasProviderReference, true);
  assert.equal(paidRecord.metadata.hasOrderReference, true);

  const persistenceInput = buildPaymentWebhookEventPersistenceInput({
    paymentAttemptId: ' attempt-123 ',
    event: stripePaid,
    plan: paidRecord,
    processedAt: new Date('2026-06-04T08:05:00.000Z')
  });
  assert.equal(persistenceInput.paymentAttemptId, 'attempt-123');
  assert.equal(persistenceInput.provider, 'stripe');
  assert.equal(persistenceInput.eventType, 'checkout.session.completed');
  assert.equal(persistenceInput.idempotencyKey, stripePaid.idempotencyKey);
  assert.equal(persistenceInput.status, 'paid');
  assert.equal(persistenceInput.processedAt?.toISOString(), '2026-06-04T08:05:00.000Z');
  assert.equal(persistenceInput.metadata.providerReference, 'cs_test_paid_123');
  assert.equal(persistenceInput.metadata.orderNumber, 'GOL-2001');
  assert.equal(persistenceInput.metadata.publicLookupToken, 'public-token-stripe');
  assert.equal(persistenceInput.metadata.amountCents, 420000);
  assert.equal(persistenceInput.metadata.currency, 'usd');
  assert.equal(persistenceInput.metadata.persistenceStatus, 'recorded');
  assert.equal(persistenceInput.metadata.shouldApplyPaymentState, true);
  assert.throws(() => buildPaymentWebhookEventPersistenceInput({ paymentAttemptId: ' ', event: stripePaid }), /paymentAttemptId is required/);

  const duplicateRecord = planPaymentWebhookRecord({
    event: stripePaid,
    existingIdempotencyKey: stripePaid.idempotencyKey
  });
  assert.equal(duplicateRecord.persistenceStatus, 'duplicate');
  assert.equal(duplicateRecord.shouldApplyPaymentState, false);
  assert.equal(duplicateRecord.shouldReconcileSettlement, false);
  assert.equal(duplicateRecord.metadata.duplicate, true);

  const failedRecord = planPaymentWebhookRecord({
    event: normalizePaymentWebhookEvent({ provider: 'zarinpal', payload: { Status: 'NOK', Authority: 'A0002' } })
  });
  assert.equal(failedRecord.persistenceStatus, 'needs_attention');
  assert.equal(failedRecord.shouldApplyPaymentState, false);
  assert.equal(failedRecord.needsAttention, true);

  const recordSummary = buildPaymentWebhookRecordSummary([paidRecord, duplicateRecord, failedRecord]);
  assert.deepEqual(recordSummary, {
    total: 3,
    recorded: 1,
    duplicate: 1,
    needsAttention: 1,
    paymentStateApplications: 1,
    settlementCandidates: 1
  });

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
