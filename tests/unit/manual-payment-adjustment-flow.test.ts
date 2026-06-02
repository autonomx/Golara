import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runManualPaymentAdjustmentFlowTests() {
  const actions = source('app/admin/order-actions.ts');
  const detail = source('app/admin/orders/[orderId]/page.tsx');

  assert.match(actions, /transitionManualPaymentAttemptAction/);
  assert.match(actions, /attempt.provider !== 'manual'/);
  assert.match(actions, /Only manual payment attempts can be adjusted from admin/);
  assert.match(actions, /export async function refundManualPaymentAttemptAction/);
  assert.match(actions, /export async function voidManualPaymentAttemptAction/);
  assert.match(actions, /order.payment.manual.refund/);
  assert.match(actions, /order.payment.manual.void/);

  assert.match(detail, /canRefund = attempt.provider === 'manual' && attempt.status === 'paid'/);
  assert.match(detail, /canVoid = attempt.provider === 'manual'/);
  assert.match(detail, /Refund manual payment/);
  assert.match(detail, /Void manual payment/);
  assert.match(detail, /manual-payment-refunded/);
  assert.match(detail, /manual-payment-voided/);

  console.log('manual-payment-adjustment-flow.test.ts passed');
}
