import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkoutActionNextPath } from '../../lib/checkout/checkout-action-next-path';

const orderWithLookup = {
  orderNumber: 'GOL-1001',
  publicLookupToken: 'lookup-token'
};

function source(path: string) {
  return readFileSync(path, 'utf8');
}

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

  const checkoutActions = source('app/cart/checkout/actions.ts');
  const checkoutPage = source('app/cart/checkout/page.tsx');
  const checkoutShell = source('app/cart/checkout/CheckoutFormShell.tsx');

  assert.match(checkoutActions, /export type CartCheckoutActionState/);
  assert.match(checkoutActions, /_previousState: CartCheckoutActionState/);
  assert.match(checkoutActions, /return checkoutActionState\('name-required'\)/);
  assert.match(checkoutActions, /return checkoutActionState\('phone-required'\)/);
  assert.match(checkoutActions, /return checkoutActionState\('city-required'\)/);
  assert.match(checkoutActions, /return checkoutActionState\('address-required'\)/);
  assert.match(checkoutActions, /return checkoutActionState\(deliveryDateResult\.checkout\)/);
  assert.match(checkoutActions, /return checkoutActionState\(deliveryWindowResult\.checkout\)/);
  assert.match(checkoutActions, /return checkoutActionState\(paymentMethodSelection\.code\)/);
  assert.doesNotMatch(checkoutActions, /if \(name\.length < 2\) redirect\(checkoutPath\('name-required'\)\)/);
  assert.doesNotMatch(checkoutActions, /if \(city\.length < 2\) redirect\(checkoutPath\('city-required'\)\)/);

  assert.match(checkoutShell, /'use client'/);
  assert.match(checkoutShell, /useActionState\(createCartCheckoutAction, initialState\)/);
  assert.match(checkoutShell, /role="alert"/);
  assert.match(checkoutShell, /getCheckoutFlowCopy\(state\.checkout, locale\)/);

  assert.match(checkoutPage, /<CheckoutFormShell locale=\{locale\}/);
  assert.match(checkoutPage, /<\/CheckoutFormShell>/);
  assert.doesNotMatch(checkoutPage, /<form action=\{createCartCheckoutAction\}/);

  assert.match(checkoutPage, /function checkoutRequirementCopy/);
  assert.match(checkoutPage, /requiredFieldsNotice: 'Required fields are marked Required\.'/);
  assert.match(checkoutPage, /requiredFieldsNotice: 'فیلدهای ضروری با برچسب «ضروری» مشخص شده‌اند\.'/);
  assert.match(checkoutPage, /function RequiredBadge\(\{ label \}: \{ label: string \}\)/);
  assert.match(checkoutPage, /<RequiredBadge label=\{requirementCopy\.requiredLabel\} \/>/);
  assert.match(checkoutPage, /<input name="city" required minLength=\{2\}/);
  assert.match(checkoutPage, /<input name="phone" required minLength=\{7\}/);
  assert.match(checkoutPage, /<input name="paymentMethodKey" type="radio" value=\{method\.key\} required/);

  console.log('checkout-action-next-path.test.ts passed');
}
