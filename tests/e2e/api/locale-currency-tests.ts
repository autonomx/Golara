import assert from 'node:assert/strict';
import { CART_COOKIE_NAME } from '@/lib/cart/cart-cookie';
import { CUSTOMER_SESSION_COOKIE_NAME } from '@/lib/customers/customer-session-cookie';
import {
  CookieJar,
  appendServerActionFields,
  assertRedirect,
  hashToken,
  request,
  responseText,
  submitServerAction,
  type ApiFixture
} from './shared';

export async function runLocaleCurrencyMatrixTests(fixture: ApiFixture) {
  const customer = await fixture.prisma.customerProfile.create({
    data: {
      phone: '+16045559610',
      displayName: 'API E2E Locale Customer',
      email: 'api-locale-customer.e2e@golara.test',
      locale: 'en-CA',
      addresses: {
        create: {
          label: 'API E2E Locale Address',
          recipient: 'API E2E Locale Customer',
          phone: '+16045559610',
          city: 'Vancouver',
          line1: '610 Locale Currency Lane',
          isDefault: true
        }
      }
    }
  });
  const sessionToken = 'api-e2e-locale-customer-session-token';
  await fixture.prisma.customerSession.create({
    data: {
      customerId: customer.id,
      tokenHash: hashToken(sessionToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });
  const cart = await fixture.prisma.cartSession.create({
    data: {
      token: 'api-e2e-locale-currency-cart',
      locale: 'en-CA',
      currency: 'CAD',
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      items: {
        create: {
          productId: fixture.productId,
          variantId: fixture.variantId,
          lineKey: fixture.variantId,
          quantity: 1
        }
      }
    }
  });

  const jar = new CookieJar();
  jar.set(CART_COOKIE_NAME, cart.token);
  jar.set(CUSTOMER_SESSION_COOKIE_NAME, sessionToken);
  const response = await request('/cart/checkout', { headers: { cookie: jar.header() } });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Delivery and payment/);
  assert.match(html, /Recipient details/);
  assert.match(html, /Order summary/);
  assert.match(html, /\$1,250\.00/);
  assert.match(html, /API E2E Locale Customer/);
  assert.match(html, /610 Locale Currency Lane/);

  const note = 'API E2E CAD checkout order.';
  const checkoutForm = new FormData();
  appendServerActionFields(checkoutForm, html, 'name="addressLine1"');
  checkoutForm.set('name', 'API E2E Locale Customer');
  checkoutForm.set('phone', '+16045559610');
  checkoutForm.set('email', 'api-locale-customer.e2e@golara.test');
  checkoutForm.set('city', 'Vancouver');
  checkoutForm.set('addressLine1', '610 Locale Currency Lane');
  checkoutForm.set('deliveryDate', '2026-07-05');
  checkoutForm.set('deliveryWindow', '10:00-12:00');
  checkoutForm.set('customerNote', note);
  const checkoutResponse = await submitServerAction('/cart/checkout', checkoutForm, jar);
  assertRedirect(checkoutResponse, '/orders/');

  const order = await fixture.prisma.checkoutOrder.findFirstOrThrow({
    where: { customerNote: note },
    include: { items: true, paymentAttempts: true }
  });
  assert.equal(order.customerId, customer.id);
  assert.equal(order.currency, 'CAD');
  assert.equal(order.totalCents, 125000);
  assert.equal(order.items.length, 1);
  assert.equal(order.paymentAttempts[0]?.currency, 'CAD');
  assert.equal(order.paymentAttempts[0]?.amountCents, 125000);
  assert.equal((await fixture.prisma.cartSession.findUniqueOrThrow({ where: { id: cart.id } })).status, 'checked_out');

  const ordersHtml = await responseText(await request('/account/orders', { headers: { cookie: jar.header() } }));
  assert.match(ordersHtml, new RegExp(order.orderNumber));
  assert.match(ordersHtml, /\$1,250\.00/);
  assert.match(ordersHtml, /pending payment/);
}
