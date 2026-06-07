import assert from 'node:assert/strict';
import { CART_COOKIE_NAME } from '@/lib/cart/cart-cookie';
import { CUSTOMER_SESSION_COOKIE_NAME } from '@/lib/customers/customer-session-cookie';
import {
  BASE_URL,
  CookieJar,
  appendServerActionFields,
  request,
  responseText,
  type ApiFixture
} from './shared';

export async function runCartCheckoutNegativeTests(fixture: ApiFixture) {
  await runMissingRecipientNameCheckoutTest(fixture);
  await runEmptyCartCheckoutGuardTest(fixture);
  await runMissingCartCookieGuardTest();
  await runConcurrentCheckoutSubmitGuardTest(fixture);
}

async function runMissingRecipientNameCheckoutTest(fixture: ApiFixture) {
  const cart = await createCart(fixture, 'api-e2e-negative-checkout-cart', 1);
  const jar = new CookieJar();
  jar.set(CART_COOKIE_NAME, cart.token);
  jar.set(CUSTOMER_SESSION_COOKIE_NAME, fixture.customerSessionToken);
  const checkoutHtml = await responseText(await request('/cart/checkout', { headers: { cookie: jar.header() } }));
  const beforeCount = await fixture.prisma.checkoutOrder.count({
    where: { customerNote: 'API negative checkout should not create order.' }
  });

  const form = new FormData();
  appendServerActionFields(form, checkoutHtml, 'name="addressLine1"');
  form.set('name', '');
  form.set('phone', '+16045559555');
  form.set('email', 'api-negative-checkout.e2e@golara.test');
  form.set('city', 'Vancouver');
  form.set('addressLine1', '123 Negative Checkout Lane');
  form.set('deliveryDate', '2026-07-03');
  form.set('deliveryWindow', '10:00-12:00');
  form.set('customerNote', 'API negative checkout should not create order.');
  const response = await submitCheckout('/cart/checkout', form, jar);

  assert.equal([302, 303, 307, 308].includes(response.status), true);
  assert.doesNotMatch(response.headers.get('location') ?? '', /^\/orders\//);
  assert.equal(
    await fixture.prisma.checkoutOrder.count({ where: { customerNote: 'API negative checkout should not create order.' } }),
    beforeCount
  );
  assert.equal(await fixture.prisma.cartItem.count({ where: { cartId: cart.id } }), 1);
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

async function runConcurrentCheckoutSubmitGuardTest(fixture: ApiFixture) {
  const cart = await createCart(fixture, 'api-e2e-concurrent-checkout-cart', 1);
  const jar = new CookieJar();
  jar.set(CART_COOKIE_NAME, cart.token);
  jar.set(CUSTOMER_SESSION_COOKIE_NAME, fixture.customerSessionToken);
  const checkoutHtml = await responseText(await request('/cart/checkout', { headers: { cookie: jar.header() } }));
  const form = new FormData();
  appendServerActionFields(form, checkoutHtml, 'name="addressLine1"');
  form.set('name', 'API Concurrent Checkout');
  form.set('phone', '+16045559588');
  form.set('email', 'api-concurrent-checkout.e2e@golara.test');
  form.set('city', 'Vancouver');
  form.set('addressLine1', '888 Concurrent Checkout Way');
  form.set('deliveryDate', '2026-07-04');
  form.set('deliveryWindow', '12:00-14:00');
  form.set('customerNote', 'API concurrent checkout guard.');

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

function cloneFormData(source: FormData) {
  const form = new FormData();
  for (const [key, value] of source.entries()) form.set(key, value);
  return form;
}
