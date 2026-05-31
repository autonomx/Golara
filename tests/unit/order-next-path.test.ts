import assert from 'node:assert/strict';
import { orderNextPath } from '../../lib/checkout/order-next-path';

export async function runOrderNextPathTests() {
  assert.equal(orderNextPath({
    orderNumber: 'GOL-1001',
    publicLookupToken: 'lookup-token',
    attempt: {
      status: 'redirect_required',
      nextUrl: 'https://pay.example.test/start/GOL-1001'
    }
  }), 'https://pay.example.test/start/GOL-1001');

  assert.equal(orderNextPath({
    orderNumber: 'GOL 1001',
    publicLookupToken: null,
    attempt: {
      status: 'manual_pending'
    }
  }), '/orders/confirmation?order=GOL%201001');

  assert.equal(orderNextPath({
    orderNumber: 'GOL-1001',
    publicLookupToken: 'lookup-token',
    attempt: {
      status: 'manual_pending'
    }
  }), '/orders/lookup-token');

  assert.equal(orderNextPath({
    orderNumber: 'GOL-1001',
    publicLookupToken: 'lookup-token',
    attempt: {
      status: 'redirect_required',
      nextUrl: '   '
    }
  }), '/orders/lookup-token');

  console.log('order-next-path.test.ts passed');
}
