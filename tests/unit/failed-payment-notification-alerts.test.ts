import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildFailedPaymentNotificationAlertsSummary,
  formatFailureAlertAmount,
  isFailedNotificationStatus,
  isFailedPaymentStatus,
  isRetryScheduledNotificationStatus
} from '../../lib/analytics/failed-payment-notification-alerts';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runFailedPaymentNotificationAlertsTests() {
  const service = source('lib/analytics/failed-payment-notification-alerts.ts');
  const panel = source('components/admin/AdminFailedPaymentNotificationAlertsPanel.tsx');
  const orderPanel = source('components/admin/AdminOrderRevenueSummaryPanel.tsx');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  assert.equal(isFailedPaymentStatus('declined'), true);
  assert.equal(isFailedPaymentStatus('paid'), false);
  assert.equal(isFailedNotificationStatus('failed'), true);
  assert.equal(isFailedNotificationStatus('retry_scheduled'), false);
  assert.equal(isRetryScheduledNotificationStatus('retry scheduled'), true);
  assert.equal(formatFailureAlertAmount(12345, 'CAD'), '$123.45');

  const now = new Date('2026-06-02T12:00:00Z');
  const summary = buildFailedPaymentNotificationAlertsSummary([
    { id: 'pay-1', orderId: 'order-1', orderNumber: 'G-100', provider: 'manual', status: 'failed', amountCents: 12000, currency: 'CAD', providerReference: 'REF-1', createdAt: new Date('2026-06-01T08:00:00Z'), updatedAt: new Date('2026-06-01T09:00:00Z') },
    { id: 'pay-2', orderId: 'order-2', orderNumber: 'G-101', provider: 'stripe', status: 'paid', amountCents: 9000, currency: 'CAD', createdAt: new Date('2026-06-01T08:00:00Z'), updatedAt: new Date('2026-06-01T09:00:00Z') }
  ], [
    { id: 'notif-1', orderId: 'order-3', orderNumber: 'G-102', channel: 'email', templateKey: 'order_update', recipient: 'a@example.com', status: 'retry_scheduled', attemptCount: 1, maxAttempts: 3, nextRetryAt: new Date('2026-06-02T13:00:00Z'), failedAt: null, errorCode: 'TEMP_RETRY', errorMessage: 'Temporary issue', updatedAt: new Date('2026-06-02T12:30:00Z') },
    { id: 'notif-2', orderId: 'order-4', orderNumber: 'G-103', channel: 'sms', templateKey: 'delivery_update', recipient: '+15550100', status: 'failed', attemptCount: 3, maxAttempts: 3, nextRetryAt: null, failedAt: new Date('2026-06-02T11:00:00Z'), errorCode: 'FINAL_FAIL', errorMessage: 'Final issue', updatedAt: new Date('2026-06-02T11:00:00Z') },
    { id: 'notif-3', orderId: 'order-5', orderNumber: 'G-104', channel: 'email', templateKey: 'delivered', recipient: 'b@example.com', status: 'delivered', attemptCount: 1, maxAttempts: 3, nextRetryAt: null, failedAt: null, errorCode: null, errorMessage: null, updatedAt: new Date('2026-06-02T10:00:00Z') }
  ], now);

  assert.equal(summary.failedPayments, 1);
  assert.equal(summary.failedNotifications, 1);
  assert.equal(summary.retryScheduledNotifications, 1);
  assert.equal(summary.totalAlerts, 3);
  assert.equal(summary.alerts[0].severity, 'failed');
  assert.equal(summary.alerts[0].kind, 'notification');
  assert.equal(summary.alerts.find((row) => row.id === 'payment:pay-1')?.detail, '$120.00 / REF-1');
  assert.equal(summary.byKind.find((row) => row.kind === 'notification')?.count, 2);

  assert.match(service, /export type FailedPaymentNotificationAlertsSummary/);
  assert.match(service, /buildFailedPaymentNotificationAlertsSummary/);
  assert.match(service, /failedPaymentNotificationAlertsService = \{/);
  assert.match(service, /prisma\.checkoutPaymentAttempt\.findMany/);
  assert.match(service, /CheckoutOrderNotificationAction/);
  assert.match(service, /retry_scheduled/);

  assert.match(panel, /export function AdminFailedPaymentNotificationAlertsPanel/);
  assert.match(panel, /Failed payment and notification alerts/);
  assert.match(panel, /Failed payments/);
  assert.match(panel, /No failed payment attempts or failed\/retry-scheduled notifications/);

  assert.match(orderPanel, /AdminFailedPaymentNotificationAlertsPanel/);
  assert.match(orderPanel, /failedPaymentNotificationAlertsService\.summary\(\)/);
  assert.match(orderPanel, /AdminFailedPaymentNotificationAlertsPanel summary=\{failedPaymentNotificationAlertsSummary\}/);

  assert.match(roadmap, /- \[x\] Add failed payment\/notification alerts\./);

  console.log('failed-payment-notification-alerts.test.ts passed');
}
