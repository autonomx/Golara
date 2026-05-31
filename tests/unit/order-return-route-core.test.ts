import assert from 'node:assert/strict';
import {
  checkoutReturnApplyInput,
  checkoutReturnFallbackUrl,
  checkoutReturnSuccessUrl,
  normalizeZarinpalReturnStatus
} from '../../lib/checkout/order-return-route-core';

const requestUrl = 'https://golara.example/orders/return?order=GOL-1001&token=lookup-token-123456&provider=zarinpal&Authority=A0001&Status=OK';

export async function runOrderReturnRouteCoreTests() {
  assert.equal(normalizeZarinpalReturnStatus('OK'), 'paid');
  assert.equal(normalizeZarinpalReturnStatus(' ok '), 'paid');
  assert.equal(normalizeZarinpalReturnStatus('NOK'), 'failed');
  assert.equal(normalizeZarinpalReturnStatus(null), 'failed');
  assert.equal(normalizeZarinpalReturnStatus('pending'), 'pending');

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

  console.log('order-return-route-core.test.ts passed');
}
