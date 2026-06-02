import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentAttemptTimelineFlowTests() {
  const repository = source('lib/checkout/admin-order-repository.ts');
  const detail = source('app/admin/orders/[orderId]/page.tsx');

  assert.match(repository, /paymentAttempts: \{/);
  assert.match(repository, /include: \{ events: \{ orderBy: \{ createdAt: 'desc' \} \} \}/);

  assert.match(detail, /Provider reference/);
  assert.match(detail, /Payment events/);
  assert.match(detail, /event.eventType/);
  assert.match(detail, /event.idempotencyKey/);
  assert.match(detail, /event.processedAt/);

  console.log('payment-attempt-timeline-flow.test.ts passed');
}
