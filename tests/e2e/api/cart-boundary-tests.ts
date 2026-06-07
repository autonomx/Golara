import assert from 'node:assert/strict';
import { CART_COOKIE_NAME } from '@/lib/cart/cart-cookie';
import {
  CookieJar,
  extractServerActionName,
  request,
  responseText,
  submitServerAction,
  type ApiFixture
} from './shared';

export async function runCartBoundaryTests(fixture: ApiFixture) {
  await runQuantityZeroRemovesLineTest(fixture);
  await runRemoveSingleLineItemTest(fixture);
  await runUnknownCartTokenRendersEmptyCartTest();
  await runInactiveProductLineIsPrunedTest(fixture);
  await runMultipleVariantsPreserveDistinctLineKeysTest(fixture);
}

async function runQuantityZeroRemovesLineTest(fixture: ApiFixture) {
  const cart = await createCart(fixture, 'api-e2e-zero-quantity-cart', [
    { lineKey: fixture.variantId, variantId: fixture.variantId, quantity: 2 }
  ]);
  const jar = cartJar(cart.token);
  const cartHtml = await responseText(await request('/cart', { headers: { cookie: jar.header() } }));
  const actionName = extractServerActionName(cartHtml, `name="lineKey" value="${fixture.variantId}"`);

  const form = new FormData();
  form.set(actionName, '');
  form.set('lineKey', fixture.variantId);
  form.set('returnTo', '/cart');
  form.set('quantity', '0');
  const response = await submitServerAction('/cart', form, jar);

  assertRedirectLocation(response, '/cart?cart=updated');
  assert.equal(await fixture.prisma.cartItem.count({ where: { cartId: cart.id } }), 0);

  const emptyHtml = await responseText(await request('/cart', { headers: { cookie: jar.header() } }));
  assert.doesNotMatch(emptyHtml, /E2E Red Rose Bouquet/);
  assert.match(emptyHtml, /href="\/products"/);
}

async function runRemoveSingleLineItemTest(fixture: ApiFixture) {
  const secondVariant = await createVariant(fixture, {
    name: 'API Boundary Removable',
    sku: 'E2E-ROSE-001-BOUNDARY-REMOVE',
    sortOrder: 20
  });
  const cart = await createCart(fixture, 'api-e2e-remove-line-cart', [
    { lineKey: fixture.variantId, variantId: fixture.variantId, quantity: 1 },
    { lineKey: secondVariant.id, variantId: secondVariant.id, quantity: 1 }
  ]);
  const jar = cartJar(cart.token);
  const cartHtml = await responseText(await request('/cart', { headers: { cookie: jar.header() } }));
  const actionName = extractServerActionName(cartHtml, `name="lineKey" value="${secondVariant.id}"`, 'last');

  const form = new FormData();
  form.set(actionName, '');
  form.set('lineKey', secondVariant.id);
  form.set('returnTo', '/cart');
  const response = await submitServerAction('/cart', form, jar);

  assertRedirectLocation(response, '/cart?cart=removed');
  const remainingItems = await fixture.prisma.cartItem.findMany({ where: { cartId: cart.id }, orderBy: { createdAt: 'asc' } });
  assert.equal(remainingItems.length, 1);
  assert.equal(remainingItems[0]?.lineKey, fixture.variantId);
}

async function runUnknownCartTokenRendersEmptyCartTest() {
  const jar = cartJar('api-e2e-unknown-cart-token');
  const response = await request('/cart', { headers: { cookie: jar.header() } });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.doesNotMatch(html, /E2E Red Rose Bouquet/);
  assert.match(html, /href="\/products"/);
}

async function runInactiveProductLineIsPrunedTest(fixture: ApiFixture) {
  const cart = await createCart(fixture, 'api-e2e-inactive-line-cart', [
    { lineKey: fixture.variantId, variantId: fixture.variantId, quantity: 1 }
  ]);
  const jar = cartJar(cart.token);

  await fixture.prisma.product.update({ where: { id: fixture.productId }, data: { isActive: false } });
  try {
    const response = await request('/cart', { headers: { cookie: jar.header() } });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.doesNotMatch(html, /E2E Red Rose Bouquet/);
    assert.equal(await fixture.prisma.cartItem.count({ where: { cartId: cart.id } }), 0);
  } finally {
    await fixture.prisma.product.update({ where: { id: fixture.productId }, data: { isActive: true } });
  }
}

async function runMultipleVariantsPreserveDistinctLineKeysTest(fixture: ApiFixture) {
  const secondVariant = await createVariant(fixture, {
    name: 'API Boundary Deluxe',
    sku: 'E2E-ROSE-001-BOUNDARY-KEYS',
    sortOrder: 30
  });
  const cart = await createCart(fixture, 'api-e2e-distinct-variant-line-cart', [
    { lineKey: fixture.variantId, variantId: fixture.variantId, quantity: 1 },
    { lineKey: secondVariant.id, variantId: secondVariant.id, quantity: 2 }
  ]);
  const jar = cartJar(cart.token);

  const response = await request('/cart', { headers: { cookie: jar.header() } });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Standard \/ E2E-ROSE-001-STANDARD/);
  assert.match(html, /API Boundary Deluxe \/ E2E-ROSE-001-BOUNDARY-KEYS/);

  const lines = await fixture.prisma.cartItem.findMany({ where: { cartId: cart.id }, orderBy: { createdAt: 'asc' } });
  assert.deepEqual(lines.map((line) => line.lineKey), [fixture.variantId, secondVariant.id]);
}

function cartJar(token: string) {
  const jar = new CookieJar();
  jar.set(CART_COOKIE_NAME, token);
  return jar;
}

async function createCart(
  fixture: ApiFixture,
  token: string,
  items: Array<{ lineKey: string; variantId: string; quantity: number }>
) {
  return fixture.prisma.cartSession.create({
    data: {
      token,
      locale: 'fa-IR',
      currency: 'TOMAN',
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      items: {
        create: items.map((item) => ({
          productId: fixture.productId,
          variantId: item.variantId,
          lineKey: item.lineKey,
          quantity: item.quantity
        }))
      }
    }
  });
}

async function createVariant(
  fixture: ApiFixture,
  input: { name: string; sku: string; sortOrder: number }
) {
  return fixture.prisma.productVariant.create({
    data: {
      productId: fixture.productId,
      sku: input.sku,
      name: input.name,
      priceCents: 125000,
      currency: 'TOMAN',
      imageUrl: '/seed-images/photo-real/standard-bouquet.jpg',
      stockQuantity: 12,
      trackInventory: true,
      lowStockThreshold: 3,
      isActive: true,
      sortOrder: input.sortOrder
    }
  });
}

function assertRedirectLocation(response: Response, expectedLocation: string) {
  assert.equal([302, 303, 307, 308].includes(response.status), true);
  assert.equal(response.headers.get('location'), expectedLocation);
}
