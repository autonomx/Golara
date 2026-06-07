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

type ApiFixture = {
  prisma: PrismaClient;
  cartToken: string;
  customerSessionToken: string;
  orderNumber: string;
  publicLookupToken: string;
  stripeProviderReference: string;
};

class CookieJar {
  private cookies = new Map<string, string>();

  set(name: string, value: string) {
    this.cookies.set(name, value);
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
    orderNumber: order.orderNumber,
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
      CHECKOUT_MODE: 'cart',
      CHECKOUT_DOMESTIC_CURRENCY: 'TOMAN',
      ADMIN_PASSWORD,
      ADMIN_SESSION_SECRET,
      ADMIN_ROLE: 'owner',
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

  const adminJar = new CookieJar();
  adminJar.set(
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
  await expectHtml('/admin', 200, ['Admin'], adminJar);
  await expectHtml('/admin/orders', 200, [fixture.orderNumber], adminJar);
  const order = await fixture.prisma.checkoutOrder.findUniqueOrThrow({ where: { orderNumber: fixture.orderNumber } });
  await expectHtml(`/admin/orders/${order.id}`, 200, [fixture.orderNumber, 'E2E Red Rose Bouquet'], adminJar);
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
  const body = await response.text();
  for (const text of expected) assert.match(body, new RegExp(escapeRegExp(text), 'i'), `${path} should contain ${text}`);
}

async function expectText(path: string, status: number, expected: string[]) {
  const response = await request(path);
  assert.equal(response.status, status, `${path} status`);
  const body = await response.text();
  for (const text of expected) assert.match(body, new RegExp(escapeRegExp(text), 'i'), `${path} should contain ${text}`);
}

async function request(path: string, init: RequestInit = {}) {
  return fetch(`${BASE_URL}${path}`, { redirect: 'manual', ...init });
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

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main().catch((error) => {
  console.error(error);
  throw error;
});
