import assert from 'node:assert/strict';

import { normalizePaymentOperationHistoryRouteInput } from '../../lib/checkout/payment-operation-history-route-input';

export async function runPaymentOperationHistoryRouteInputTests() {
  const defaulted = normalizePaymentOperationHistoryRouteInput({ orderId: ' order-123 ', limit: null });
  assert.equal(defaulted.ok, true);
  if (defaulted.ok) {
    assert.equal(defaulted.orderId, 'order-123');
    assert.equal(defaulted.limit, 25);
    assert.deepEqual(defaulted.historyOptions, { orderId: 'order-123', limit: 25 });
  }

  const capped = normalizePaymentOperationHistoryRouteInput({ orderId: 'order-123', limit: '250' });
  assert.equal(capped.ok, true);
  if (capped.ok) assert.equal(capped.limit, 100);

  const numeric = normalizePaymentOperationHistoryRouteInput({ orderId: 'order-123', limit: 3 });
  assert.equal(numeric.ok, true);
  if (numeric.ok) assert.equal(numeric.limit, 3);

  const missingOrder = normalizePaymentOperationHistoryRouteInput({ orderId: '   ', limit: 10 });
  assert.equal(missingOrder.ok, false);
  if (!missingOrder.ok) {
    assert.deepEqual(missingOrder.errors, [{
      field: 'orderId',
      code: 'required',
      message: 'Order ID is required to read payment operation history.'
    }]);
  }

  const invalidLimit = normalizePaymentOperationHistoryRouteInput({ orderId: 'order-123', limit: 'abc' });
  assert.equal(invalidLimit.ok, false);
  if (!invalidLimit.ok) {
    assert.deepEqual(invalidLimit.errors, [{
      field: 'limit',
      code: 'invalid_limit',
      message: 'Limit must be a positive integer.'
    }]);
  }

  const multipleErrors = normalizePaymentOperationHistoryRouteInput({ orderId: '', limit: 0 });
  assert.equal(multipleErrors.ok, false);
  if (!multipleErrors.ok) {
    assert.deepEqual(multipleErrors.errors, [
      {
        field: 'orderId',
        code: 'required',
        message: 'Order ID is required to read payment operation history.'
      },
      {
        field: 'limit',
        code: 'invalid_limit',
        message: 'Limit must be a positive integer.'
      }
    ]);
  }

  console.log('payment-operation-history-route-input.test.ts passed');
}
