import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CART_COOKIE_NAME } from '@/lib/cart/cart-cookie';
import { CUSTOMER_SESSION_COOKIE_NAME } from '@/lib/customers/customer-session-cookie';
import {
  appendServerActionFields,
  assertRedirect,
  CookieJar,
  createAdminCookieJar,
  expectHtml,
  extractServerActionName,
  request,
  responseText,
  submitServerAction,
  type ApiFixture
} from './shared';

export async function runAdminCatalogTranslationEdgeTests(fixture: ApiFixture) {
  const adminJar = createAdminCookieJar();
  await expectHtml('/admin/translations', 200, ['Translations', 'Homepage translations'], adminJar);

  const section = await fixture.prisma.homepageSection.findUniqueOrThrow({ where: { key: 'home.hero' } });
  const translation = await fixture.prisma.homepageSectionTranslation.upsert({
    where: { sectionId_locale: { sectionId: section.id, locale: 'en-CA' } },
    create: {
      sectionId: section.id,
      locale: 'en-CA',
      title: 'API E2E Homepage Translation',
      body: 'API E2E homepage translated body.',
      subtitle: 'API E2E translated eyebrow',
      payload: { primaryCtaLabel: 'API translated CTA', primaryCtaHref: '/products?locale=en-CA' },
      isPublished: true
    },
    update: {
      title: 'API E2E Homepage Translation',
      body: 'API E2E homepage translated body.',
      subtitle: 'API E2E translated eyebrow',
      payload: { primaryCtaLabel: 'API translated CTA', primaryCtaHref: '/products?locale=en-CA' },
      isPublished: true
    }
  });
  assert.equal(translation.title, 'API E2E Homepage Translation');
  assert.equal(translation.isPublished, true);
  await expectHtml('/admin/translations', 200, ['API E2E Homepage Translation'], adminJar);
}

export async function runAccountAddressBoundaryActionTests(fixture: ApiFixture) {
  const jar = new CookieJar();
  jar.set(CUSTOMER_SESSION_COOKIE_NAME, fixture.customerSessionToken);
  const address = await fixture.prisma.customerAddress.create({
    data: {
      customerId: fixture.customerId,
      label: 'API E2E Delete Boundary',
      recipient: 'API Boundary Recipient',
      phone: '+16045559077',
      city: 'Surrey',
      line1: '100 Boundary Lane',
      isDefault: false
    }
  });
  let html = await responseText(await request('/account/addresses', { headers: { cookie: jar.header() } }));

  const defaultForm = new FormData();
  appendServerActionFields(defaultForm, html, `name="addressId" value="${address.id}"`);
  defaultForm.set('addressId', address.id);
  const defaultResponse = await submitServerAction('/account/addresses', defaultForm, jar);
  assertRedirect(defaultResponse, '/account/addresses?status=default-updated');
  assert.equal((await fixture.prisma.customerAddress.findUniqueOrThrow({ where: { id: address.id } })).isDefault, true);

  html = await responseText(await request('/account/addresses', { headers: { cookie: jar.header() } }));
  const deleteForm = new FormData();
  appendServerActionFields(deleteForm, html, `name="addressId" value="${address.id}"`);
  deleteForm.set('addressId', address.id);
  const deleteResponse = await submitServerAction('/account/addresses', deleteForm, jar);
  assertRedirect(deleteResponse, '/account/addresses?status=deleted');
  assert.equal(await fixture.prisma.customerAddress.count({ where: { id: address.id } }), 0);
}

export async function runDirectProductCheckoutBoundaryTests(fixture: ApiFixture) {
  await expectHtml('/products/e2e-red-rose-bouquet', 200, ['API E2E Catalog Product Updated']);
  await fixture.prisma.productVariant.deleteMany({ where: { sku: 'API-E2E-DIRECT-INACTIVE' } });
  const inactiveVariant = await fixture.prisma.productVariant.create({
    data: {
      productId: fixture.productId,
      name: 'API E2E Inactive Direct Variant',
      sku: 'API-E2E-DIRECT-INACTIVE',
      priceCents: 9900,
      currency: 'CAD',
      stockQuantity: 5,
      trackInventory: true,
      isActive: false
    }
  });
  const html = await responseText(await request('/products/e2e-red-rose-bouquet'));
  assert.match(html, new RegExp(inactiveVariant.sku));

  const jar = new CookieJar();
  const actionName = extractServerActionName(html, 'name="variantId"');
  const inactiveAddForm = new FormData();
  inactiveAddForm.set(actionName, '');
  inactiveAddForm.set('productId', fixture.productId);
  inactiveAddForm.set('variantId', inactiveVariant.id);
  inactiveAddForm.set('returnTo', '/products/e2e-red-rose-bouquet');
  inactiveAddForm.set('currency', 'TOMAN');
  inactiveAddForm.set('quantity', '1');
  const inactiveAddResponse = await submitServerAction('/products/e2e-red-rose-bouquet', inactiveAddForm, jar);
  assertRedirect(inactiveAddResponse, '/products/e2e-red-rose-bouquet?cart=failed');
  assert.equal(jar.get(CART_COOKIE_NAME), undefined);
}

export async function runAdminOrderNotificationContractTests() {
  const actions = readFileSync('app/admin/order-actions.ts', 'utf8');
  const repository = readFileSync('lib/checkout/admin-order-notification-repository.ts', 'utf8');
  assert.match(actions, /export async function queueOrderNotificationAction/);
  assert.match(actions, /order\.notification\.queue/);
  assert.match(actions, /recordOrderNotificationAttemptAction/);
  assert.match(repository, /order_notification_queued/);
  assert.match(repository, /order_notification_retry_scheduled/);
}

export async function runAdminPaymentReadOnlyPageTests(fixture: ApiFixture) {
  const adminJar = createAdminCookieJar();
  const paths = [
    '/admin/payments/settlement',
    '/admin/payments/alerts',
    '/admin/payments/operations',
    '/admin/payments/operations/providers',
    '/admin/payments/operations/history',
    '/admin/payments/operations/preview'
  ];
  for (const path of paths) {
    const response = await request(path, { headers: { cookie: adminJar.header() } });
    assert.equal(response.status, 200, `${path} should render`);
    const html = await responseText(response);
    assert.match(html, /Payment|Settlement|provider|operation|alerts/i, `${path} should include payment content`);
  }
  assert.ok(fixture.orderNumber);
}

export async function runSeedImageRouteTests() {
  for (const path of [
    '/seed-images/real-photo/standard-bouquet',
    '/seed-images/category-real/birthday',
    '/seed-images/catalog/autumn-design-2',
    '/seed-images/category/birthday'
  ]) {
    const response = await request(path);
    assert.equal([200, 307, 308].includes(response.status), true, `${path} should resolve`);
  }
}
