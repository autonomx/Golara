import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

import {
  COD_ADJUSTMENT_TRACKING_VERSION,
  buildCodAdjustmentTrackingMetadata
} from '../../lib/checkout/cod-adjustment-tracking';

const helper = readFileSync('lib/checkout/cod-adjustment-tracking.ts', 'utf8');
const service = readFileSync('lib/checkout/cod-collection-service.ts', 'utf8');
const page = readFileSync('app/admin/payments/cod-collections/page.tsx', 'utf8');
const roadmap = readFileSync('docs/digikala-style-payment-remaining-phases.md', 'utf8');

const metadata = buildCodAdjustmentTrackingMetadata({
  operation: 'refund',
  paymentAttemptId: 'attempt_cod_1',
  orderId: 'order_cod_1',
  fromPaymentStatus: 'paid',
  fromCollectionStatus: 'collected',
  amountCents: 12500.75,
  currency: ' toman ',
  collectionStatus: 'collected',
  settlementStatus: 'settled',
  settlementReference: ' courier-batch-7 ',
  providerReference: ' delivery-ref-42 ',
  note: ' Customer returned package ',
  actorLabel: ' Owner User ',
  actorRole: ' owner ',
  recordedAt: '2026-06-16T10:00:00.000Z'
});

assert.equal(COD_ADJUSTMENT_TRACKING_VERSION, 'p6.cod-adjustment-tracking.v1');
assert.equal(metadata.codAdjustmentTrackingVersion, COD_ADJUSTMENT_TRACKING_VERSION);
assert.equal(metadata.codAdjustmentOperation, 'refund');
assert.equal(metadata.codAdjustmentStatus, 'refund_recorded');
assert.equal(metadata.codAdjustmentPaymentAttemptId, 'attempt_cod_1');
assert.equal(metadata.codAdjustmentOrderId, 'order_cod_1');
assert.equal(metadata.codAdjustmentFromPaymentStatus, 'paid');
assert.equal(metadata.codAdjustmentFromCollectionStatus, 'collected');
assert.equal(metadata.codAdjustmentAmountCents, 12500);
assert.equal(metadata.codAdjustmentCurrency, 'TOMAN');
assert.equal(metadata.codAdjustmentCollectionStatus, 'collected');
assert.equal(metadata.codAdjustmentSettlementStatus, 'settled');
assert.equal(metadata.codAdjustmentSettlementReference, 'courier-batch-7');
assert.equal(metadata.codAdjustmentProviderReference, 'delivery-ref-42');
assert.equal(metadata.codAdjustmentNote, 'Customer returned package');
assert.equal(metadata.codAdjustmentRecordedBy, 'Owner User');
assert.equal(metadata.codAdjustmentRecordedRole, 'owner');
assert.equal(metadata.codAdjustmentRecordedAt, '2026-06-16T10:00:00.000Z');

const voidMetadata = buildCodAdjustmentTrackingMetadata({
  operation: 'void',
  paymentAttemptId: 'attempt_cod_2',
  orderId: 'order_cod_2',
  fromPaymentStatus: 'pending',
  fromCollectionStatus: 'pending',
  amountCents: Number.NaN,
  currency: ' ',
  actorLabel: null,
  actorRole: null
});

assert.equal(voidMetadata.codAdjustmentStatus, 'void_recorded');
assert.equal(voidMetadata.codAdjustmentAmountCents, 0);
assert.equal(voidMetadata.codAdjustmentCurrency, 'TOMAN');
assert.equal(voidMetadata.codAdjustmentRecordedBy, 'Admin');
assert.equal(voidMetadata.codAdjustmentRecordedRole, 'owner');

for (const fragment of [
  'CodAdjustmentOperation',
  'CodAdjustmentTrackingStatus',
  'buildCodAdjustmentTrackingMetadata',
  'codAdjustmentSettlementReference',
  'codAdjustmentProviderReference',
  'codAdjustmentRecordedAt'
]) {
  assert.ok(helper.includes(fragment), `Expected COD adjustment helper fragment: ${fragment}`);
}

for (const fragment of [
  'recordCodAdjustment',
  'buildCodAdjustmentTrackingMetadata({',
  "type: 'cod_adjustment_recorded'",
  'tx.checkoutPaymentAttempt.update',
  'tx.checkoutOrderTimelineEvent.create',
  'Only COD payment attempts can record delivery payment adjustments'
]) {
  assert.ok(service.includes(fragment), `Expected COD adjustment service fragment: ${fragment}`);
}

for (const fragment of [
  'recordCodAdjustmentFormAction',
  "assertAdminRole('owner')",
  'COD_ADJUSTMENT_OPERATIONS',
  'codAdjustmentOperation',
  "action: 'order.payment.cod.adjustment_recorded'",
  'Record COD adjustment'
]) {
  assert.ok(page.includes(fragment), `Expected COD adjustment page fragment: ${fragment}`);
}

for (const fragment of [
  'COD adjustment/refund metadata boundary normalizes adjustment, refund, and void evidence before owner action persistence.',
  'Start **Phase P6 — COD adjustment workflow**',
  'COD adjustment owner/admin action records owner-triggered adjustment, refund, and void evidence on COD payment attempts and order timelines.',
  'Start **Phase P6 — wire COD adjustment metadata into owner/admin actions** is now complete.',
  'Start **Phase P6 — admin refund/reversal status timeline**'
]) {
  assert.ok(roadmap.includes(fragment), `Expected COD adjustment roadmap fragment: ${fragment}`);
}

console.log('cod-adjustment-workflow-source.test.ts passed');
