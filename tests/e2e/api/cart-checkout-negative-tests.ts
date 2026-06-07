import assert from 'node:assert/strict';
import { CART_COOKIE_NAME } from '@/lib/cart/cart-cookie';
import { CUSTOMER_SESSION_COOKIE_NAME } from '@/lib/customers/customer-session-cookie';
import {
  BASE_URL,
  CookieJar,
  appendServerActionFields,
  assertRedirect,
  request,
  responseText,
  type ApiFixture
} from './shared';

export async function runCartCheckoutNegativeTests(fixture: ApiFixture) {
  await runMissingRecipientNameCheckoutTest(fixture);
  await runMissingPhoneCheckoutTest(fixture);
  await runMissingCityCheckoutTest(fixture);
  await runMissingAddressLineCheckoutTest(fixture);
  await runInvalidDeliveryDateCheckoutTest(fixture);
  await runInvalidDeliveryWindowCheckoutTest(fixture);
  await runEmptyCartCheckoutGuardTest(fixture);
  await runMissingCartCookieGuardTest();
  await runInactiveVariantAtSubmitReleasesCartTest(fixture);
  await runInsufficientStockAtSubmitReleasesCartTest(fixture);
  await runConcurrentCheckoutSubmitGuardTest(fixture);
}

async function runMissingRecipientNameCheckoutTest(fixture: ApiFixture) {
  await runPreClaimValidationTest(fixture, {
    token: 'api-e2e-negative-checkout-cart',
    customerNote: 'API negative checkout should not create order.',
    expectedPath: '/cart/checkout?checkout=name-required',
    fields: { name: '' }
  });
}

async function runMissingPhoneCheckoutTest(fixture: ApiFixture) {
  await runPreClaimValidationTest(fixture, {
    token: 'api-e2e-missing-phone-checkout-cart',
    customerNote: 'API missing phone checkout should not create order.',
    expectedPath: '/cart/checkout?checkout=phone-required',
    fields: { phone: '' }
  });
}

async function runMissingCityCheckoutTest(fixture: ApiFixture) {
  await runPreClaimValidationTest(fixture, {
    token: 'api-e2e-missing-city-checkout-cart',
    customerNote: 'API missing city checkout should not create order.',
    expectedPath: '/cart/checkout?checkout=city-required',
    fields: { city: '' }
  });
}

async function runMissingAddressLineCheckoutTest(fixture: ApiFixture) {
  await runPreClaimValidationTest(fixture, {
    token: 'api-e2e-missing-address-checkout-cart',
    customerNote: 'API missing address checkout should not create order.',
    expectedPath: '/cart/checkout?checkout=address-required',
    fields: { addressLine1: '' }
  });
}

async function runInvalidDeliveryDateCheckoutTest(fixture: ApiFixture) {
  await runPreClaimValidationTest(fixture, {
    token: 'api-e2e-invalid-delivery-date-cart',
    customerNote: 'API invalid delivery date should not create order.',
    expectedPath: '/cart/checkout?checkout=delivery-date-invalid',
    fields: { deliveryDate: 'not-a-date' }
  });
}

async function runInvalidDeliveryWindowCheckoutTest(fixture: ApiFixture) {
  await runPreClaimValidationTest(fixture, {
    token: 'api-e2e-invalid-delivery-window-cart',
    customerNote: 'API invalid delivery window should not create order.',
    expectedPath: '/cart/checkout?checkout=delivery-window-invalid',
    fields: { deliveryWindow: 'tomorrow morning' }
  });
}

async function runPreClaimValidationTest(
  fixture: ApiFixture,
  input: {
    token: string;
    customerNote: string;
    expectedPath: string;
    fields: Record<string, string>;
  }
) {
  const cart = await createCart(fixture, input.token, 1);
  const jar = checkoutJar(fixture, cart.token);
  const checkoutHtml = await responseText(await request('/cart/checkout', { headers: { cookie: jar.header() } }));
  const beforeCount = await fixture.prisma.checkoutOrder.count({ where: { customerNote: input.customerNote } });

  const form = checkoutForm(checkoutHtml, input.customerNote, input.fields);
  const response = await submitCheckout('/cart/checkout', form, jar);

  assertRedirect(response, input.expectedPath);
  assert.equal(await fixture.prisma.checkoutOrder.count({ where: { customerNote: input.customerNote } }), beforeCount);
  assert.equal(await fixture.prisma.cartItem.count({ where: { cartId: cart.id } }), 1);
  assert.equal((await fixture.prisma.cartSession.findUniqueOrThrow({ where: { id: cart.id } })).status, 'active');
}

async function runEmptyCartCheckoutGuardTest(fixture: ApiFixture) {
  const emptyCart = await fixture.prisma.cartSession.create({
    data: {
      token: 'api-e2e-empty-checkout-cart',
      locale: 'fa-IR',
      currency: 'TOMAN',
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
  });
  const jar = new CookieJar();
  jar.set(CART_COOKIE_NAME, emptyCart.token);
  const response = await request('/cart/checkout', { headers: { cookie: jar.header() } });
  assert.equal([200, 302, 303, 307, 308].includes(response.status), true);
  if (response.status === 200) assert.doesNotMatch(await response.text(), /name="addressLine1"/);
}

async function runMissingCartCookieGuardTest() {
  const response = await request('/cart/checkout');
  assert.equal([200, 302, 303, 307, 308].includes(response.status), true);
  if (response.status === 200) assert.doesNotMatch(await response.text(), /name="addressLine1"/);
}

async function runInactiveVariantAtSubmitReleasesCartTest(fixture: ApiFixture) {
  const cart = await createCart(fixture, 'api-e2e-inactive-variant-checkout-cart', 1);
  const jar = checkoutJar(fixture, cart.token);
  const checkoutHtml = await responseText(await request('/cart/checkout', { headers: { cookie: jar.header() } }));
  const note = 'API inactive variant checkout should release cart.';

  await fixture.prisma.productVariant.update({ where: { id: fixture.variantId }, data: { isActive: false } });
  try {
    const response = await submitCheckout('/cart/checkout', checkoutForm(checkoutHtml, note), jar);
    assertRedirect(response, '/cart/checkout?checkout=cart-empty');
    assert.equal(await fixture.prisma.checkoutOrder.count({ where: { customerNote: note } }), 0);
    assert.equal(await fixture.prisma.cartItem.count({ where: { cartId: cart.id } }), 0);
    assert.equal((await fixture.prisma.cartSession.findUniqueOrThrow({ where: { id: cart.id } })).status, 'active');
  } finally {
    await fixture.prisma.productVariant.update({ where: { id: fixture.variantId }, data: { isActive: true } });
  }
}

async function runInsufficientStockAtSubmitReleasesCartTest(fixture: ApiFixture) {
  const cart = await createCart(fixture, 'api-e2e-insufficient-stock-checkout-cart', 13);
  const jar = checkoutJar(fixture, cart.token);
  const checkoutHtml = await responseText(await request('/cart/checkout', { headers: { cookie: jar.header() } }));
  const note = 'API insufficient stock checkout should release cart.';
  const beforeCount = await fixture.prisma.checkoutOrder.count({ where: { customerNote: note } });

  const response = await submitCheckout('/cart/checkout', checkoutForm(checkoutHtml, note), jar);

  assertRedirect(response, '/cart/checkout?checkout=failed');
  assert.equal(await fixture.prisma.checkoutOrder.count({ where: { customerNote: note } }), beforeCount);
  assert.equal(await fixture.prisma.cartItem.count({ where: { cartId: cart.id } }), 1);
  assert.equal((await fixture.prisma.cartSession.findUniqueOrThrow({ where: { id: cart.id } })).status, 'active');
}

async function runConcurrentCheckoutSubmitGuardTest(fixture: ApiFixture) {
  const cart = await createCart(fixture, 'api-e2e-concurrent-checkout-cart', 1);
  const jar = checkoutJar(fixture, cart.token);
  const checkoutHtml = await responseText(await request('/cart/checkout', { headers: { cookie: jar.header() } }));
  const form = checkoutForm(checkoutHtml, 'API concurrent checkout guard.', {
    name: 'API Concurrent Checkout',
    phone: '+16045559588',
    email: 'api-concurrent-checkout.e2e@golara.test',
    addressLine1: '888 Concurrent Checkout Way',
    deliveryDate: '2026-07-04',
    deliveryWindow: '12:00-14:00'
  });

  const submit = () => submitCheckout('/cart/checkout', cloneFormData(form), jar);
  const results = await Promise.allSettled([submit(), submit()]);
  assert.equal(results.every((result) => result.status === 'fulfilled'), true);
  assert.equal(await fixture.prisma.checkoutOrder.count({ where: { customerNote: 'API concurrent checkout guard.' } }), 1);
  assert.equal(await fixture.prisma.cartItem.count({ where: { cartId: cart.id } }), 0);
  assert.equal((await fixture.prisma.cartSession.findUniqueOrThrow({ where: { id: cart.id } })).status, 'checked_out');
}

async function submitCheckout(path: string, formData: FormData, jar: CookieJar) {
  return request(path, {
    method: 'POST',
    body: formData,
    headers: {
      cookie: jar.header(),
      origin: BASE_URL,
      referer: `${BASE_URL}${path}`
    }
  });
}

async function createCart(fixture: ApiFixture, token: string, quantity: number) {
  return fixture.prisma.cartSession.create({
    data: {
      token,
      locale: 'fa-IR',
      currency: 'TOMAN',
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      items: {
        create: {
          productId: fixture.productId,
          variantId: fixture.variantId,
          lineKey: fixture.variantId,
          quantity
        }
      }
    }
  });
}

function checkoutJar(fixture: ApiFixture, cartToken: string) {
  const jar = new CookieJar();
  jar.set(CART_COOKIE_NAME, cartToken);
  jar.set(CUSTOMER_SESSION_COOKIE_NAME, fixture.customerSessionToken);
  return jar;
}

function checkoutForm(checkoutHtml: string, customerNote: string, overrides: Record<string, string> = {}) {
  const form = new FormData();
  appendServerActionFields(form, checkoutHtml, 'name="addressLine1"');
  const fields = {
    name: 'API Negative Checkout',
    phone: '+16045559555',
    email: 'api-negative-checkout.e2e@golara.test',
    city: 'Vancouver',
    addressLine1: '123 Negative Checkout Lane',
    deliveryDate: '2026-07-03',
    deliveryWindow: '10:00-12:00',
    customerNote,
    ...overrides
  };
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return form;
}

function cloneFormData(source: FormData) {
  const form = new FormData();
  for (const [key, value] of source.entries()) form.set(key, value);
  return form;
}
