import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { buildManualTransferRefundTrackingMetadata } from '../../lib/checkout/manual-transfer-refund-tracking';

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
  const refundTracking = source('lib/checkout/manual-transfer-refund-tracking.ts');

  const trackingMetadata = buildManualTransferRefundTrackingMetadata({
    operation: 'refund',
    paymentAttemptId: 'attempt_123',
    orderId: 'order_123',
    fromStatus: 'paid',
    amountCents: 4200,
    currency: 'toman',
    providerReference: 'bank-ref-123',
    manualPaymentReference: 'customer-ref-123',
    note: 'Refund approved',
    actorLabel: 'Owner',
    actorRole: 'owner',
    recordedAt: '2026-06-16T08:00:00.000Z'
  });
  assert.equal(trackingMetadata.manualTransferRefundTrackingVersion, 'p6.manual-transfer-refund-tracking.v1');
  assert.equal(trackingMetadata.manualTransferRefundOperation, 'refund');
  assert.equal(trackingMetadata.manualTransferRefundStatus, 'refund_recorded');
  assert.equal(trackingMetadata.manualTransferRefundAmountCents, 4200);
  assert.equal(trackingMetadata.manualTransferRefundCurrency, 'TOMAN');
  assert.equal(trackingMetadata.manualTransferRefundProviderReference, 'bank-ref-123');
  assert.equal(trackingMetadata.manualTransferRefundManualReference, 'customer-ref-123');

  const voidTrackingMetadata = buildManualTransferRefundTrackingMetadata({
    operation: 'void',
    paymentAttemptId: 'attempt_456',
    orderId: 'order_456',
    fromStatus: 'pending',
    amountCents: -1,
    currency: 'usd'
  });
  assert.equal(voidTrackingMetadata.manualTransferRefundStatus, 'void_recorded');
  assert.equal(voidTrackingMetadata.manualTransferRefundAmountCents, 0);
  assert.equal(voidTrackingMetadata.manualTransferRefundRecordedBy, 'Admin');
  assert.equal(voidTrackingMetadata.manualTransferRefundRecordedRole, 'owner');

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

  assert.match(statusService, /import \{ buildManualTransferRefundTrackingMetadata \}/);
  assert.match(statusService, /function manualTransferRefundOperation\(status: CheckoutPaymentStatus\)/);
  assert.match(statusService, /if \(status === 'refunded'\) return 'refund'/);
  assert.match(statusService, /if \(status === 'cancelled'\) return 'void'/);
  assert.match(statusService, /provider:\s*true,[\s\S]*amountCents:\s*true,[\s\S]*currency:\s*true,[\s\S]*providerReference:\s*true,[\s\S]*metadata:\s*true/);
  assert.match(statusService, /payment\.provider === 'manual' \? manualTransferRefundOperation\(input\.to\) : undefined/);
  assert.match(statusService, /buildManualTransferRefundTrackingMetadata\(\{[\s\S]*operation,[\s\S]*paymentAttemptId:\s*payment\.id,[\s\S]*orderId:\s*payment\.orderId,[\s\S]*fromStatus:\s*from,[\s\S]*amountCents:\s*payment\.amountCents,[\s\S]*currency:\s*payment\.currency/);
  assert.match(statusService, /const nextMetadata = trackingMetadata \? \{ \.\.\.metadataObject\(payment\.metadata\), \.\.\.trackingMetadata \} : undefined/);
  assert.match(statusService, /metadata:\s*nextMetadata/);
  assert.match(statusService, /metadata:\s*\{ from, to: input\.to, paymentAttemptId: payment\.id, \.\.\.\(trackingMetadata \?\? \{\}\) \}/);

  assert.match(statusService, /async function applyPaymentCapacityLifecycle/);
  assert.match(statusService, /status === 'failed' \|\| status === 'cancelled' \|\| status === 'refunded'/);
  assert.match(statusService, /releaseOrderFulfillmentCapacityReservation\(orderId, 'released'\)/);
  assert.match(statusService, /releaseOrderInventoryReservations\(orderId\)/);
  assert.match(statusService, /type:\s*'payment_status_changed'/);
  assert.match(statusService, /metadata:\s*\{ from, to: input\.to, paymentAttemptId: payment\.id/);

  assert.match(detail, /canRefund = attempt\.provider === 'manual' && attempt\.status === 'paid'/);
  assert.match(detail, /canVoid = attempt\.provider === 'manual'/);
  assert.match(detail, /Refund manual payment/);
  assert.match(detail, /Void manual payment/);
  assert.match(detail, /manual-payment-refunded/);
  assert.match(detail, /manual-payment-voided/);

  assert.match(refundTracking, /MANUAL_TRANSFER_REFUND_TRACKING_VERSION/);
  assert.match(refundTracking, /buildManualTransferRefundTrackingMetadata/);
  assert.match(refundTracking, /manualTransferRefundTrackingVersion/);
  assert.match(refundTracking, /manualTransferRefundProviderReference/);
  assert.match(refundTracking, /manualTransferRefundManualReference/);
  assert.match(refundTracking, /manualTransferRefundRecordedAt/);
  assert.equal(refundTracking.includes('@prisma/client'), false);
  assert.equal(refundTracking.includes('prisma.'), false);

  console.log('manual-payment-adjustment-flow.test.ts passed');
}
