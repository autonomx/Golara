import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runManualPaymentMarkingFlowTests() {
  const repository = source('lib/checkout/manual-payment-repository.ts');
  const actions = source('app/admin/order-actions.ts');
  const detail = source('app/admin/orders/[orderId]/page.tsx');

  assert.match(repository, /export async function markOrderManualPayment/);
  assert.match(repository, /provider: 'manual'/);
  assert.match(repository, /status: 'created'/);
  assert.match(repository, /source: 'admin_manual'/);
  assert.match(repository, /transitionCheckoutPaymentStatus\(\{/);
  assert.match(repository, /to: 'paid'/);
  assert.match(repository, /Order already has a paid payment attempt/);

  assert.match(actions, /export async function markOrderManualPaymentAction/);
  assert.match(actions, /markOrderManualPayment\(orderId/);
  assert.match(actions, /action: 'order.payment.manual.mark_paid'/);
  assert.match(actions, /manual-payment-marked/);

  assert.match(detail, /markOrderManualPaymentAction/);
  assert.match(detail, /canMarkManualPayment/);
  assert.match(detail, /Mark manual payment paid/);
  assert.match(detail, /manual-payment-marked/);

  console.log('manual-payment-marking-flow.test.ts passed');
}
