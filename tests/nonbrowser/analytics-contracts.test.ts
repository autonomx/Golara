import assert from 'node:assert/strict';
import { buildFailedPaymentNotificationAlertsSummary } from '../../lib/analytics/failed-payment-notification-alerts';
import { buildLaunchReadinessHealthSummary } from '../../lib/analytics/launch-readiness-health';
import { buildLowStockAlertsSummary } from '../../lib/analytics/low-stock-alerts';

export async function runAnalyticsContractTests() {
  const failedSummary = buildFailedPaymentNotificationAlertsSummary([
    { id: 'p1', orderId: 'o1', orderNumber: '1001', provider: 'manual', status: 'failed', amountCents: 1000, currency: 'CAD', providerReference: null, createdAt: new Date('2026-06-01T00:00:00Z'), updatedAt: new Date('2026-06-01T00:00:00Z') }
  ], [
    { id: 'n1', orderId: 'o1', orderNumber: '1001', channel: 'email', templateKey: 'order', recipient: 'test@example.com', status: 'retry_scheduled', attemptCount: 1, maxAttempts: 3, nextRetryAt: new Date('2026-06-01T01:00:00Z'), failedAt: null, errorCode: null, errorMessage: null, updatedAt: new Date('2026-06-01T00:00:00Z') }
  ], new Date('2026-06-01T00:00:00Z'));
  assert.equal(failedSummary.totalAlerts, 2);
  assert.equal(failedSummary.failedPayments, 1);
  assert.equal(failedSummary.retryScheduledNotifications, 1);

  const launchSummary = buildLaunchReadinessHealthSummary({
    runtimeReadiness: {
      appMode: 'production',
      nodeEnv: 'production',
      vercelEnv: 'production',
      databaseUrlPresent: true,
      seedFallbackAllowed: false,
      productionSafe: true,
      mediaStorage: { provider: 'cloudinary', configured: true, productionSafe: true, summary: 'ready', detail: 'ready' }
    },
    authConfigured: true,
    notificationReadiness: { mode: 'webhook', ready: true, blockers: [], warnings: [] },
    checkoutReadiness: { ready: true, mode: 'assisted', providers: ['manual'], blockers: [], warnings: [] }
  });
  assert.equal(launchSummary.cards.length, 6);
  assert.equal(launchSummary.launchBlocked, false);

  const lowStock = buildLowStockAlertsSummary([
    { id: 'v1', productTitle: 'A', variantName: 'Small', sku: 'A-S', stockQuantity: 2, lowStockThreshold: 5, trackInventory: true, isActive: true }
  ]);
  assert.equal(lowStock.totalAlerts, 1);
  assert.equal(lowStock.alerts[0]?.sku, 'A-S');

  console.log('analytics-contracts.test.ts passed');
}
