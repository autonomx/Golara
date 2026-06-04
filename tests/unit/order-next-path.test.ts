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
    orderNumber: 'GOL-1002',
    publicLookupToken: 'lookup-token-zarinpal',
    attempt: {
      status: 'redirect_required',
      nextUrl: 'https://payment.zarinpal.com/pg/StartPay/A0001'
    }
  }), 'https://payment.zarinpal.com/pg/StartPay/A0001');

  assert.equal(orderNextPath({
    orderNumber: 'GOL-1003',
    publicLookupToken: 'lookup-token-stripe',
    attempt: {
      status: 'redirect_required',
      nextUrl: 'https://checkout.stripe.com/c/pay/cs_test_123'
    }
  }), 'https://checkout.stripe.com/c/pay/cs_test_123');

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
      status: 'manual_pending',
      nextUrl: 'https://checkout.stripe.com/c/pay/should-not-open'
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
