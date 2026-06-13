import assert from 'node:assert/strict';
import { orderConfirmationPanelClass, orderConfirmationResultCopy } from '../../lib/checkout/order-confirmation-copy';
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

  assert.equal(orderConfirmationResultCopy().title, 'Thank you');
  assert.equal(orderConfirmationResultCopy('paid').tone, 'success');
  assert.equal(orderConfirmationResultCopy('failed').title, 'Payment was not verified');
  assert.equal(orderConfirmationResultCopy('cancelled').title, 'Checkout was cancelled');
  assert.equal(orderConfirmationResultCopy('missing-token').title, 'We could not open the order status page');
  assert.equal(orderConfirmationResultCopy('unknown').title, 'Thank you');
  assert.equal(orderConfirmationPanelClass('success'), 'border-olive/20 bg-cream text-olive');
  assert.equal(orderConfirmationPanelClass('warning'), 'border-amber-300 bg-amber-50 text-amber-900');

  assert.deepEqual(checkoutReturnApplyInput(requestUrl), {
    orderNumber: 'GOL-1001',
    token: 'lookup-token-123456',
    status: 'paid',
    provider: 'zarinpal',
    providerReference: 'A0001'
  });

  assert.deepEqual(checkoutReturnApplyInput('https://golara.example/orders/return?order=GOL-1002&token=lookup-token-abcdef&status=cancelled&ref=REF-1'), {
    orderNumber: 'GOL-1002',
    token: 'lookup-token-abcdef',
    status: 'cancelled',
    provider: undefined,
    providerReference: 'REF-1'
  });

  assert.deepEqual(checkoutReturnApplyInput('https://golara.example/orders/return?order=GOL-1003&token=lookup-token-stripe&provider=stripe&payment=success&checkout_session_id=cs_test_123'), {
    orderNumber: 'GOL-1003',
    token: 'lookup-token-stripe',
    status: 'paid',
    provider: 'stripe',
    providerReference: 'cs_test_123'
  });

  assert.deepEqual(checkoutReturnApplyInput('https://golara.example/orders/return?order=GOL-1004&token=lookup-token-stripe&provider=stripe&payment=cancel&checkoutSession=cs_test_cancel'), {
    orderNumber: 'GOL-1004',
    token: 'lookup-token-stripe',
    status: 'cancelled',
    provider: 'stripe',
    providerReference: 'cs_test_cancel'
  });

  assert.deepEqual(checkoutReturnApplyInput('https://golara.example/orders/return?order=GOL-1007&token=lookup-token-zarinpal&provider=zarinpal&Authority=A0007&Status=NOK'), {
    orderNumber: 'GOL-1007',
    token: 'lookup-token-zarinpal',
    status: 'failed',
    provider: 'zarinpal',
    providerReference: 'A0007'
  });

  assert.deepEqual(checkoutReturnApplyInput('https://golara.example/orders/return?order=GOL-1010&token=lookup-token-extra&provider=stripe&payment=success&session_id=cs_test_extra&customerEmail=a@example.com&recipientPhone=555&rawPayload=secret'), {
    orderNumber: 'GOL-1010',
    token: 'lookup-token-extra',
    status: 'paid',
    provider: 'stripe',
    providerReference: 'cs_test_extra'
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
    checkoutReturnSuccessUrl(requestUrl, { publicLookupToken: 'public-token-failed', status: 'failed' }).toString(),
    'https://golara.example/orders/public-token-failed?result=failed'
  );
  assert.equal(
    checkoutReturnSuccessUrl(requestUrl, { publicLookupToken: 'public-token-cancelled', status: 'cancelled' }).toString(),
    'https://golara.example/orders/public-token-cancelled?result=cancelled'
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
    providerReference: 'cs_test_456'
  }]);

  const cancelInputs: CheckoutReturnApplyInput[] = [];
  const cancelled = await checkoutReturnRouteRedirect({
    requestUrl: 'https://golara.example/orders/return?order=GOL-1008&token=lookup-token-cancel&provider=stripe&payment=cancel&session_id=cs_test_cancel_789',
    applyResult: async (input) => {
      cancelInputs.push(input);
      return { publicLookupToken: 'public-token-cancel', status: input.status };
    }
  });
  assert.equal(cancelled.applied, true);
  assert.equal(cancelled.error, undefined);
  assert.equal(cancelled.redirectUrl.toString(), 'https://golara.example/orders/public-token-cancel?result=cancelled');
  assert.deepEqual(cancelInputs, [{
    orderNumber: 'GOL-1008',
    token: 'lookup-token-cancel',
    status: 'cancelled',
    provider: 'stripe',
    providerReference: 'cs_test_cancel_789'
  }]);

  const zarinpalFailedInputs: CheckoutReturnApplyInput[] = [];
  const zarinpalFailed = await checkoutReturnRouteRedirect({
    requestUrl: 'https://golara.example/orders/return?order=GOL-1009&token=lookup-token-zarinpal-failed&provider=zarinpal&Authority=A0009&Status=NOK',
    applyResult: async (input) => {
      zarinpalFailedInputs.push(input);
      return { publicLookupToken: 'public-token-zarinpal-failed', status: input.status };
    }
  });
  assert.equal(zarinpalFailed.applied, true);
  assert.equal(zarinpalFailed.error, undefined);
  assert.equal(zarinpalFailed.redirectUrl.toString(), 'https://golara.example/orders/public-token-zarinpal-failed?result=failed');
  assert.deepEqual(zarinpalFailedInputs, [{
    orderNumber: 'GOL-1009',
    token: 'lookup-token-zarinpal-failed',
    status: 'failed',
    provider: 'zarinpal',
    providerReference: 'A0009'
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
