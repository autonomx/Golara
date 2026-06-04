import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { buildPaymentWebhookAlertPlanFromEvent } from '../../lib/checkout/payment-webhook-alert-service';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentWebhookAlertServicePanelTests() {
  const service = source('lib/checkout/payment-webhook-alert-service.ts');
  const panel = source('components/admin/AdminPaymentWebhookAlertsPanel.tsx');
  const page = source('app/admin/payments/alerts/page.tsx');

  assert.match(service, /import 'server-only'/);
  assert.match(service, /export function buildPaymentWebhookAlertPlanFromEvent/);
  assert.match(service, /export async function paymentWebhookAlertSummaryService/);
  assert.match(service, /prisma\.checkoutPaymentEvent\.findMany/);
  assert.match(service, /planPaymentSettlementReconciliation/);
  assert.match(service, /planPaymentWebhookAlert/);
  assert.match(service, /paymentWebhookAlertService = \{/);
  assert.doesNotMatch(service, /checkoutOrder\.update/);
  assert.doesNotMatch(service, /checkoutPaymentAttempt\.update/);

  assert.match(panel, /export function AdminPaymentWebhookAlertsPanel/);
  assert.match(panel, /Webhook alerts/);
  assert.match(panel, /summary\.critical/);
  assert.match(panel, /summary\.warning/);
  assert.match(panel, /summary\.retryable/);
  assert.match(panel, /No payment webhook alerts are currently available/);

  assert.match(page, /export const dynamic = 'force-dynamic'/);
  assert.match(page, /isAdminAuthenticated/);
  assert.match(page, /paymentWebhookAlertService\.summary\(50\)/);
  assert.match(page, /AdminPaymentWebhookAlertsPanel/);
  assert.match(page, /Admin authentication is required to view webhook alerts/);

  const plan = buildPaymentWebhookAlertPlanFromEvent({
    id: 'event-1',
    provider: 'stripe',
    status: 'paid',
    metadata: {
      providerReference: 'cs_test_123',
      orderNumber: 'GOL-1001',
      amountCents: 420000,
      currency: 'usd'
    },
    createdAt: new Date('2026-06-04T10:00:00.000Z'),
    paymentAttempt: {
      id: 'attempt-1',
      providerReference: 'cs_test_123',
      amountCents: 420000,
      currency: 'USD',
      order: {
        orderNumber: 'GOL-1001',
        totalCents: 420000,
        currency: 'USD'
      }
    }
  }, new Date('2026-06-04T10:05:00.000Z'));
  assert.equal(plan.shouldAlert, false);
  assert.equal(plan.severity, 'none');

  const stalePending = buildPaymentWebhookAlertPlanFromEvent({
    id: 'event-2',
    provider: 'stripe',
    status: 'pending',
    metadata: { providerReference: 'cs_test_pending', orderNumber: 'GOL-1002' },
    createdAt: new Date('2026-06-04T10:00:00.000Z'),
    paymentAttempt: {
      id: 'attempt-2',
      providerReference: 'cs_test_pending',
      amountCents: 420000,
      currency: 'USD',
      order: {
        orderNumber: 'GOL-1002',
        totalCents: 420000,
        currency: 'USD'
      }
    }
  }, new Date('2026-06-04T10:45:00.000Z'));
  assert.equal(stalePending.shouldAlert, true);
  assert.equal(stalePending.reason, 'stale_pending_webhook');
  assert.equal(stalePending.retryable, true);

  console.log('payment-webhook-alert-service-panel.test.ts passed');
}
