import assert from 'node:assert/strict';

import type { PaymentOperationRecordRow } from '../../lib/checkout/payment-operation-record-repository';
import { buildPaymentOperationHistoryView } from '../../lib/checkout/payment-operation-history-view';

function record(overrides: Partial<PaymentOperationRecordRow>): PaymentOperationRecordRow {
  return {
    id: 'operation-1',
    orderId: 'order-1',
    paymentAttemptId: 'payment-1',
    orderNumber: 'GOL-1001',
    operationKind: 'refund',
    requestedAmountCents: 12500,
    currency: 'USD',
    originalPaymentAmountCents: 25000,
    originalPaymentCurrency: 'USD',
    provider: 'stripe',
    providerReference: 'pi_123',
    idempotencyKey: 'operation-key-1',
    operatorId: 'operator-1',
    operatorLabel: 'Ops Lead',
    operatorEmail: 'ops@example.test',
    operatorReason: 'Customer request',
    previewDecision: 'ready',
    previewReasons: [],
    status: 'pending',
    providerOperationReference: null,
    providerStatus: null,
    errorCategory: null,
    retryable: false,
    transitionPlan: {},
    metadata: {},
    submittedAt: null,
    completedAt: null,
    createdAt: new Date('2026-06-04T20:00:00.000Z'),
    updatedAt: new Date('2026-06-04T20:05:00.000Z'),
    ...overrides
  };
}

export async function runPaymentOperationHistoryViewTests() {
  const view = buildPaymentOperationHistoryView([
    record({ id: 'operation-succeeded', status: 'succeeded', retryable: false, providerOperationReference: 'refund_123' }),
    record({ id: 'operation-failed', status: 'failed', retryable: true, errorCategory: 'provider_timeout' }),
    record({ id: 'operation-review', status: 'manual_review', retryable: false, provider: 'manual', providerReference: null })
  ], { orderId: ' order-1 ', limit: 10 });

  assert.equal(view.status, 'ready');
  assert.equal(view.heading, 'Payment operation history');
  assert.match(view.summary, /does not execute provider operations/);
  assert.deepEqual(view.summaryRows, [
    { label: 'Loaded records', value: '3' },
    { label: 'Succeeded', value: '1' },
    { label: 'Needs review', value: '1' },
    { label: 'Retryable', value: '1' }
  ]);
  assert.deepEqual(view.filterLabels, [
    { label: 'Order filter', value: 'order-1' },
    { label: 'Display limit', value: 'Latest 10' },
    { label: 'Mode', value: 'Read-only history review' }
  ]);
  assert.equal(view.rows[0].tone, 'success');
  assert.equal(view.rows[0].referenceLabel, 'refund_123');
  assert.equal(view.rows[1].tone, 'danger');
  assert.ok(view.rows[1].detailRows.some((detail) => detail.label === 'Retryable' && detail.value === 'Yes'));
  assert.equal(view.rows[2].tone, 'warning');
  assert.equal(view.rows[2].referenceLabel, 'Provider reference pending');

  const emptyView = buildPaymentOperationHistoryView([], { orderId: null, limit: null });
  assert.equal(emptyView.status, 'empty');
  assert.match(emptyView.summary, /Confirm the migration gate/);
  assert.deepEqual(emptyView.summaryRows, [
    { label: 'Loaded records', value: '0' },
    { label: 'Succeeded', value: '0' },
    { label: 'Needs review', value: '0' },
    { label: 'Retryable', value: '0' }
  ]);
  assert.deepEqual(emptyView.filterLabels, [
    { label: 'Order filter', value: 'No order selected' },
    { label: 'Display limit', value: 'Default latest records' },
    { label: 'Mode', value: 'Read-only history review' }
  ]);

  console.log('payment-operation-history-view.test.ts passed');
}
