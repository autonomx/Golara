import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function between(sourceText: string, start: string, end: string) {
  const startIndex = sourceText.indexOf(start);
  assert.notEqual(startIndex, -1, `${start} should exist`);
  const endIndex = sourceText.indexOf(end, startIndex);
  assert.notEqual(endIndex, -1, `${end} should exist after ${start}`);
  return sourceText.slice(startIndex, endIndex);
}

export async function runManualPaymentAdjustmentFlowTests() {
  const actions = source('app/admin/order-actions.ts');
  const detail = source('app/admin/orders/[orderId]/page.tsx');
  const statusService = source('lib/checkout/checkout-status-service.ts');

  assert.match(actions, /transitionManualPaymentAttemptAction/);
  assert.match(actions, /existingAttempt\.provider !== 'manual'/);
  assert.match(actions, /Only manual payment attempts can be adjusted from admin/);
  assert.match(actions, /export async function refundManualPaymentAttemptAction/);
  assert.match(actions, /export async function voidManualPaymentAttemptAction/);
  assert.match(actions, /order\.payment\.manual\.refund/);
  assert.match(actions, /order\.payment\.manual\.void/);

  const manualTransition = between(actions, 'async function transitionManualPaymentAttemptAction', 'export async function refundManualPaymentAttemptAction');
  assert.match(manualTransition, /assertAdminRole\('owner'\)/);
  assert.match(manualTransition, /where:\s*\{\s*id:\s*paymentAttemptId,\s*orderId\s*\}/);
  assert.match(manualTransition, /select:\s*\{\s*id:\s*true,\s*provider:\s*true,\s*status:\s*true,\s*order:/);
  assert.match(manualTransition, /transitionCheckoutPaymentStatus\(\{[\s\S]*paymentAttemptId,[\s\S]*to,[\s\S]*note:[\s\S]*actorLabel:[\s\S]*actorRole:/);
  assert.match(manualTransition, /recordAdminAuditLog\(\{[\s\S]*entity:\s*'checkoutOrder',[\s\S]*entityId:\s*attempt\.order\.id/);
  assert.match(manualTransition, /metadata:\s*\{[\s\S]*paymentAttemptId:\s*updated\.id,[\s\S]*from:\s*attempt\.status,[\s\S]*to[\s\S]*\}/);
  assert.doesNotMatch(manualTransition, /providerReference/);

  assert.match(statusService, /async function applyPaymentCapacityLifecycle/);
  assert.match(statusService, /status === 'failed' \|\| status === 'cancelled' \|\| status === 'refunded'/);
  assert.match(statusService, /releaseOrderFulfillmentCapacityReservation\(orderId, 'released'\)/);
  assert.match(statusService, /releaseOrderInventoryReservations\(orderId\)/);
  assert.match(statusService, /type:\s*'payment_status_changed'/);
  assert.match(statusService, /metadata:\s*\{\s*from,\s*to:\s*input\.to,\s*paymentAttemptId:\s*payment\.id\s*\}/);

  assert.match(detail, /canRefund = attempt\.provider === 'manual' && attempt\.status === 'paid'/);
  assert.match(detail, /canVoid = attempt\.provider === 'manual'/);
  assert.match(detail, /Refund manual payment/);
  assert.match(detail, /Void manual payment/);
  assert.match(detail, /manual-payment-refunded/);
  assert.match(detail, /manual-payment-voided/);

  console.log('manual-payment-adjustment-flow.test.ts passed');
}
