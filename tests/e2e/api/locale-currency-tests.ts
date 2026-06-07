import assert from 'node:assert/strict';
import { CART_COOKIE_NAME } from '@/lib/cart/cart-cookie';
import { CUSTOMER_SESSION_COOKIE_NAME } from '@/lib/customers/customer-session-cookie';
import { CookieJar, hashToken, request, type ApiFixture } from './shared';

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
  assert.match(html, /API E2E Locale Customer/);
  assert.match(html, /610 Locale Currency Lane/);
}
