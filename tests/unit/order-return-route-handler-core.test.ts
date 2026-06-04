import assert from 'node:assert/strict';
import { checkoutReturnRouteRedirect } from '../../lib/checkout/order-return-route-handler-core';
import type { CheckoutReturnApplyInput } from '../../lib/checkout/order-return-route-core';

export async function runOrderReturnRouteHandlerCoreTests() {
  const appliedInputs: CheckoutReturnApplyInput[] = [];
  const success = await checkoutReturnRouteRedirect({
    requestUrl: 'https://golara.example/orders/return?order=GOL-1001&token=lookup-token-123456&provider=stripe&payment=success&session_id=cs_test_123',
    applyResult: async (input) => {
      appliedInputs.push(input);
      return { publicLookupToken: 'public-token', status: 'paid' };
    }
  });

  assert.equal(success.applied, true);
  assert.equal(success.error, undefined);
  assert.equal(success.redirectUrl.toString(), 'https://golara.example/orders/public-token?result=paid');
  assert.deepEqual(appliedInputs, [{
    orderNumber: 'GOL-1001',
    token: 'lookup-token-123456',
    status: 'paid',
    provider: 'stripe',
    providerReference: 'cs_test_123',
    authority: undefined
  }]);

  const failure = await checkoutReturnRouteRedirect({
    requestUrl: 'https://golara.example/orders/return?order=GOL-1002&token=short&provider=zarinpal&Authority=A0001&Status=OK',
    applyResult: async () => {
      throw new Error('invalid return reference');
    }
  });

  assert.equal(failure.applied, false);
  assert.ok(failure.error instanceof Error);
  assert.equal(failure.redirectUrl.toString(), 'https://golara.example/orders/confirmation?result=failed');

  console.log('order-return-route-handler-core.test.ts passed');
}
