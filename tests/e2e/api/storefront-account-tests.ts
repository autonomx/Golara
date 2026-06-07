import assert from 'node:assert/strict';
import { ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-auth-core';
import { CART_COOKIE_NAME } from '@/lib/cart/cart-cookie';
import { CUSTOMER_SESSION_COOKIE_NAME } from '@/lib/customers/customer-session-cookie';
import {
  ADMIN_PASSWORD,
  CookieJar,
  appendServerActionFields,
  assertRedirect,
  createAdminCookieJar,
  expectHtml,
  expectText,
  extractServerActionName,
  hashToken,
  recoverOtpCode,
  request,
  responseText,
  submitServerAction,
  type ApiFixture
} from './shared';

export async function runPublicReadRouteTests() {
  await expectHtml('/', 200, ['Golara']);
  await expectHtml('/products', 200, ['E2E Red Rose Bouquet']);
  await expectHtml('/products/e2e-red-rose-bouquet', 200, ['E2E Red Rose Bouquet']);
  await expectHtml('/categories', 200, ['E2E Roses']);
  await expectHtml('/categories/e2e-roses', 200, ['E2E Red Rose Bouquet']);
  await expectHtml('/account/login', 200, ['phone']);
  await expectText('/sitemap.xml', 200, ['<urlset']);
  await expectText('/robots.txt', 200, ['User-agent']);
}

export async function runCartAndCheckoutPageTests(fixture: ApiFixture) {
  const jar = new CookieJar();
  jar.set(CART_COOKIE_NAME, fixture.cartToken);
  await expectHtml('/cart', 200, ['E2E Red Rose Bouquet', '2500.00 TOMAN'], jar);
  await expectHtml('/cart/checkout', 200, ['E2E Red Rose Bouquet', 'name', 'address'], jar);
  await expectHtml('/cart?cart=added', 200, ['Item added to your cart.'], jar);
}

export async function runAccountAndAdminPageTests(fixture: ApiFixture) {
  const accountRedirect = await request('/account/orders', { redirect: 'manual' });
  assertRedirect(accountRedirect, '/account?status=session-required');

  const customerJar = new CookieJar();
  customerJar.set(CUSTOMER_SESSION_COOKIE_NAME, fixture.customerSessionToken);
  await expectHtml('/account/orders', 200, [fixture.orderNumber, 'pending payment'], customerJar);

  await expectHtml('/admin/orders', 200, ['Sign in']);

  const adminJar = createAdminCookieJar();
  await expectHtml('/admin', 200, ['Admin'], adminJar);
  await expectHtml('/admin/orders', 200, [fixture.orderNumber], adminJar);
  const order = await fixture.prisma.checkoutOrder.findUniqueOrThrow({ where: { orderNumber: fixture.orderNumber } });
  await expectHtml(`/admin/orders/${order.id}`, 200, [fixture.orderNumber, 'E2E Red Rose Bouquet'], adminJar);
}

export async function runServerActionMutationTests(fixture: ApiFixture) {
  await runCartServerActionTests(fixture);
  await runAccountProfileServerActionTests(fixture);
  await runAdminLoginServerActionTests();
}

export async function runCheckoutAndAddressBookActionTests(fixture: ApiFixture) {
  await runCartCheckoutServerActionTests(fixture);
  await runAddressBookServerActionTests(fixture);
}

async function runCartCheckoutServerActionTests(fixture: ApiFixture) {
  const checkoutCart = await fixture.prisma.cartSession.create({
    data: {
      token: 'api-e2e-checkout-cart-token',
      locale: 'fa-IR',
      currency: 'TOMAN',
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      items: { create: { productId: fixture.productId, variantId: fixture.variantId, lineKey: fixture.variantId, quantity: 1 } }
    }
  });

  const jar = new CookieJar();
  jar.set(CART_COOKIE_NAME, checkoutCart.token);
  jar.set(CUSTOMER_SESSION_COOKIE_NAME, fixture.customerSessionToken);
  const checkoutHtml = await responseText(await request('/cart/checkout', { headers: { cookie: jar.header() } }));
  const form = new FormData();
  appendServerActionFields(form, checkoutHtml, 'name="addressLine1"');
  form.set('name', 'API Checkout Recipient');
  form.set('phone', '+16045559077');
  form.set('email', 'api-checkout-recipient.e2e@golara.test');
  form.set('city', 'Vancouver');
  form.set('addressLine1', '123 API Checkout Lane');
  form.set('addressLine2', 'Unit E2E');
  form.set('deliveryDate', '2026-07-01');
  form.set('deliveryWindow', '10:00-12:00');
  form.set('deliveryNotes', 'Leave with concierge.');
  form.set('customerNote', 'API checkout action order.');
  const response = await submitServerAction('/cart/checkout', form, jar);
  assert.equal([302, 303, 307, 308].includes(response.status), true);
  assert.match(response.headers.get('location') ?? '', /^\/orders\/[^/?#]+$/);

  const checkoutOrder = await fixture.prisma.checkoutOrder.findFirstOrThrow({
    where: { customerNote: 'API checkout action order.' },
    include: { items: true, paymentAttempts: true }
  });
  assert.equal(checkoutOrder.recipientName, 'API Checkout Recipient');
  assert.equal(checkoutOrder.status, 'pending_payment');
  assert.equal(checkoutOrder.items.length, 1);
  assert.equal(checkoutOrder.paymentAttempts[0]?.provider, 'manual');
  assert.equal(checkoutOrder.paymentAttempts[0]?.status, 'manual_pending');
  assert.equal(await fixture.prisma.cartItem.count({ where: { cartId: checkoutCart.id } }), 0);
}

async function runAddressBookServerActionTests(fixture: ApiFixture) {
  const jar = new CookieJar();
  jar.set(CUSTOMER_SESSION_COOKIE_NAME, fixture.customerSessionToken);
  const addressHtml = await responseText(await request('/account/addresses', { headers: { cookie: jar.header() } }));

  const addForm = new FormData();
  appendServerActionFields(addForm, addressHtml, 'name="label"');
  addForm.set('label', 'API E2E Address');
  addForm.set('recipient', 'API Address Recipient');
  addForm.set('phone', '+16045559088');
  addForm.set('city', 'Burnaby');
  addForm.set('line1', '456 API Address Road');
  addForm.set('line2', 'Suite 8');
  addForm.set('notes', 'Added through API E2E.');
  addForm.set('isDefault', 'on');
  const addResponse = await submitServerAction('/account/addresses', addForm, jar);
  assertRedirect(addResponse, '/account/addresses?status=added');

  const addedAddress = await fixture.prisma.customerAddress.findFirstOrThrow({ where: { customerId: fixture.customerId, label: 'API E2E Address' } });
  assert.equal(addedAddress.isDefault, true);

  const updatedHtml = await responseText(await request('/account/addresses', { headers: { cookie: jar.header() } }));
  const updateForm = new FormData();
  appendServerActionFields(updateForm, updatedHtml, `name="addressId" value="${addedAddress.id}"`, 'last');
  updateForm.set('addressId', addedAddress.id);
  updateForm.set('label', 'API E2E Address Updated');
  updateForm.set('recipient', 'API Address Recipient Updated');
  updateForm.set('phone', '+16045559089');
  updateForm.set('city', 'Richmond');
  updateForm.set('line1', '789 API Address Crescent');
  updateForm.set('line2', 'Floor 2');
  updateForm.set('notes', 'Updated through API E2E.');
  const updateResponse = await submitServerAction('/account/addresses', updateForm, jar);
  assertRedirect(updateResponse, '/account/addresses?status=updated');

  const updatedAddress = await fixture.prisma.customerAddress.findUniqueOrThrow({ where: { id: addedAddress.id } });
  assert.equal(updatedAddress.label, 'API E2E Address Updated');
  assert.equal(updatedAddress.city, 'Richmond');
}

async function runCartServerActionTests(fixture: ApiFixture) {
  const jar = new CookieJar();
  const productPath = '/products/e2e-red-rose-bouquet';
  const productHtml = await responseText(await request(productPath));
  const addActionName = extractServerActionName(productHtml, 'name="variantId"');

  const addForm = new FormData();
  addForm.set(addActionName, '');
  addForm.set('productId', fixture.productId);
  addForm.set('variantId', fixture.variantId);
  addForm.set('returnTo', productPath);
  addForm.set('currency', 'TOMAN');
  addForm.set('quantity', '3');
  const addResponse = await submitServerAction(productPath, addForm, jar);
  assertRedirect(addResponse, `${productPath}?cart=added`);
  assert.ok(jar.get(CART_COOKIE_NAME), 'add-to-cart action should set a cart cookie');

  const cartAfterAdd = await fixture.prisma.cartSession.findUniqueOrThrow({ where: { token: jar.get(CART_COOKIE_NAME) }, include: { items: true } });
  assert.equal(cartAfterAdd.items.length, 1);
  assert.equal(cartAfterAdd.items[0]?.quantity, 3);

  const cartHtml = await responseText(await request('/cart', { headers: { cookie: jar.header() } }));
  const lineKey = cartAfterAdd.items[0]?.lineKey ?? '';
  const updateActionName = extractServerActionName(cartHtml, `name="lineKey" value="${lineKey}"`);
  const updateForm = new FormData();
  updateForm.set(updateActionName, '');
  updateForm.set('lineKey', lineKey);
  updateForm.set('returnTo', '/cart');
  updateForm.set('quantity', '4');
  const updateResponse = await submitServerAction('/cart', updateForm, jar);
  assertRedirect(updateResponse, '/cart?cart=updated');

  const itemAfterUpdate = await fixture.prisma.cartItem.findUniqueOrThrow({ where: { cartId_lineKey: { cartId: cartAfterAdd.id, lineKey } } });
  assert.equal(itemAfterUpdate.quantity, 4);

  const cartHtmlAfterUpdate = await responseText(await request('/cart', { headers: { cookie: jar.header() } }));
  const clearActionName = extractServerActionName(cartHtmlAfterUpdate, 'name="returnTo" value="/cart"', 'last');
  const clearForm = new FormData();
  clearForm.set(clearActionName, '');
  clearForm.set('returnTo', '/cart');
  const clearResponse = await submitServerAction('/cart', clearForm, jar);
  assertRedirect(clearResponse, '/cart?cart=cleared');
  assert.equal(await fixture.prisma.cartItem.count({ where: { cartId: cartAfterAdd.id } }), 0);
}

async function runAccountProfileServerActionTests(fixture: ApiFixture) {
  const jar = new CookieJar();
  jar.set(CUSTOMER_SESSION_COOKIE_NAME, fixture.customerSessionToken);
  const profileHtml = await responseText(await request('/account/profile', { headers: { cookie: jar.header() } }));
  const actionName = extractServerActionName(profileHtml, 'name="displayName"');

  const form = new FormData();
  form.set(actionName, '');
  form.set('displayName', 'API E2E Updated Customer');
  form.set('email', 'api-updated-customer.e2e@golara.test');
  form.set('locale', 'en-CA');
  const response = await submitServerAction('/account/profile', form, jar);
  assertRedirect(response, '/account/profile?status=updated');

  const customer = await fixture.prisma.customerProfile.findUniqueOrThrow({ where: { id: fixture.customerId } });
  assert.equal(customer.displayName, 'API E2E Updated Customer');
  assert.equal(customer.email, 'api-updated-customer.e2e@golara.test');
  assert.equal(customer.locale, 'en-CA');
}

async function runAdminLoginServerActionTests() {
  const jar = new CookieJar();
  const loginHtml = await responseText(await request('/admin/login'));
  const actionName = extractServerActionName(loginHtml, 'name="password"');

  const invalidForm = new FormData();
  invalidForm.set(actionName, '');
  invalidForm.set('password', 'wrong-password');
  const invalid = await submitServerAction('/admin/login', invalidForm, jar);
  assertRedirect(invalid, '/admin/login?error=');

  const validForm = new FormData();
  validForm.set(actionName, '');
  validForm.set('password', ADMIN_PASSWORD);
  const valid = await submitServerAction('/admin/login', validForm, jar);
  assertRedirect(valid, '/admin');
  assert.ok(jar.get(ADMIN_SESSION_COOKIE_NAME), 'admin login action should set an admin session cookie');
}

export async function runCustomerAuthAndInquiryActionTests(fixture: ApiFixture) {
  const loginJar = new CookieJar();
  const phone = '+16045559333';
  const loginHtml = await responseText(await request('/account/login?returnTo=/account'));
  const requestOtpForm = new FormData();
  appendServerActionFields(requestOtpForm, loginHtml, 'name="phone"');
  requestOtpForm.set('phone', phone);
  requestOtpForm.set('returnTo', '/account');
  const requestOtpResponse = await submitServerAction('/account/login', requestOtpForm, loginJar);
  assert.match(requestOtpResponse.headers.get('location') ?? '', /\/account\/login\?status=code-sent/);

  const challenge = await fixture.prisma.customerOtpChallenge.findFirstOrThrow({ where: { destination: phone, purpose: 'login', consumedAt: null }, orderBy: { createdAt: 'desc' } });
  assert.equal(challenge.attemptCount, 0);

  const verifyHtml = await responseText(await request(`/account/login?status=code-sent&phone=${encodeURIComponent(phone)}&returnTo=/account`));
  const verifyForm = new FormData();
  appendServerActionFields(verifyForm, verifyHtml, 'name="code"');
  verifyForm.set('phone', phone);
  verifyForm.set('code', recoverOtpCode(challenge.destination, challenge.codeHash, challenge.purpose));
  verifyForm.set('returnTo', '/account');
  const verifyResponse = await submitServerAction('/account/login', verifyForm, loginJar);
  assertRedirect(verifyResponse, '/account');
  assert.ok(loginJar.get(CUSTOMER_SESSION_COOKIE_NAME), 'customer OTP verification should set a customer session cookie');

  const consumedChallenge = await fixture.prisma.customerOtpChallenge.findUniqueOrThrow({ where: { id: challenge.id } });
  assert.ok(consumedChallenge.consumedAt, 'verified OTP challenge should be consumed');
  assert.equal(await fixture.prisma.customerAuthEvent.count({ where: { eventType: 'otp_request_allowed' } }), 1);
  assert.equal(await fixture.prisma.customerAuthEvent.count({ where: { eventType: 'otp_verify_success', challengeId: challenge.id } }), 1);

  await expectHtml('/account', 200, [phone], loginJar);
  const accountHtml = await responseText(await request('/account', { headers: { cookie: loginJar.header() } }));
  const logoutForm = new FormData();
  appendServerActionFields(logoutForm, accountHtml, '$ACTION_', 'last');
  const logoutResponse = await submitServerAction('/account', logoutForm, loginJar);
  assertRedirect(logoutResponse, '/account?status=signed-out');

  const sessionToken = loginJar.get(CUSTOMER_SESSION_COOKIE_NAME);
  if (sessionToken) {
    const session = await fixture.prisma.customerSession.findUnique({ where: { tokenHash: hashToken(sessionToken) } });
    assert.ok(!session || session.revokedAt, 'customer logout should revoke the active session');
  }

  const productPath = '/products/e2e-red-rose-bouquet';
  const productHtml = await responseText(await request(productPath));
  const inquiryForm = new FormData();
  appendServerActionFields(inquiryForm, productHtml, 'I am interested in E2E Red Rose Bouquet.');
  inquiryForm.set('name', 'API E2E Inquiry Customer');
  inquiryForm.set('phone', '+16045559344');
  inquiryForm.set('email', 'api-inquiry.e2e@golara.test');
  inquiryForm.set('message', 'API E2E inquiry for a delivery arrangement.');
  inquiryForm.set('deliveryDate', '2026-07-02');
  inquiryForm.set('deliveryNotes', 'API E2E inquiry delivery notes.');
  const inquiryResponse = await submitServerAction(productPath, inquiryForm, new CookieJar());
  assertRedirect(inquiryResponse, `${productPath}?inquiry=sent`);

  const inquiry = await fixture.prisma.customerInquiry.findFirstOrThrow({ where: { phone: '+16045559344', productId: fixture.productId } });
  assert.equal(inquiry.name, 'API E2E Inquiry Customer');
  assert.equal(inquiry.status, 'new');
  assert.equal(inquiry.message, 'API E2E inquiry for a delivery arrangement.');
}

export async function runAdminProtectedRouteAndActionTests(fixture: ApiFixture) {
  const unauthenticatedProductsExport = await request('/admin/products/export');
  assert.equal(unauthenticatedProductsExport.status, 401, 'products export should reject anonymous users');

  const unauthenticatedOrdersCsv = await request('/admin/orders/csv');
  assert.equal(unauthenticatedOrdersCsv.status, 401, 'orders CSV should reject anonymous users');

  const adminJar = createAdminCookieJar();
  await expectText('/admin/products/export', 200, ['"title","slug","code"', 'E2E Red Rose Bouquet'], adminJar);
  await expectText('/admin/orders/csv', 200, ['"Created","Order","Customer"', fixture.orderNumber], adminJar);

  const order = await fixture.prisma.checkoutOrder.findUniqueOrThrow({ where: { orderNumber: fixture.orderNumber }, include: { paymentAttempts: true } });
  const detailPath = `/admin/orders/${order.id}`;
  const detailHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const form = new FormData();
  appendServerActionFields(form, detailHtml, 'name="providerReference"');
  form.set('amountCents', '250000');
  form.set('providerReference', 'api-e2e-manual-receipt-1001');
  form.set('note', 'API E2E manual payment receipt');
  const response = await submitServerAction(detailPath, form, adminJar);
  assertRedirect(response, `${detailPath}?status=manual-payment-marked`);

  const manualAttempt = await fixture.prisma.checkoutPaymentAttempt.findFirstOrThrow({ where: { orderId: order.id, provider: 'manual', providerReference: 'api-e2e-manual-receipt-1001' } });
  assert.equal(manualAttempt.status, 'paid');
  assert.equal(manualAttempt.amountCents, 250000);
  assert.equal(await fixture.prisma.adminAuditLog.count({ where: { action: 'order.payment.manual.mark_paid', entityId: order.id } }), 1);
  assert.equal(await fixture.prisma.checkoutOrderTimelineEvent.count({ where: { orderId: order.id, type: 'payment_status_changed' } }), 1);
}
