import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { buildPaymentOperationHistoryRouteResult } from '../../lib/checkout/payment-operation-history-route-core';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentOperationHistoryRouteCoreTests() {
  const routeCoreSource = source('lib/checkout/payment-operation-history-route-core.ts');
  assert.match(routeCoreSource, /normalizePaymentOperationHistoryRouteInput\(input\)/);
  assert.match(routeCoreSource, /status: 400/);
  assert.match(routeCoreSource, /payment_operation_records_migration_unconfirmed/);
  assert.match(routeCoreSource, /buildPaymentOperationHistoryView\(\[\], normalized\.historyOptions\)/);
  assert.doesNotMatch(routeCoreSource, /fetch\(/);
  assert.doesNotMatch(routeCoreSource, /@prisma\/client/);
  assert.doesNotMatch(routeCoreSource, /prisma\./);
  assert.doesNotMatch(routeCoreSource, /onClick=/);
  assert.doesNotMatch(routeCoreSource, /<button/);
  assert.doesNotMatch(routeCoreSource, /CheckoutOrder" SET/);
  assert.doesNotMatch(routeCoreSource, /CheckoutPaymentAttempt" SET/);

  const invalid = await buildPaymentOperationHistoryRouteResult({ orderId: ' ', limit: 'abc', env: {} });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.ok, false);
  if (!invalid.body.ok) {
    assert.deepEqual(invalid.body.errors, [
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

  const migrationBlocked = await buildPaymentOperationHistoryRouteResult({
    orderId: ' order-123 ',
    limit: '250',
    env: {}
  });
  assert.equal(migrationBlocked.status, 503);
  assert.equal(migrationBlocked.body.ok, false);
  if (!migrationBlocked.body.ok && migrationBlocked.status === 503) {
    assert.equal(migrationBlocked.body.code, 'payment_operation_records_migration_unconfirmed');
    assert.equal(migrationBlocked.body.orderId, 'order-123');
    assert.equal(migrationBlocked.body.limit, 100);
    assert.equal(migrationBlocked.body.migrationStatus.confirmed, false);
    assert.equal(migrationBlocked.body.migrationStatus.flagName, 'PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED');
    assert.equal(migrationBlocked.body.history.status, 'empty');
    assert.deepEqual(migrationBlocked.body.history.filterLabels, [
      { label: 'Order filter', value: 'order-123' },
      { label: 'Display limit', value: 'Latest 100' },
      { label: 'Mode', value: 'Read-only history review' }
    ]);
  }

  console.log('payment-operation-history-route-core.test.ts passed');
}
