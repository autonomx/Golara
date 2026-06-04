import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  planPaymentWebhookAlert,
  summarizePaymentWebhookAlerts
} from '../../lib/checkout/payment-webhook-alerts';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentWebhookAlertsTests() {
  const helper = source('lib/checkout/payment-webhook-alerts.ts');
  assert.match(helper, /export function planPaymentWebhookAlert/);
  assert.match(helper, /export function summarizePaymentWebhookAlerts/);
  assert.doesNotMatch(helper, /checkoutOrder\.update/);
  assert.doesNotMatch(helper, /checkoutPaymentAttempt\.update/);
  assert.doesNotMatch(helper, /checkoutPaymentEvent\.create/);

  const duplicate = planPaymentWebhookAlert({ provider: 'stripe', duplicate: true, paymentAttemptId: 'attempt-1' });
  assert.equal(duplicate.shouldAlert, false);
  assert.equal(duplicate.reason, 'none');

  const missing = planPaymentWebhookAlert({ provider: 'stripe', status: 'paid', providerReference: 'cs_test_1' });
  assert.equal(missing.shouldAlert, true);
  assert.equal(missing.severity, 'critical');
  assert.equal(missing.reason, 'missing_payment_attempt');
  assert.equal(missing.retryable, true);

  const mismatch = planPaymentWebhookAlert({
    provider: 'zarinpal',
    status: 'paid',
    paymentAttemptId: 'attempt-2',
    settlementStatus: 'amount_mismatch'
  });
  assert.equal(mismatch.shouldAlert, true);
  assert.equal(mismatch.severity, 'critical');
  assert.equal(mismatch.reason, 'settlement_mismatch');
  assert.equal(mismatch.retryable, false);

  const failed = planPaymentWebhookAlert({ provider: 'stripe', status: 'failed', paymentAttemptId: 'attempt-3' });
  assert.equal(failed.shouldAlert, true);
  assert.equal(failed.severity, 'warning');
  assert.equal(failed.reason, 'failed_webhook');
  assert.equal(failed.retryable, false);

  const pending = planPaymentWebhookAlert({ provider: 'stripe', status: 'pending', paymentAttemptId: 'attempt-4', ageMinutes: 5 });
  assert.equal(pending.shouldAlert, true);
  assert.equal(pending.reason, 'pending_webhook');
  assert.equal(pending.retryable, true);

  const stale = planPaymentWebhookAlert({ provider: 'stripe', status: 'pending', paymentAttemptId: 'attempt-5', ageMinutes: 45 });
  assert.equal(stale.shouldAlert, true);
  assert.equal(stale.reason, 'stale_pending_webhook');
  assert.equal(stale.retryable, true);

  const clean = planPaymentWebhookAlert({ provider: 'stripe', status: 'paid', paymentAttemptId: 'attempt-6', settlementStatus: 'settled' });
  assert.equal(clean.shouldAlert, false);
  assert.equal(clean.severity, 'none');
  assert.equal(clean.reason, 'none');

  assert.deepEqual(summarizePaymentWebhookAlerts([duplicate, missing, mismatch, failed, pending, stale, clean]), {
    total: 7,
    alerts: 5,
    warning: 3,
    critical: 2,
    retryable: 3
  });

  console.log('payment-webhook-alerts.test.ts passed');
}
