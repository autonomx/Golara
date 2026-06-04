import assert from 'node:assert/strict';
import {
  checkoutReturnApplyInput,
  checkoutReturnFallbackUrl,
  checkoutReturnSuccessUrl,
  normalizeHostedCheckoutReturnStatus,
  normalizeZarinpalReturnStatus,
  type CheckoutReturnApplyInput
} from '../../lib/checkout/order-return-route-core';
import { checkoutReturnRouteRedirect } from '../../lib/checkout/order-return-route-handler-core';

const requestUrl = 'https://golara.example/orders/return?order=GOL-1001&token=lookup-token-123456&provider=zarinpal&Authority=A0001&Status=OK';

export async function runOrderReturnRouteCoreTests() {
  assert.equal(normalizeZarinpalReturnStatus('OK'), 'paid');
  assert.equal(normalizeZarinpalReturnStatus(' ok '), 'paid');
  assert.equal(normalizeZarinpalReturnStatus('NOK'), 'failed');
  assert.equal(normalizeZarinpalReturnStatus(null), 'failed');
  assert.equal(normalizeZarinpalReturnStatus('pending'), 'pending');

  assert.equal(normalizeHostedCheckoutReturnStatus('success'), 'paid');
  assert.equal(normalizeHostedCheckoutReturnStatus(' cancel '), 'cancelled');
  assert.equal(normalizeHostedCheckoutReturnStatus(null), 'failed');
  assert.equal(normalizeHostedCheckoutReturnStatus('failed'), 'failed');

  assert.deepEqual(checkoutReturnApplyInput(requestUrl), {
    orderNumber: 'GOL-1001',
    token: 'lookup-token-123456',
    status: 'paid',
    provider: 'zarinpal',
    providerReference: 'A0001',
    authority: 'A0001'
  });

  assert.deepEqual(checkoutReturnApplyInput('https://golara.example/orders/return?order=GOL-1002&token=lookup-token-abcdef&status=cancelled&ref=REF-1'), {
    orderNumber: 'GOL-1002',
    token: 'lookup-token-abcdef',
    status: 'cancelled',
    provider: undefined,
    providerReference: 'REF-1',
    authority: undefined
  });

  assert.deepEqual(checkoutReturnApplyInput('https://golara.example/orders/return?order=GOL-1003&token=lookup-token-stripe&provider=stripe&payment=success&checkout_session_id=cs_test_123'), {
    orderNumber: 'GOL-1003',
    token: 'lookup-token-stripe',
    status: 'paid',
    provider: 'stripe',
    providerReference: 'cs_test_123',
    authority: undefined
  });

  assert.deepEqual(checkoutReturnApplyInput('https://golara.example/orders/return?order=GOL-1004&token=lookup-token-stripe&provider=stripe&payment=cancel&checkoutSession=cs_test_cancel'), {
    orderNumber: 'GOL-1004',
    token: 'lookup-token-stripe',
    status: 'cancelled',
    provider: 'stripe',
    providerReference: 'cs_test_cancel',
    authority: undefined
  });

  assert.equal(
    checkoutReturnFallbackUrl('https://golara.example/orders/return?order=GOL-1001').toString(),
    'https://golara.example/orders/confirmation?result=failed'
  );
  assert.equal(
    checkoutReturnFallbackUrl('https://golara.example/orders/return?order=GOL-1001', 'missing-token').toString(),
    'https://golara.example/orders/confirmation?result=missing-token'
  );

  assert.equal(
    checkoutReturnSuccessUrl(requestUrl, { publicLookupToken: 'public-token', status: 'paid' }).toString(),
    'https://golara.example/orders/public-token?result=paid'
  );
  assert.equal(
    checkoutReturnSuccessUrl(requestUrl, { publicLookupToken: null, status: 'paid' }).toString(),
    'https://golara.example/orders/confirmation?result=missing-token'
  );

  const appliedInputs: CheckoutReturnApplyInput[] = [];
  const success = await checkoutReturnRouteRedirect({
    requestUrl: 'https://golara.example/orders/return?order=GOL-1005&token=lookup-token-route&provider=stripe&payment=success&session_id=cs_test_456',
    applyResult: async (input) => {
      appliedInputs.push(input);
      return { publicLookupToken: 'public-token-route', status: 'paid' };
    }
  });
  assert.equal(success.applied, true);
  assert.equal(success.error, undefined);
  assert.equal(success.redirectUrl.toString(), 'https://golara.example/orders/public-token-route?result=paid');
  assert.deepEqual(appliedInputs, [{
    orderNumber: 'GOL-1005',
    token: 'lookup-token-route',
    status: 'paid',
    provider: 'stripe',
    providerReference: 'cs_test_456',
    authority: undefined
  }]);

  const failure = await checkoutReturnRouteRedirect({
    requestUrl: 'https://golara.example/orders/return?order=GOL-1006&token=short&provider=zarinpal&Authority=A0002&Status=OK',
    applyResult: async () => {
      throw new Error('invalid return reference');
    }
  });
  assert.equal(failure.applied, false);
  assert.ok(failure.error instanceof Error);
  assert.equal(failure.redirectUrl.toString(), 'https://golara.example/orders/confirmation?result=failed');

  console.log('order-return-route-core.test.ts passed');
}
