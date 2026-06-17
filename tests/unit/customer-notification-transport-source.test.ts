import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import {
  createQueuedCustomerNotificationTransportEvidence,
  customerNotificationTransportAttempt,
  customerNotificationTransportRetryPlan
} from '@/lib/notifications/customer-notification-transport';

const transportSource = readFileSync('lib/notifications/customer-notification-transport.ts', 'utf8');
const roadmapSource = readFileSync('docs/digikala-style-payment-remaining-phases.md', 'utf8');

for (const fragment of [
  'CustomerNotificationTransportPayload',
  'CustomerNotificationTransportAttemptInput',
  'CustomerNotificationTransportRetryPlan',
  'createQueuedCustomerNotificationTransportEvidence',
  'customerNotificationTransportAttempt',
  'customerNotificationTransportRetryPlan',
  'appendCustomerNotificationAttemptEvidence',
  'DEFAULT_RETRY_DELAY_MS',
  'notificationRetryable'
]) {
  assert.ok(transportSource.includes(fragment), `Expected notification transport source to include: ${fragment}`);
}

const queued = createQueuedCustomerNotificationTransportEvidence({
  templateKey: 'manual_transfer_instructions',
  channel: 'email',
  locale: 'en',
  recipient: 'customer@example.test',
  orderNumber: 'GOL-6001',
  paymentAttemptId: 'pay-6001',
  selectedPaymentMethodKey: 'bank-transfer',
  subject: 'Manual-transfer instructions for order GOL-6001',
  bodyPreview: 'Keep your transfer evidence ready.',
  maxAttempts: 3
}, {
  queuedAt: '2026-06-04T09:00:00.000Z'
});

assert.equal(queued.evidence.notificationStatus, 'queued');
assert.equal(queued.evidence.notificationRetryable, false);
assert.equal(queued.retryPlan.shouldRetry, false);
assert.equal(queued.evidence.customerNotificationAttempts[0]?.queuedAt, '2026-06-04T09:00:00.000Z');

const failed = customerNotificationTransportAttempt({
  templateKey: 'manual_transfer_instructions',
  channel: 'email',
  locale: 'en',
  recipient: 'customer@example.test',
  orderNumber: 'GOL-6001',
  paymentAttemptId: 'pay-6001',
  selectedPaymentMethodKey: 'bank-transfer',
  subject: 'Manual-transfer instructions for order GOL-6001',
  bodyPreview: 'Keep your transfer evidence ready.',
  status: 'failed',
  attemptNumber: 1,
  maxAttempts: 3,
  failedAt: '2026-06-04T09:05:00.000Z',
  lastError: 'smtp-timeout'
}, queued.evidence, {
  now: '2026-06-04T09:05:00.000Z',
  retryDelayMs: 300000
});

assert.equal(failed.evidence.notificationStatus, 'failed');
assert.equal(failed.evidence.notificationRetryable, true);
assert.equal(failed.evidence.customerNotificationAttempts.length, 2);
assert.equal(failed.retryPlan.shouldRetry, true);
assert.equal(failed.retryPlan.nextAttemptNumber, 2);
assert.equal(failed.retryPlan.nextRetryAt, '2026-06-04T09:10:00.000Z');

const sent = customerNotificationTransportAttempt({
  templateKey: 'manual_transfer_instructions',
  channel: 'email',
  locale: 'en',
  recipient: 'customer@example.test',
  orderNumber: 'GOL-6001',
  paymentAttemptId: 'pay-6001',
  selectedPaymentMethodKey: 'bank-transfer',
  status: 'sent',
  attemptNumber: 2,
  maxAttempts: 3,
  sentAt: '2026-06-04T09:10:30.000Z',
  providerMessageId: 'message-6001'
}, failed.evidence);

assert.equal(sent.evidence.notificationStatus, 'sent');
assert.equal(sent.evidence.notificationRetryable, false);
assert.equal(sent.evidence.customerNotificationAttempts.length, 3);
assert.equal(sent.retryPlan.shouldRetry, false);
assert.equal(customerNotificationTransportRetryPlan(sent.evidence).shouldRetry, false);

assert.ok(roadmapSource.includes('Transport retry wiring for customer notifications records queued, failed, retry-pending, sent, and skipped evidence before provider-specific delivery persistence.'));
assert.ok(roadmapSource.includes('Start **Phase P8 — admin delivery visibility for customer notifications**'));

console.log('customer notification transport retry source guard passed');
