import assert from 'node:assert/strict';
import { createHmac, createHash } from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import {
  ADMIN_SESSION_COOKIE_NAME,
  createAdminSessionCookieValue,
  getAdminAuthConfig
} from '@/lib/admin-auth-core';
import { CART_COOKIE_NAME } from '@/lib/cart/cart-cookie';
import { CUSTOMER_SESSION_COOKIE_NAME } from '@/lib/customers/customer-session-cookie';
import {
  createLifecycleCategory,
  createLifecycleChannel,
  createLifecycleProductType,
  createLifecycleProductWithVariantAndStock
} from '@/tests/e2e/lifecycle/fixtures/catalog-fixtures';
import { createLifecycleCustomer } from '@/tests/e2e/lifecycle/fixtures/customer-fixtures';
import {
  assertSafeLifecycleDatabaseUrl,
  createLifecyclePrismaClient,
  getLifecycleTestDbConfig,
  resetLifecycleDatabase
} from '@/tests/e2e/lifecycle/test-db';

const PORT = Number.parseInt(process.env.API_E2E_PORT || '3100', 10);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const READY_TIMEOUT_MS = Number.parseInt(process.env.API_E2E_READY_TIMEOUT_MS || '45000', 10);
const WEBHOOK_SECRET = 'golara-api-e2e-webhook-secret';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'golara-admin-local';
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'golara-local-session-secret-change-before-production-2026';
const CUSTOMER_OTP_SECRET = 'golara-api-e2e-otp-secret';
const CUSTOMER_OTP_LENGTH = 4;

type ApiFixture = {
  prisma: PrismaClient;
  cartToken: string;
  customerSessionToken: string;
  customerId: string;
  orderNumber: string;
  productId: string;
  variantId: string;
  publicLookupToken: string;
  stripeProviderReference: string;
};

class CookieJar {
  private cookies = new Map<string, string>();

  set(name: string, value: string) {
    this.cookies.set(name, value);
  }

  get(name: string) {
    return this.cookies.get(name);
  }

  capture(response: Response) {
    const setCookie = response.headers.get('set-cookie');
    if (!setCookie) return;
    for (const cookie of setCookie.split(/,(?=[^;,]+=)/)) {
      const [pair] = cookie.trim().split(';');
      const separator = pair.indexOf('=');
      if (separator > 0) this.cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
  }

  header() {
    return [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; ');
  }
}

async function main() {
  assert.equal(getLifecycleTestDbConfig({}).shouldRun, false);
  const config = getLifecycleTestDbConfig();
  if (!config.shouldRun) {
    console.log(config.reason);
    return;
  }

  assertSafeLifecycleDatabaseUrl(config.databaseUrl, process.env.DATABASE_URL);
  const prisma = createLifecyclePrismaClient(config.databaseUrl);
  let server: ChildProcess | undefined;

  try {
    const fixture = await prepareApiFixture(prisma);
    server = await startNextServer(config.databaseUrl);

    await runPublicReadRouteTests();
    await runCartAndCheckoutPageTests(fixture);
    await runAccountAndAdminPageTests(fixture);
    await runServerActionMutationTests(fixture);
    await runCustomerAuthAndInquiryActionTests(fixture);
    await runCheckoutAndAddressBookActionTests(fixture);
    await runAdminProtectedRouteAndActionTests(fixture);
    await runAdminSettingsContentActionTests(fixture);
    await runAdminHomepageContentActionTests(fixture);
    await runAdminMediaLibraryActionTests(fixture);
    await runAdminProductCatalogActionTests(fixture);
    await runAdminOrderOperationsActionTests(fixture);
    await runOrderReturnRouteTests(fixture);
    await runWebhookRouteTests(fixture);

    console.log('api lifecycle HTTP E2E tests passed');
  } finally {
    await stopNextServer(server);
    await prisma.$disconnect();
  }
}

async function prepareApiFixture(prisma: PrismaClient): Promise<ApiFixture> {
  await prisma.$connect();
  await resetLifecycleDatabase(prisma);
  await ensureApiRouteSupportTables(prisma);
  await createLifecycleChannel(prisma);
  const category = await createLifecycleCategory(prisma);
  const productType = await createLifecycleProductType(prisma);
  const catalog = await createLifecycleProductWithVariantAndStock(prisma, {
    categoryId: category.id,
    productTypeId: productType.id
  });
  const customer = await createLifecycleCustomer(prisma);

  const cart = await prisma.cartSession.create({
    data: {
      token: 'api-e2e-cart-token',
      locale: 'fa-IR',
      currency: 'TOMAN',
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      items: {
        create: {
          productId: catalog.product.id,
          variantId: catalog.variant.id,
          lineKey: catalog.variant.id,
          quantity: 2
        }
      }
    }
  });

  const order = await prisma.checkoutOrder.create({
    data: {
      orderNumber: 'API-E2E-1001',
      publicLookupToken: 'api-e2e-order-token',
      customerId: customer.customer.id,
      addressId: customer.address.id,
      status: 'pending_payment',
      checkoutMode: 'cart',
      currency: 'TOMAN',
      subtotalCents: 250000,
      totalCents: 250000,
      recipientName: customer.customer.displayName,
      recipientPhone: customer.customer.phone,
      items: {
        create: {
          productId: catalog.product.id,
          variantId: catalog.variant.id,
          variantSku: catalog.variant.sku,
          variantName: catalog.variant.name,
          productTitle: catalog.product.title,
          productCode: catalog.product.code,
          quantity: 2,
          unitPriceCents: catalog.variant.priceCents,
          lineTotalCents: 250000
        }
      },
      paymentAttempts: {
        create: {
          provider: 'stripe',
          status: 'created',
          amountCents: 250000,
          currency: 'TOMAN',
          providerReference: 'cs_api_e2e_1001'
        }
      }
    }
  });

  const customerSessionToken = 'api-e2e-customer-session-token';
  await prisma.customerSession.create({
    data: {
      customerId: customer.customer.id,
      tokenHash: hashToken(customerSessionToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  return {
    prisma,
    cartToken: cart.token,
    customerSessionToken,
    customerId: customer.customer.id,
    orderNumber: order.orderNumber,
    productId: catalog.product.id,
    variantId: catalog.variant.id,
    publicLookupToken: order.publicLookupToken ?? '',
    stripeProviderReference: 'cs_api_e2e_1001'
  };
}

async function ensureApiRouteSupportTables(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CheckoutOrderNotificationAction" (
      "id" TEXT NOT NULL,
      "orderId" TEXT NOT NULL,
      "channel" TEXT NOT NULL,
      "templateKey" TEXT NOT NULL,
      "recipient" TEXT NOT NULL,
      "subject" TEXT,
      "body" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'queued',
      "attemptCount" INTEGER NOT NULL DEFAULT 0,
      "maxAttempts" INTEGER NOT NULL DEFAULT 3,
      "lastAttemptAt" TIMESTAMP(3),
      "nextRetryAt" TIMESTAMP(3),
      "deliveredAt" TIMESTAMP(3),
      "failedAt" TIMESTAMP(3),
      "errorCode" TEXT,
      "errorMessage" TEXT,
      "actorLabel" TEXT,
      "actorRole" TEXT,
      "metadata" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CheckoutOrderNotificationAction_pkey" PRIMARY KEY ("id")
    );
  `);
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CheckoutOrderNotificationAction_orderId_fkey'
      ) THEN
        ALTER TABLE "CheckoutOrderNotificationAction"
          ADD CONSTRAINT "CheckoutOrderNotificationAction_orderId_fkey"
          FOREIGN KEY ("orderId") REFERENCES "CheckoutOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CheckoutOrderNotificationAction_orderId_createdAt_idx"
    ON "CheckoutOrderNotificationAction"("orderId", "createdAt");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CheckoutOrderNotificationAction_status_nextRetryAt_idx"
    ON "CheckoutOrderNotificationAction"("status", "nextRetryAt");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CheckoutOrderNotificationAction_channel_status_idx"
    ON "CheckoutOrderNotificationAction"("channel", "status");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "StoreSetting" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "key" TEXT NOT NULL DEFAULT 'primary',
      "storeName" TEXT NOT NULL DEFAULT 'Golara',
      "legalName" TEXT,
      "supportEmail" TEXT,
      "supportPhone" TEXT,
      "defaultLocale" TEXT NOT NULL DEFAULT 'fa-IR',
      "defaultCurrency" TEXT NOT NULL DEFAULT 'TOMAN',
      "timezone" TEXT NOT NULL DEFAULT 'America/Vancouver',
      "storefrontBaseUrl" TEXT,
      "isMaintenanceMode" BOOLEAN NOT NULL DEFAULT false,
      "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "StoreSetting_key_key" ON "StoreSetting" ("key");');
  await prisma.$executeRawUnsafe(`
    INSERT INTO "StoreSetting" ("key", "storeName", "defaultLocale", "defaultCurrency", "timezone", "isMaintenanceMode")
    VALUES ('primary', 'Golara', 'fa-IR', 'TOMAN', 'America/Vancouver', false)
    ON CONFLICT ("key") DO NOTHING;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "StorefrontNavigationMenu" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "key" TEXT NOT NULL,
      "label" TEXT NOT NULL,
      "locale" TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "StorefrontNavigationMenuItem" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "menuId" TEXT NOT NULL,
      "parentId" TEXT,
      "label" TEXT NOT NULL,
      "href" TEXT NOT NULL,
      "locale" TEXT,
      "isVisible" BOOLEAN NOT NULL DEFAULT true,
      "opensInNewTab" BOOLEAN NOT NULL DEFAULT false,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "StorefrontNavigationMenuItem_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "StorefrontNavigationMenu"("id") ON DELETE CASCADE,
      CONSTRAINT "StorefrontNavigationMenuItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "StorefrontNavigationMenuItem"("id") ON DELETE SET NULL
    );
  `);
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "StorefrontNavigationMenu_key_locale_key" ON "StorefrontNavigationMenu" ("key", COALESCE("locale", \'\'));'
  );
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "StorefrontNavigationMenuItem_menuId_sortOrder_idx" ON "StorefrontNavigationMenuItem" ("menuId", "sortOrder");'
  );
  await prisma.$executeRawUnsafe(`
    WITH primary_menu AS (
      INSERT INTO "StorefrontNavigationMenu" ("key", "label", "locale", "isActive")
      VALUES ('primary', 'Primary navigation', NULL, true)
      ON CONFLICT ("key", COALESCE("locale", '')) DO UPDATE SET "label" = EXCLUDED."label"
      RETURNING "id"
    )
    INSERT INTO "StorefrontNavigationMenuItem" ("menuId", "label", "href", "sortOrder")
    SELECT "id", 'Catalog', '/products', 10 FROM primary_menu
    UNION ALL SELECT "id", 'Occasions', '/#occasions', 20 FROM primary_menu
    UNION ALL SELECT "id", 'Available today', '/categories/available-today', 30 FROM primary_menu
    UNION ALL SELECT "id", 'Best sellers', '/#best-sellers', 40 FROM primary_menu
    ON CONFLICT DO NOTHING;
  `);
}

async function startNextServer(databaseUrl: string) {
  const server = spawn('npm', ['run', 'dev', '--', '--hostname', '127.0.0.1', '--port', String(PORT)], {
    cwd: process.cwd(),
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      E2E_DATABASE_URL: databaseUrl,
      NEXT_PUBLIC_SITE_URL: BASE_URL,
      CHECKOUT_MODE: 'assisted',
      CHECKOUT_DOMESTIC_CURRENCY: 'TOMAN',
      ADMIN_PASSWORD,
      ADMIN_SESSION_SECRET,
      ADMIN_ROLE: 'owner',
      CUSTOMER_MESSAGE_PROVIDER: 'log',
      CUSTOMER_OTP_SECRET,
      CUSTOMER_OTP_LENGTH: String(CUSTOMER_OTP_LENGTH),
      STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
      ZARINPAL_WEBHOOK_SECRET: WEBHOOK_SECRET
    }
  });
  server.stdout?.on('data', (chunk) => process.stdout.write(`[next] ${chunk}`));
  server.stderr?.on('data', (chunk) => process.stderr.write(`[next] ${chunk}`));
  await waitForReady(server);
  return server;
}

async function stopNextServer(server?: ChildProcess) {
  if (!server || server.killed) return;

  if (process.platform === 'win32' && server.pid) {
    await new Promise<void>((resolve) => {
      const killer = spawn('taskkill', ['/PID', String(server.pid), '/T', '/F'], {
        stdio: 'ignore'
      });
      killer.on('exit', () => resolve());
      killer.on('error', () => resolve());
    });
    return;
  }

  server.kill('SIGTERM');
}

async function waitForReady(server: ChildProcess) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let lastError = '';
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Next dev exited early with ${server.exitCode}`);
    try {
      const response = await fetch(BASE_URL, { redirect: 'manual' });
      if (response.status >= 200 && response.status < 500) return;
      lastError = `status ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${BASE_URL}: ${lastError}`);
}

async function runPublicReadRouteTests() {
  await expectHtml('/', 200, ['Golara']);
  await expectHtml('/products', 200, ['E2E Red Rose Bouquet']);
  await expectHtml('/products/e2e-red-rose-bouquet', 200, ['E2E Red Rose Bouquet']);
  await expectHtml('/categories', 200, ['E2E Roses']);
  await expectHtml('/categories/e2e-roses', 200, ['E2E Red Rose Bouquet']);
  await expectHtml('/account/login', 200, ['phone']);
  await expectText('/sitemap.xml', 200, ['<urlset']);
  await expectText('/robots.txt', 200, ['User-agent']);
}

async function runCartAndCheckoutPageTests(fixture: ApiFixture) {
  const jar = new CookieJar();
  jar.set(CART_COOKIE_NAME, fixture.cartToken);
  await expectHtml('/cart', 200, ['E2E Red Rose Bouquet', '2500.00 TOMAN'], jar);
  await expectHtml('/cart/checkout', 200, ['E2E Red Rose Bouquet', 'name', 'address'], jar);
  await expectHtml('/cart?cart=added', 200, ['Item added to your cart.'], jar);
}

async function runAccountAndAdminPageTests(fixture: ApiFixture) {
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

async function runServerActionMutationTests(fixture: ApiFixture) {
  await runCartServerActionTests(fixture);
  await runAccountProfileServerActionTests(fixture);
  await runAdminLoginServerActionTests();
}

async function runCheckoutAndAddressBookActionTests(fixture: ApiFixture) {
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

  const addedAddress = await fixture.prisma.customerAddress.findFirstOrThrow({
    where: { customerId: fixture.customerId, label: 'API E2E Address' }
  });
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

  const cartAfterAdd = await fixture.prisma.cartSession.findUniqueOrThrow({
    where: { token: jar.get(CART_COOKIE_NAME) },
    include: { items: true }
  });
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

  const itemAfterUpdate = await fixture.prisma.cartItem.findUniqueOrThrow({
    where: { cartId_lineKey: { cartId: cartAfterAdd.id, lineKey } }
  });
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

  const customer = await fixture.prisma.customerProfile.findUniqueOrThrow({
    where: { id: fixture.customerId }
  });
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

async function runCustomerAuthAndInquiryActionTests(fixture: ApiFixture) {
  const loginJar = new CookieJar();
  const phone = '+16045559333';
  const loginHtml = await responseText(await request('/account/login?returnTo=/account'));
  const requestOtpForm = new FormData();
  appendServerActionFields(requestOtpForm, loginHtml, 'name="phone"');
  requestOtpForm.set('phone', phone);
  requestOtpForm.set('returnTo', '/account');
  const requestOtpResponse = await submitServerAction('/account/login', requestOtpForm, loginJar);
  assert.match(requestOtpResponse.headers.get('location') ?? '', /\/account\/login\?status=code-sent/);

  const challenge = await fixture.prisma.customerOtpChallenge.findFirstOrThrow({
    where: { destination: phone, purpose: 'login', consumedAt: null },
    orderBy: { createdAt: 'desc' }
  });
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

  const inquiry = await fixture.prisma.customerInquiry.findFirstOrThrow({
    where: { phone: '+16045559344', productId: fixture.productId }
  });
  assert.equal(inquiry.name, 'API E2E Inquiry Customer');
  assert.equal(inquiry.status, 'new');
  assert.equal(inquiry.message, 'API E2E inquiry for a delivery arrangement.');
}

async function runAdminProtectedRouteAndActionTests(fixture: ApiFixture) {
  const unauthenticatedProductsExport = await request('/admin/products/export');
  assert.equal(unauthenticatedProductsExport.status, 401, 'products export should reject anonymous users');

  const unauthenticatedOrdersCsv = await request('/admin/orders/csv');
  assert.equal(unauthenticatedOrdersCsv.status, 401, 'orders CSV should reject anonymous users');

  const adminJar = createAdminCookieJar();
  await expectText('/admin/products/export', 200, ['"title","slug","code"', 'E2E Red Rose Bouquet'], adminJar);
  await expectText('/admin/orders/csv', 200, ['"Created","Order","Customer"', fixture.orderNumber], adminJar);

  const order = await fixture.prisma.checkoutOrder.findUniqueOrThrow({
    where: { orderNumber: fixture.orderNumber },
    include: { paymentAttempts: true }
  });
  const detailPath = `/admin/orders/${order.id}`;
  const detailHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const form = new FormData();
  appendServerActionFields(form, detailHtml, 'name="providerReference"');
  form.set('amountCents', '250000');
  form.set('providerReference', 'api-e2e-manual-receipt-1001');
  form.set('note', 'API E2E manual payment receipt');
  const response = await submitServerAction(detailPath, form, adminJar);
  assertRedirect(response, `${detailPath}?status=manual-payment-marked`);

  const manualAttempt = await fixture.prisma.checkoutPaymentAttempt.findFirstOrThrow({
    where: { orderId: order.id, provider: 'manual', providerReference: 'api-e2e-manual-receipt-1001' }
  });
  assert.equal(manualAttempt.status, 'paid');
  assert.equal(manualAttempt.amountCents, 250000);

  assert.equal(
    await fixture.prisma.adminAuditLog.count({
      where: { action: 'order.payment.manual.mark_paid', entityId: order.id }
    }),
    1
  );

  assert.equal(
    await fixture.prisma.checkoutOrderTimelineEvent.count({
      where: { orderId: order.id, type: 'payment_status_changed' }
    }),
    1
  );
}

async function runAdminSettingsContentActionTests(fixture: ApiFixture) {
  const adminJar = createAdminCookieJar();
  const settingsHtml = await responseText(await request('/admin/settings', { headers: { cookie: adminJar.header() } }));

  const storeForm = new FormData();
  appendServerActionFields(storeForm, settingsHtml, 'name="storeName"');
  storeForm.set('storeName', 'Golara API E2E');
  storeForm.set('legalName', 'Golara API E2E Legal Inc.');
  storeForm.set('supportEmail', 'support-api-e2e@golara.test');
  storeForm.set('supportPhone', '+16045559100');
  storeForm.set('defaultLocale', 'en-CA');
  storeForm.set('defaultCurrency', 'TOMAN');
  storeForm.set('timezone', 'America/Vancouver');
  storeForm.set('storefrontBaseUrl', BASE_URL);
  const storeResponse = await submitServerAction('/admin/settings', storeForm, adminJar);
  assertRedirect(storeResponse, '/admin/settings?status=store-settings-updated');

  const storeRows = await fixture.prisma.$queryRaw<Array<{ storeName: string; supportEmail: string | null; defaultLocale: string }>>`
    SELECT "storeName", "supportEmail", "defaultLocale"
    FROM "StoreSetting"
    WHERE "key" = 'primary'
  `;
  assert.equal(storeRows[0]?.storeName, 'Golara API E2E');
  assert.equal(storeRows[0]?.supportEmail, 'support-api-e2e@golara.test');
  assert.equal(storeRows[0]?.defaultLocale, 'en-CA');

  const settingsAfterStoreUpdateHtml = await responseText(await request('/admin/settings', { headers: { cookie: adminJar.header() } }));
  const menuItems = [
    { label: 'API Shop', href: '/products', locale: null, isVisible: true, opensInNewTab: false, sortOrder: 10 },
    { label: 'API Roses', href: '/categories/e2e-roses', locale: null, isVisible: true, opensInNewTab: false, sortOrder: 20 },
    { label: 'Hidden API Link', href: '/hidden-api-link', locale: null, isVisible: false, opensInNewTab: false, sortOrder: 30 }
  ];
  const navForm = new FormData();
  appendServerActionFields(navForm, settingsAfterStoreUpdateHtml, 'name="itemsJson"');
  navForm.set('key', 'primary');
  navForm.set('label', 'API E2E Primary Navigation');
  navForm.set('locale', '');
  navForm.set('itemsJson', JSON.stringify(menuItems));
  navForm.set('isActive', 'on');
  const navResponse = await submitServerAction('/admin/settings', navForm, adminJar);
  assertRedirect(navResponse, '/admin/settings?status=storefront-navigation-updated');

  const menuRows = await fixture.prisma.$queryRaw<Array<{ id: string; label: string; isActive: boolean }>>`
    SELECT "id", "label", "isActive"
    FROM "StorefrontNavigationMenu"
    WHERE "key" = 'primary' AND "locale" IS NULL
  `;
  assert.equal(menuRows[0]?.label, 'API E2E Primary Navigation');
  assert.equal(menuRows[0]?.isActive, true);
  const itemRows = await fixture.prisma.$queryRaw<Array<{ label: string; href: string; isVisible: boolean }>>`
    SELECT "label", "href", "isVisible"
    FROM "StorefrontNavigationMenuItem"
    WHERE "menuId" = ${menuRows[0]?.id}
    ORDER BY "sortOrder"
  `;
  assert.deepEqual(itemRows.map((item) => item.label), ['API Shop', 'API Roses', 'Hidden API Link']);
  assert.equal(itemRows.find((item) => item.label === 'Hidden API Link')?.isVisible, false);

  await expectHtml('/', 200, ['API Shop', 'API Roses']);

  assert.equal(
    await fixture.prisma.adminAuditLog.count({
      where: { action: 'settings.storefront_navigation.update', entityId: menuRows[0]?.id }
    }),
    1
  );
}

async function runAdminHomepageContentActionTests(fixture: ApiFixture) {
  const adminJar = createAdminCookieJar();
  const homepageAdminHtml = await responseText(await request('/admin/homepage', { headers: { cookie: adminJar.header() } }));
  const form = new FormData();
  appendServerActionFields(form, homepageAdminHtml, 'name="title"');
  form.set('eyebrow', 'API E2E Hero');
  form.set('title', 'API E2E Homepage Title');
  form.set('body', 'Homepage body updated through live API E2E.');
  form.set('existingHeroImage', '/seed-images/photo-real/standard-bouquet.jpg');
  form.set('heroSelectedMediaUrl', '');
  form.set('heroImageUrl', '');
  form.set('heroImageAlt', 'API E2E homepage bouquet');
  form.set('primaryCtaLabel', 'Shop API E2E');
  form.set('primaryCtaHref', '/products');
  form.set('secondaryCtaLabel', 'View API Roses');
  form.set('secondaryCtaHref', '/categories/e2e-roses');
  form.set('tertiaryCtaLabel', 'Admin API Picks');
  form.set('tertiaryCtaHref', '/#best-sellers');
  form.set('trustItemOne', 'API same-day');
  form.set('trustItemTwo', 'API premium finish');
  form.set('trustItemThree', 'API staff guidance');
  form.set('studioBadge', 'API studio badge');
  form.set('collectionsEyebrow', 'API Occasions');
  form.set('collectionsTitle', 'API occasion tiles');
  form.set('collectionsBody', 'API homepage occasion block.');
  form.set('collectionsCtaLabel', 'Browse API occasions');
  form.set('collectionsCtaHref', '/categories');
  form.set('footerBody', 'API footer brand body.');
  form.set('footerServiceBody', 'API footer service body.');

  const response = await submitServerAction('/admin/homepage', form, adminJar);
  assertRedirect(response, '/admin/homepage?status=homepage-updated');

  const section = await fixture.prisma.homepageSection.findUniqueOrThrow({ where: { key: 'home.hero' } });
  const translation = await fixture.prisma.homepageSectionTranslation.findUniqueOrThrow({
    where: { sectionId_locale: { sectionId: section.id, locale: 'fa-IR' } }
  });
  const translationPayload = translation.payload as {
    primaryCtaLabel?: string;
    collectionsTitle?: string;
  };
  assert.equal(translation.title, 'API E2E Homepage Title');
  assert.equal(translation.body, 'Homepage body updated through live API E2E.');
  assert.equal(translationPayload.primaryCtaLabel, 'Shop API E2E');
  assert.equal(translationPayload.collectionsTitle, 'API occasion tiles');

  await expectHtml('/', 200, ['API E2E Homepage Title', 'Homepage body updated through live API E2E.', 'Shop API E2E']);

  assert.equal(
    await fixture.prisma.adminAuditLog.count({
      where: { action: 'homepage.update', entityId: section.id }
    }),
    1
  );
}

async function runAdminMediaLibraryActionTests(fixture: ApiFixture) {
  const adminJar = createAdminCookieJar();
  const mediaPath = '/admin/media';
  const mediaHtml = await responseText(await request(mediaPath, { headers: { cookie: adminJar.header() } }));

  const createForm = new FormData();
  appendServerActionFields(createForm, mediaHtml, 'name="url"');
  createForm.set('mediaCategory', 'homepage-banner');
  createForm.set('url', 'https://example.com/api-e2e-media-original.jpg');
  createForm.set('alt', 'API E2E Media Alt');
  const createResponse = await submitServerAction(mediaPath, createForm, adminJar);
  assertRedirect(createResponse, '/admin/media?status=media-created');

  let media = await fixture.prisma.media.findUniqueOrThrow({
    where: { url: 'https://example.com/api-e2e-media-original.jpg' }
  });
  assert.equal(media.alt, 'API E2E Media Alt');
  assert.equal(media.sourceType, 'external');
  assert.equal((media.metadata as { mediaCategory?: string } | null)?.mediaCategory, 'homepage-banner');

  const afterCreateHtml = await responseText(await request(mediaPath, { headers: { cookie: adminJar.header() } }));
  const categoryForm = new FormData();
  appendServerActionFields(categoryForm, afterCreateHtml, 'Save');
  categoryForm.set('mediaCategory', 'product');
  const categoryResponse = await submitServerAction(mediaPath, categoryForm, adminJar);
  assertRedirect(categoryResponse, '/admin/media?status=media-saved');

  media = await fixture.prisma.media.findUniqueOrThrow({ where: { id: media.id } });
  assert.equal((media.metadata as { mediaCategory?: string } | null)?.mediaCategory, 'product');

  const afterCategoryHtml = await responseText(await request(mediaPath, { headers: { cookie: adminJar.header() } }));
  const updateForm = new FormData();
  appendServerActionFields(updateForm, afterCategoryHtml, 'Update');
  updateForm.set('url', 'https://example.com/api-e2e-media-updated.jpg');
  updateForm.set('alt', 'API E2E Media Alt Updated');
  updateForm.set('mediaCategory', 'homepage-best-seller');
  const updateResponse = await submitServerAction(mediaPath, updateForm, adminJar);
  assertRedirect(updateResponse, '/admin/media?status=media-saved');

  media = await fixture.prisma.media.findUniqueOrThrow({ where: { id: media.id } });
  assert.equal(media.url, 'https://example.com/api-e2e-media-updated.jpg');
  assert.equal(media.alt, 'API E2E Media Alt Updated');
  assert.equal((media.metadata as { mediaCategory?: string } | null)?.mediaCategory, 'homepage-best-seller');

  await expectHtml(mediaPath, 200, ['API E2E Media Alt Updated', 'api-e2e-media-updated.jpg'], adminJar);

  for (const action of ['media.upsert_url', 'media.category.update', 'media.update']) {
    assert.equal(await fixture.prisma.adminAuditLog.count({ where: { action, entityId: media.id } }), 1, `${action} audit log`);
  }
}

async function runAdminProductCatalogActionTests(fixture: ApiFixture) {
  const adminJar = createAdminCookieJar();
  const productPath = `/admin/products/${fixture.productId}`;
  const product = await fixture.prisma.product.findUniqueOrThrow({
    where: { id: fixture.productId },
    include: { category: true }
  });

  const updateProductHtml = await responseText(await request(productPath, { headers: { cookie: adminJar.header() } }));
  const updateProductForm = new FormData();
  appendServerActionFields(updateProductForm, updateProductHtml, 'Save product');
  updateProductForm.set('title', 'API E2E Catalog Product Updated');
  updateProductForm.set('slug', product.slug);
  updateProductForm.set('code', product.code);
  updateProductForm.set('categoryId', product.categoryId);
  updateProductForm.set('productTypeId', '');
  updateProductForm.set('description', 'API E2E catalog product description updated through admin product form.');
  updateProductForm.set('seoTitle', 'API E2E Catalog SEO Title');
  updateProductForm.set('seoDescription', 'API E2E catalog SEO description.');
  updateProductForm.set('canonicalPath', `/products/${product.slug}`);
  updateProductForm.set('seoIndex', 'on');
  updateProductForm.set('price', '1500');
  updateProductForm.set('currency', 'TOMAN');
  updateProductForm.set('selectedMediaUrl', '');
  updateProductForm.set('imageUrl', 'https://example.com/api-e2e-product-updated.jpg');
  updateProductForm.set('availableToday', 'on');
  updateProductForm.set('bestSeller', 'on');
  updateProductForm.set('isActive', 'on');
  updateProductForm.set('sortOrder', '42');
  const updateProductResponse = await submitServerAction(productPath, updateProductForm, adminJar);
  assertRedirect(updateProductResponse, `${productPath}?status=product-updated`);

  const updatedProduct = await fixture.prisma.product.findUniqueOrThrow({ where: { id: fixture.productId } });
  assert.equal(updatedProduct.title, 'API E2E Catalog Product Updated');
  assert.equal(updatedProduct.priceCents, 150000);
  assert.equal(updatedProduct.imageUrl, 'https://example.com/api-e2e-product-updated.jpg');
  assert.equal(updatedProduct.bestSeller, true);
  assert.equal(await fixture.prisma.adminAuditLog.count({ where: { action: 'product.update', entityId: fixture.productId } }), 1);

  const createTypeHtml = await responseText(await request(productPath, { headers: { cookie: adminJar.header() } }));
  const createTypeForm = new FormData();
  appendServerActionFields(createTypeForm, createTypeHtml, 'Create type');
  createTypeForm.set('returnProductId', fixture.productId);
  createTypeForm.set('name', 'API E2E Product Type');
  createTypeForm.set('slug', 'api-e2e-product-type');
  createTypeForm.set('description', 'API E2E product type description.');
  createTypeForm.set('sortOrder', '11');
  createTypeForm.set('isActive', 'on');
  const createTypeResponse = await submitServerAction(productPath, createTypeForm, adminJar);
  assertRedirect(createTypeResponse, `${productPath}?status=product-type-created`);
  const productType = await fixture.prisma.productType.findUniqueOrThrow({ where: { slug: 'api-e2e-product-type' } });
  assert.equal(productType.name, 'API E2E Product Type');

  const createAttributeHtml = await responseText(await request(productPath, { headers: { cookie: adminJar.header() } }));
  const createAttributeForm = new FormData();
  appendServerActionFields(createAttributeForm, createAttributeHtml, 'Create attribute');
  createAttributeForm.set('returnProductId', fixture.productId);
  createAttributeForm.set('name', 'API E2E Color Family');
  createAttributeForm.set('slug', 'api-e2e-color-family');
  createAttributeForm.set('description', 'API E2E catalog color family attribute.');
  createAttributeForm.set('inputType', 'select');
  createAttributeForm.set('appliesTo', 'both');
  createAttributeForm.set('unit', '');
  createAttributeForm.set('sortOrder', '12');
  createAttributeForm.set('options', 'Red\nPink\nWhite');
  createAttributeForm.set('isFilterable', 'on');
  createAttributeForm.set('isActive', 'on');
  const createAttributeResponse = await submitServerAction(productPath, createAttributeForm, adminJar);
  assertRedirect(createAttributeResponse, `${productPath}?status=product-attribute-created`);
  const attribute = await fixture.prisma.productAttribute.findUniqueOrThrow({ where: { slug: 'api-e2e-color-family' } });
  assert.equal(attribute.inputType, 'select');
  assert.equal(attribute.appliesTo, 'both');

  const productValueHtml = await responseText(await request(productPath, { headers: { cookie: adminJar.header() } }));
  const productValueForm = new FormData();
  appendServerActionFields(productValueForm, productValueHtml, `attributeValue:${attribute.id}`);
  productValueForm.set('attributeId', attribute.id);
  productValueForm.set(`attributeValue:${attribute.id}`, 'Red');
  const productValueResponse = await submitServerAction(productPath, productValueForm, adminJar);
  assertRedirect(productValueResponse, `${productPath}?status=product-attribute-values-updated`);
  const productAttributeValue = await fixture.prisma.productAttributeValue.findUniqueOrThrow({
    where: { attributeId_productId: { attributeId: attribute.id, productId: fixture.productId } }
  });
  assert.equal(productAttributeValue.value, 'Red');

  const createCollectionHtml = await responseText(await request(productPath, { headers: { cookie: adminJar.header() } }));
  const createCollectionForm = new FormData();
  appendServerActionFields(createCollectionForm, createCollectionHtml, 'Create collection');
  createCollectionForm.set('returnProductId', fixture.productId);
  createCollectionForm.set('title', 'API E2E Collection');
  createCollectionForm.set('slug', 'api-e2e-collection');
  createCollectionForm.set('description', 'API E2E merchandising collection.');
  createCollectionForm.set('sortOrder', '13');
  createCollectionForm.set('isActive', 'on');
  const createCollectionResponse = await submitServerAction(productPath, createCollectionForm, adminJar);
  assertRedirect(createCollectionResponse, `${productPath}?status=product-collection-created`);
  const collection = await fixture.prisma.collection.findUniqueOrThrow({ where: { slug: 'api-e2e-collection' } });

  const collectionAssignmentHtml = await responseText(await request(productPath, { headers: { cookie: adminJar.header() } }));
  const collectionAssignmentForm = new FormData();
  appendServerActionFields(collectionAssignmentForm, collectionAssignmentHtml, 'Save collections');
  collectionAssignmentForm.set('collectionId', collection.id);
  const collectionAssignmentResponse = await submitServerAction(productPath, collectionAssignmentForm, adminJar);
  assertRedirect(collectionAssignmentResponse, `${productPath}?status=product-collections-updated`);
  assert.equal(
    await fixture.prisma.productCollection.count({ where: { productId: fixture.productId, collectionId: collection.id } }),
    1
  );

  const createVariantHtml = await responseText(await request(productPath, { headers: { cookie: adminJar.header() } }));
  const createVariantForm = new FormData();
  appendServerActionFields(createVariantForm, createVariantHtml, 'Create variant');
  createVariantForm.set('name', 'API E2E Premium Variant');
  createVariantForm.set('sku', 'API-E2E-PREMIUM-001');
  createVariantForm.set('price', '1750');
  createVariantForm.set('currency', 'TOMAN');
  createVariantForm.set('stockQuantity', '8');
  createVariantForm.set('trackInventory', 'on');
  createVariantForm.set('lowStockThreshold', '2');
  createVariantForm.set('sortOrder', '5');
  createVariantForm.set('variantSelectedMediaUrl', '');
  createVariantForm.set('variantImageUrl', 'https://example.com/api-e2e-variant.jpg');
  createVariantForm.set('isActive', 'on');
  const createVariantResponse = await submitServerAction(productPath, createVariantForm, adminJar);
  assertRedirect(createVariantResponse, `${productPath}?status=product-variant-created`);
  const createdVariant = await fixture.prisma.productVariant.findUniqueOrThrow({ where: { sku: 'API-E2E-PREMIUM-001' } });
  assert.equal(createdVariant.priceCents, 175000);
  assert.equal(createdVariant.stockQuantity, 8);

  const variantValueHtml = await responseText(await request(productPath, { headers: { cookie: adminJar.header() } }));
  const variantValueForm = new FormData();
  appendServerActionFields(variantValueForm, variantValueHtml, `attributeValue:${attribute.id}`, 'last');
  variantValueForm.set('attributeId', attribute.id);
  variantValueForm.set(`attributeValue:${attribute.id}`, 'Pink');
  const variantValueResponse = await submitServerAction(productPath, variantValueForm, adminJar);
  assertRedirect(variantValueResponse, `${productPath}?status=product-attribute-values-updated`);
  const variantAttributeValue = await fixture.prisma.productAttributeValue.findUniqueOrThrow({
    where: { attributeId_variantId: { attributeId: attribute.id, variantId: createdVariant.id } }
  });
  assert.equal(variantAttributeValue.value, 'Pink');

  const location = await fixture.prisma.warehouseLocation.findFirstOrThrow({ orderBy: { createdAt: 'asc' } });
  const stockHtml = await responseText(await request(productPath, { headers: { cookie: adminJar.header() } }));
  const stockForm = new FormData();
  appendServerActionFields(stockForm, stockHtml, `value="${location.id}"`, 'last');
  stockForm.set('locationId', location.id);
  stockForm.set('quantity', '12');
  stockForm.set('reservedQuantity', '1');
  stockForm.set('lowStockThreshold', '3');
  const stockResponse = await submitServerAction(productPath, stockForm, adminJar);
  assertRedirect(stockResponse, `${productPath}?status=variant-location-stock-updated`);
  const locationStock = await fixture.prisma.productVariantLocationStock.findUniqueOrThrow({
    where: { variantId_locationId: { variantId: createdVariant.id, locationId: location.id } }
  });
  assert.equal(locationStock.quantity, 12);
  assert.equal(locationStock.reservedQuantity, 1);
  assert.equal((await fixture.prisma.productVariant.findUniqueOrThrow({ where: { id: createdVariant.id } })).stockQuantity, 12);

  await expectHtml(productPath, 200, ['API E2E Catalog Product Updated', 'API E2E Premium Variant', 'API E2E Collection'], adminJar);
}

async function runAdminOrderOperationsActionTests(fixture: ApiFixture) {
  const adminJar = createAdminCookieJar();
  const editableOrder = await fixture.prisma.checkoutOrder.create({
    data: {
      orderNumber: 'API-E2E-ADMIN-EDIT-1001',
      publicLookupToken: 'api-e2e-admin-edit-token',
      status: 'draft',
      checkoutMode: 'staff',
      currency: 'TOMAN',
      recipientName: 'API Admin Draft Recipient',
      recipientPhone: '+16045559200',
      paymentAttempts: {
        create: {
          provider: 'manual',
          status: 'created',
          amountCents: 0,
          currency: 'TOMAN',
          providerReference: 'api-e2e-voidable-manual'
        }
      }
    }
  });
  const detailPath = `/admin/orders/${editableOrder.id}`;
  const lineOption = `${fixture.productId}::${fixture.variantId}`;

  const addLineHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const addLineForm = new FormData();
  appendServerActionFields(addLineForm, addLineHtml, 'name="lineOption"');
  addLineForm.set('lineOption', lineOption);
  addLineForm.set('quantity', '2');
  const addLineResponse = await submitServerAction(detailPath, addLineForm, adminJar);
  assertRedirect(addLineResponse, `${detailPath}?status=order-line-added`);

  let lineItem = await fixture.prisma.checkoutOrderItem.findFirstOrThrow({
    where: { orderId: editableOrder.id, productId: fixture.productId, variantId: fixture.variantId }
  });
  assert.equal(lineItem.quantity, 2);
  assert.equal(lineItem.lineTotalCents, 250000);
  assert.equal(await fixture.prisma.inventoryStockReservation.count({ where: { orderItemId: lineItem.id, status: 'held' } }), 1);

  const updateLineHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const updateLineForm = new FormData();
  appendServerActionFields(updateLineForm, updateLineHtml, `value="${lineItem.quantity}"`);
  updateLineForm.set('quantity', '3');
  const updateLineResponse = await submitServerAction(detailPath, updateLineForm, adminJar);
  assertRedirect(updateLineResponse, `${detailPath}?status=order-line-updated`);

  lineItem = await fixture.prisma.checkoutOrderItem.findUniqueOrThrow({ where: { id: lineItem.id } });
  assert.equal(lineItem.quantity, 3);
  assert.equal(lineItem.lineTotalCents, 375000);
  assert.equal(await fixture.prisma.inventoryStockReservation.count({ where: { orderItemId: lineItem.id, status: 'held' } }), 1);

  const discountHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const discountForm = new FormData();
  appendServerActionFields(discountForm, discountHtml, 'name="discountCents"');
  discountForm.set('discountCents', '25000');
  discountForm.set('discountNote', 'API E2E admin discount');
  const discountResponse = await submitServerAction(detailPath, discountForm, adminJar);
  assertRedirect(discountResponse, `${detailPath}?status=order-discount-updated`);

  let order = await fixture.prisma.checkoutOrder.findUniqueOrThrow({ where: { id: editableOrder.id } });
  assert.equal(order.subtotalCents, 375000);
  assert.equal(order.discountCents, 25000);
  assert.equal(order.totalCents, 350000);

  const noteHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const noteForm = new FormData();
  appendServerActionFields(noteForm, noteHtml, 'name="note"');
  noteForm.set('note', 'API E2E staff timeline note');
  const noteResponse = await submitServerAction(detailPath, noteForm, adminJar);
  assertRedirect(noteResponse, `${detailPath}?status=order-note-added`);

  assert.equal(
    await fixture.prisma.checkoutOrderTimelineEvent.count({
      where: { orderId: editableOrder.id, type: 'staff_note', note: 'API E2E staff timeline note' }
    }),
    1
  );

  const fulfillmentHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const fulfillmentForm = new FormData();
  appendServerActionFields(fulfillmentForm, fulfillmentHtml, 'name="fulfillmentStatus"');
  fulfillmentForm.set('fulfillmentStatus', 'scheduled');
  fulfillmentForm.set('courierName', 'API Courier');
  fulfillmentForm.set('courierPhone', '+16045559299');
  fulfillmentForm.set('fulfillmentNote', 'API E2E fulfillment note');
  const fulfillmentResponse = await submitServerAction(detailPath, fulfillmentForm, adminJar);
  assertRedirect(fulfillmentResponse, `${detailPath}?status=fulfillment-updated`);

  order = await fixture.prisma.checkoutOrder.findUniqueOrThrow({ where: { id: editableOrder.id } });
  assert.equal(order.fulfillmentStatus, 'scheduled');
  assert.equal(order.courierName, 'API Courier');
  assert.equal(order.fulfillmentNote, 'API E2E fulfillment note');

  const customer = await fixture.prisma.customerProfile.create({
    data: {
      phone: '+16045559222',
      displayName: 'API E2E Assigned Customer',
      email: 'api-assigned-customer.e2e@golara.test',
      locale: 'fa-IR',
      accounts: {
        create: {
          provider: 'phone',
          providerAccountId: '+16045559222',
          phone: '+16045559222',
          email: 'api-assigned-customer.e2e@golara.test',
          phoneVerifiedAt: new Date('2026-06-01T12:00:00.000Z'),
          metadata: { apiE2e: true }
        }
      },
      addresses: {
        create: {
          label: 'API E2E assigned delivery',
          recipient: 'API E2E Assigned Customer',
          phone: '+16045559222',
          city: 'Vancouver',
          line1: '789 API Assignment Avenue',
          line2: 'Suite 22',
          notes: 'Assigned through admin order API E2E.',
          isDefault: true
        }
      }
    },
    include: { addresses: true }
  });
  const assignmentHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const assignmentForm = new FormData();
  appendServerActionFields(assignmentForm, assignmentHtml, 'name="customerId"');
  assignmentForm.set('customerId', customer.id);
  assignmentForm.set('addressId', customer.addresses[0]?.id ?? '');
  const assignmentResponse = await submitServerAction(detailPath, assignmentForm, adminJar);
  assertRedirect(assignmentResponse, `${detailPath}?status=order-customer-assigned`);

  order = await fixture.prisma.checkoutOrder.findUniqueOrThrow({ where: { id: editableOrder.id } });
  assert.equal(order.customerId, customer.id);
  assert.equal(order.addressId, customer.addresses[0]?.id);
  assert.equal(order.recipientName, 'API E2E Assigned Customer');

  const manualPaymentHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const manualPaymentForm = new FormData();
  appendServerActionFields(manualPaymentForm, manualPaymentHtml, 'name="providerReference"');
  manualPaymentForm.set('amountCents', '350000');
  manualPaymentForm.set('providerReference', 'api-e2e-admin-manual-paid');
  manualPaymentForm.set('note', 'API E2E admin paid receipt');
  const manualPaymentResponse = await submitServerAction(detailPath, manualPaymentForm, adminJar);
  assertRedirect(manualPaymentResponse, `${detailPath}?status=manual-payment-marked`);

  const paidAttempt = await fixture.prisma.checkoutPaymentAttempt.findFirstOrThrow({
    where: { orderId: editableOrder.id, providerReference: 'api-e2e-admin-manual-paid' }
  });
  assert.equal(paidAttempt.status, 'paid');

  const refundHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const refundForm = new FormData();
  appendServerActionFields(refundForm, refundHtml, 'Refund manual payment');
  const refundResponse = await submitServerAction(detailPath, refundForm, adminJar);
  assertRedirect(refundResponse, `${detailPath}?status=manual-payment-refunded`);
  assert.equal((await fixture.prisma.checkoutPaymentAttempt.findUniqueOrThrow({ where: { id: paidAttempt.id } })).status, 'refunded');

  await fixture.prisma.checkoutPaymentAttempt.create({
    data: {
      orderId: editableOrder.id,
      provider: 'manual',
      status: 'created',
      amountCents: 50000,
      currency: 'TOMAN',
      providerReference: 'api-e2e-admin-manual-void'
    }
  });
  const voidHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const voidForm = new FormData();
  appendServerActionFields(voidForm, voidHtml, 'Void manual payment');
  const voidResponse = await submitServerAction(detailPath, voidForm, adminJar);
  assertRedirect(voidResponse, `${detailPath}?status=manual-payment-voided`);
  const voidedAttempt = await fixture.prisma.checkoutPaymentAttempt.findFirstOrThrow({
    where: { orderId: editableOrder.id, providerReference: 'api-e2e-admin-manual-void' }
  });
  assert.equal(voidedAttempt.status, 'cancelled');

  const removeHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const removeForm = new FormData();
  appendServerActionFields(removeForm, removeHtml, 'Remove');
  const removeResponse = await submitServerAction(detailPath, removeForm, adminJar);
  assertRedirect(removeResponse, `${detailPath}?status=order-line-removed`);
  assert.equal(await fixture.prisma.checkoutOrderItem.count({ where: { orderId: editableOrder.id } }), 0);
  assert.equal(await fixture.prisma.inventoryStockReservation.count({ where: { orderItem: { orderId: editableOrder.id }, status: 'held' } }), 0);

  for (const action of [
    'order.line_item.add',
    'order.line_item.update',
    'order.discount.update',
    'order.timeline.note.create',
    'order.fulfillment.update',
    'order.customer.assign',
    'order.payment.manual.mark_paid',
    'order.payment.manual.refund',
    'order.payment.manual.void',
    'order.line_item.remove'
  ]) {
    assert.equal(await fixture.prisma.adminAuditLog.count({ where: { action, entityId: editableOrder.id } }), 1, `${action} audit log`);
  }
}

async function runOrderReturnRouteTests(fixture: ApiFixture) {
  const response = await request(`/orders/return?order=${encodeURIComponent(fixture.orderNumber)}&token=${encodeURIComponent(fixture.publicLookupToken)}&status=cancelled`, {
    redirect: 'manual'
  });
  assert.equal([302, 303, 307, 308].includes(response.status), true);
  assert.match(response.headers.get('location') ?? '', /orders\/confirmation|orders\//);
}

async function runWebhookRouteTests(fixture: ApiFixture) {
  const invalid = await request('/api/webhooks/payments/stripe', {
    method: 'POST',
    body: JSON.stringify({ ok: true }),
    headers: { 'content-type': 'application/json' }
  });
  assert.equal(invalid.status, 401);
  assert.equal((await invalid.json()).status, 'invalid_signature');

  const paidPayload = {
    id: 'evt_api_e2e_paid_1001',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: fixture.stripeProviderReference,
        payment_status: 'paid',
        amount_total: 250000,
        currency: 'toman',
        metadata: {
          orderNumber: fixture.orderNumber,
          publicLookupToken: fixture.publicLookupToken
        }
      }
    }
  };
  const first = await postSignedStripe('/api/webhooks/payments/stripe', paidPayload);
  assert.equal(first.status, 200);
  assert.equal((await first.json()).status, 'recorded');

  const duplicate = await postSignedStripe('/api/webhooks/payments/stripe', paidPayload);
  assert.equal(duplicate.status, 200);
  assert.equal((await duplicate.json()).status, 'duplicate');

  const attempt = await fixture.prisma.checkoutPaymentAttempt.findFirstOrThrow({
    where: { providerReference: fixture.stripeProviderReference }
  });
  assert.equal(attempt.status, 'verified_paid');
  const eventCount = await fixture.prisma.checkoutPaymentEvent.count({
    where: { paymentAttemptId: attempt.id, eventType: 'checkout.session.completed' }
  });
  assert.equal(eventCount, 1);

  const zarinpalPayload = {
    Authority: 'A000000000000000000000000000api',
    Status: 'OK',
    orderNumber: fixture.orderNumber,
    amount: 250000,
    currency: 'IRT'
  };
  const zarinpal = await postSignedZarinpal('/api/webhooks/payments/zarinpal', zarinpalPayload);
  assert.equal([200, 202].includes(zarinpal.status), true);
  const zarinpalBody = await zarinpal.json();
  assert.equal(['recorded', 'needs_attention'].includes(zarinpalBody.status), true);
}

async function expectHtml(path: string, status: number, expected: string[], jar?: CookieJar) {
  const response = await request(path, { headers: jar ? { cookie: jar.header() } : undefined });
  jar?.capture(response);
  assert.equal(response.status, status, `${path} status`);
  const body = await responseText(response);
  for (const text of expected) assert.match(body, new RegExp(escapeRegExp(text), 'i'), `${path} should contain ${text}`);
}

async function expectText(path: string, status: number, expected: string[], jar?: CookieJar) {
  const response = await request(path, { headers: jar ? { cookie: jar.header() } : undefined });
  assert.equal(response.status, status, `${path} status`);
  const body = await responseText(response);
  for (const text of expected) assert.match(body, new RegExp(escapeRegExp(text), 'i'), `${path} should contain ${text}`);
}

function createAdminCookieJar() {
  const jar = new CookieJar();
  jar.set(
    ADMIN_SESSION_COOKIE_NAME,
    createAdminSessionCookieValue(
      getAdminAuthConfig({
        ...process.env,
        ADMIN_PASSWORD,
        ADMIN_SESSION_SECRET,
        ADMIN_ROLE: 'owner'
      })
    )
  );
  return jar;
}

async function request(path: string, init: RequestInit = {}) {
  return fetch(`${BASE_URL}${path}`, { redirect: 'manual', ...init });
}

async function submitServerAction(path: string, formData: FormData, jar: CookieJar) {
  const response = await request(path, {
    method: 'POST',
    body: formData,
    headers: {
      cookie: jar.header(),
      origin: BASE_URL,
      referer: `${BASE_URL}${path}`
    }
  });
  jar.capture(response);
  return response;
}

async function postSignedStripe(path: string, payload: Record<string, unknown>) {
  const rawBody = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${rawBody}`;
  const signature = createHmac('sha256', WEBHOOK_SECRET).update(signedPayload).digest('hex');
  return request(path, {
    method: 'POST',
    body: rawBody,
    headers: {
      'content-type': 'application/json',
      'stripe-signature': `t=${timestamp},v1=${signature}`
    }
  });
}

async function postSignedZarinpal(path: string, payload: Record<string, unknown>) {
  const rawBody = JSON.stringify(payload);
  const signature = createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
  return request(path, {
    method: 'POST',
    body: rawBody,
    headers: {
      'content-type': 'application/json',
      'x-zarinpal-signature': signature
    }
  });
}

function assertRedirect(response: Response, expectedPath: string) {
  assert.equal([302, 303, 307, 308].includes(response.status), true);
  assert.match(response.headers.get('location') ?? '', new RegExp(escapeRegExp(expectedPath)));
}

async function responseText(response: Response) {
  return response.text();
}

function extractServerActionName(html: string, marker: string, occurrence: 'first' | 'last' = 'first') {
  const formHtml = extractServerActionFormHtml(html, marker, occurrence);
  const actionMatch = formHtml.match(/name="(\$ACTION_(?:ID|REF)_[^"]+)"/);
  assert.ok(actionMatch?.[1], `Expected server action id for marker ${marker}`);
  return actionMatch[1];
}

function appendServerActionFields(formData: FormData, html: string, marker: string, occurrence: 'first' | 'last' = 'first') {
  const formHtml = extractServerActionFormHtml(html, marker, occurrence);
  const actionInputs = [...formHtml.matchAll(/<input[^>]+>/g)]
    .map((match) => match[0])
    .map((input) => ({
      name: htmlAttribute(input, 'name'),
      value: htmlAttribute(input, 'value') ?? ''
    }))
    .filter((input): input is { name: string; value: string } => Boolean(input.name?.startsWith('$ACTION_')));

  assert.ok(actionInputs.some((input) => /^\$ACTION_(ID|REF)_/.test(input.name)), `Expected server action fields for marker ${marker}`);
  for (const input of actionInputs) formData.set(input.name, input.value);
}

function extractServerActionFormHtml(html: string, marker: string, occurrence: 'first' | 'last' = 'first') {
  const matchingForms = [...html.matchAll(/<form[\s\S]*?<\/form>/g)]
    .map((match) => match[0])
    .filter((formHtml) => formHtml.includes(marker));
  if (matchingForms.length > 0) {
    return occurrence === 'last' ? matchingForms[matchingForms.length - 1] : matchingForms[0];
  }

  const markerIndex = occurrence === 'last' ? html.lastIndexOf(marker) : html.indexOf(marker);
  assert.notEqual(markerIndex, -1, `Expected form marker ${marker}`);
  const formStart = html.lastIndexOf('<form', markerIndex);
  const formEnd = html.indexOf('</form>', markerIndex);
  assert.notEqual(formStart, -1, `Expected opening form for marker ${marker}`);
  assert.notEqual(formEnd, -1, `Expected closing form for marker ${marker}`);
  return html.slice(formStart, formEnd);
}

function htmlAttribute(input: string, name: string) {
  const match = input.match(new RegExp(`${name}="([^"]*)"`));
  return match?.[1]?.replaceAll('&quot;', '"').replaceAll('&amp;', '&').replaceAll('&#x27;', "'");
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function recoverOtpCode(destination: string, codeHash: string, purpose: string) {
  for (let attempt = 0; attempt < 10 ** CUSTOMER_OTP_LENGTH; attempt += 1) {
    const code = String(attempt).padStart(CUSTOMER_OTP_LENGTH, '0');
    const hash = createHash('sha256')
      .update(`${CUSTOMER_OTP_SECRET}:${purpose}:${destination}:${code}`)
      .digest('hex');
    if (hash === codeHash) return code;
  }
  throw new Error(`Unable to recover OTP code for ${destination}`);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main().catch((error) => {
  console.error(error);
  throw error;
});
