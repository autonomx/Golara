import assert from 'node:assert/strict';
import { checkoutActionNextPath } from '../../lib/checkout/checkout-action-next-path';

const orderWithLookup = {
  orderNumber: 'GOL-1001',
  publicLookupToken: 'lookup-token'
};

export async function runCheckoutActionNextPathTests() {
  assert.equal(checkoutActionNextPath(orderWithLookup, {
    status: 'redirect_required',
    redirectUrl: 'https://pay.example.test/start/GOL-1001'
  }), 'https://pay.example.test/start/GOL-1001');

  assert.equal(checkoutActionNextPath({
    orderNumber: 'GOL-1002',
    publicLookupToken: 'lookup-token-zarinpal'
  }, {
    status: 'redirect_required',
    redirectUrl: 'https://payment.zarinpal.com/pg/StartPay/A0001'
  }), 'https://payment.zarinpal.com/pg/StartPay/A0001');

  assert.equal(checkoutActionNextPath({
    orderNumber: 'GOL-1003',
    publicLookupToken: 'lookup-token-stripe'
  }, {
    status: 'redirect_required',
    redirectUrl: 'https://checkout.stripe.com/c/pay/cs_test_123'
  }), 'https://checkout.stripe.com/c/pay/cs_test_123');

  assert.equal(checkoutActionNextPath({
    orderNumber: 'GOL 1001',
    publicLookupToken: null
  }, {
    status: 'manual_pending'
  }), '/orders/confirmation?order=GOL%201001');

  assert.equal(checkoutActionNextPath(orderWithLookup, {
    status: 'manual_pending'
  }), '/orders/lookup-token');

  assert.equal(checkoutActionNextPath(orderWithLookup, {
    status: 'manual_pending',
    redirectUrl: 'https://checkout.stripe.com/c/pay/should-not-open'
  }), '/orders/lookup-token');

  assert.equal(checkoutActionNextPath(orderWithLookup, {
    status: 'redirect_required',
    redirectUrl: '   '
  }), '/orders/lookup-token');

  console.log('checkout-action-next-path.test.ts passed');
}
