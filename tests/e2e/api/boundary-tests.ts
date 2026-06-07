import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
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

const PORT = Number.parseInt(process.env.API_E2E_BOUNDARY_PORT || '3101', 10);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const READY_TIMEOUT_MS = Number.parseInt(process.env.API_E2E_READY_TIMEOUT_MS || '45000', 10);
const WEBHOOK_SECRET = 'golara-api-e2e-webhook-secret';
const CUSTOMER_OTP_SECRET = 'golara-api-e2e-otp-secret';
const CUSTOMER_OTP_LENGTH = 4;

type BoundaryFixture = {
  prisma: PrismaClient;
  customerId: string;
  orderNumber: string;
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
    const fixture = await prepareBoundaryFixture(prisma);
    server = await startNextServer(config.databaseUrl);

    await runAccountBoundaryTests(fixture);
    await runWebhookBoundaryTests(fixture);

    console.log('api boundary HTTP E2E tests passed');
  } finally {
    await stopNextServer(server);
    await prisma.$disconnect();
  }
}

async function prepareBoundaryFixture(prisma: PrismaClient): Promise<BoundaryFixture> {
  await prisma.$connect();
  await resetLifecycleDatabase(prisma);
  await createLifecycleChannel(prisma);
  const category = await createLifecycleCategory(prisma);
  const productType = await createLifecycleProductType(prisma);
  const catalog = await createLifecycleProductWithVariantAndStock(prisma, {
    categoryId: category.id,
    productTypeId: productType.id
  });
  const customer = await createLifecycleCustomer(prisma);

  const order = await prisma.checkoutOrder.create({
    data: {
      orderNumber: 'API-E2E-BOUNDARY-1001',
      publicLookupToken: 'api-e2e-boundary-order-token',
      customerId: customer.customer.id,
      addressId: customer.address.id,
      status: 'pending_payment',
      checkoutMode: 'cart',
      currency: 'TOMAN',
      subtotalCents: 125000,
      totalCents: 125000,
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
          quantity: 1,
          unitPriceCents: catalog.variant.priceCents,
          lineTotalCents: catalog.variant.priceCents
        }
      },
      paymentAttempts: {
        create: {
          provider: 'stripe',
          status: 'created',
          amountCents: 125000,
          currency: 'TOMAN',
          providerReference: 'cs_api_e2e_boundary_1001'
        }
      }
    }
  });

  return {
    prisma,
    customerId: customer.customer.id,
    orderNumber: order.orderNumber,
    publicLookupToken: order.publicLookupToken ?? '',
    stripeProviderReference: 'cs_api_e2e_boundary_1001'
  };
}

async function runAccountBoundaryTests(fixture: BoundaryFixture) {
  const expiredToken = 'api-e2e-expired-customer-session-token';
  await fixture.prisma.customerSession.create({
    data: {
      customerId: fixture.customerId,
      tokenHash: hashToken(expiredToken),
      expiresAt: new Date(Date.now() - 60 * 1000)
    }
  });

  const expiredJar = new CookieJar();
  expiredJar.set(CUSTOMER_SESSION_COOKIE_NAME, expiredToken);
  const expiredResponse = await request('/account/orders', { headers: { cookie: expiredJar.header() } });
  assertRedirect(expiredResponse, '/account?status=session-required');

  const loginJar = new CookieJar();
  const phone = '+16045559444';
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
  const correctCode = recoverOtpCode(challenge.destination, challenge.codeHash, challenge.purpose);
  const wrongCode = correctCode === '0000' ? '0001' : '0000';
  const verifyHtml = await responseText(await request(`/account/login?status=code-sent&phone=${encodeURIComponent(phone)}&returnTo=/account`));
  const verifyForm = new FormData();
  appendServerActionFields(verifyForm, verifyHtml, 'name="code"');
  verifyForm.set('phone', phone);
  verifyForm.set('code', wrongCode);
  verifyForm.set('returnTo', '/account');
  const verifyResponse = await submitServerAction('/account/login', verifyForm, loginJar);
  assert.match(verifyResponse.headers.get('location') ?? '', /status=invalid_code/);
  assert.equal(loginJar.get(CUSTOMER_SESSION_COOKIE_NAME), undefined);
}

async function runWebhookBoundaryTests(fixture: BoundaryFixture) {
  const invalidJson = await postSignedStripeRaw('/api/webhooks/payments/stripe', 'not-json');
  assert.equal(invalidJson.status, 400);
  assert.equal((await invalidJson.json()).status, 'invalid');

  const paidPayload = stripePayload({
    id: 'evt_api_e2e_boundary_paid_1001',
    type: 'checkout.session.completed',
    paymentStatus: 'paid',
    fixture
  });
  const paid = await postSignedStripe('/api/webhooks/payments/stripe', paidPayload);
  assert.equal(paid.status, 200);
  assert.equal((await paid.json()).status, 'recorded');

  let attempt = await fixture.prisma.checkoutPaymentAttempt.findFirstOrThrow({
    where: { providerReference: fixture.stripeProviderReference }
  });
  let order = await fixture.prisma.checkoutOrder.findUniqueOrThrow({ where: { orderNumber: fixture.orderNumber } });
  assert.equal(attempt.status, 'verified_paid');
  assert.equal(order.status, 'paid');

  const failedPayload = stripePayload({
    id: 'evt_api_e2e_boundary_failed_after_paid_1001',
    type: 'checkout.session.async_payment_failed',
    paymentStatus: 'failed',
    fixture
  });
  const failed = await postSignedStripe('/api/webhooks/payments/stripe', failedPayload);
  assert.equal(failed.status, 200);
  assert.equal((await failed.json()).status, 'recorded');

  attempt = await fixture.prisma.checkoutPaymentAttempt.findFirstOrThrow({
    where: { providerReference: fixture.stripeProviderReference }
  });
  order = await fixture.prisma.checkoutOrder.findUniqueOrThrow({ where: { orderNumber: fixture.orderNumber } });
  assert.equal(attempt.status, 'verified_paid');
  assert.equal(order.status, 'paid');
}

function stripePayload(input: {
  id: string;
  type: string;
  paymentStatus: string;
  fixture: BoundaryFixture;
}) {
  return {
    id: input.id,
    type: input.type,
    data: {
      object: {
        id: input.fixture.stripeProviderReference,
        payment_status: input.paymentStatus,
        amount_total: 125000,
        currency: 'toman',
        metadata: {
          orderNumber: input.fixture.orderNumber,
          publicLookupToken: input.fixture.publicLookupToken
        }
      }
    }
  };
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
      CUSTOMER_MESSAGE_PROVIDER: 'log',
      CUSTOMER_OTP_SECRET,
      CUSTOMER_OTP_LENGTH: String(CUSTOMER_OTP_LENGTH),
      STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
      ZARINPAL_WEBHOOK_SECRET: WEBHOOK_SECRET
    }
  });
  server.stdout?.on('data', (chunk) => process.stdout.write(`[next-boundary] ${chunk}`));
  server.stderr?.on('data', (chunk) => process.stderr.write(`[next-boundary] ${chunk}`));
  await waitForReady(server);
  return server;
}

async function stopNextServer(server?: ChildProcess) {
  if (!server || server.killed) return;
  if (process.platform === 'win32' && server.pid) {
    await new Promise<void>((resolve) => {
      const killer = spawn('taskkill', ['/PID', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
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
      const response = await fetch(BASE_URL);
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${BASE_URL}: ${lastError}`);
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
  return postSignedStripeRaw(path, JSON.stringify(payload));
}

async function postSignedStripeRaw(path: string, rawBody: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac('sha256', WEBHOOK_SECRET).update(`${timestamp}.${rawBody}`).digest('hex');
  return request(path, {
    method: 'POST',
    body: rawBody,
    headers: {
      'content-type': 'application/json',
      'stripe-signature': `t=${timestamp},v1=${signature}`
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

function appendServerActionFields(formData: FormData, html: string, marker: string) {
  const formHtml = extractServerActionFormHtml(html, marker);
  const actionInputs = [...formHtml.matchAll(/<input[^>]+>/g)]
    .map((match) => match[0])
    .map((input) => ({ name: htmlAttribute(input, 'name'), value: htmlAttribute(input, 'value') ?? '' }))
    .filter((input): input is { name: string; value: string } => Boolean(input.name?.startsWith('$ACTION_')));

  assert.ok(actionInputs.some((input) => /^\$ACTION_(ID|REF)_/.test(input.name)), `Expected server action fields for marker ${marker}`);
  for (const input of actionInputs) formData.set(input.name, input.value);
}

function extractServerActionFormHtml(html: string, marker: string) {
  const matchingForm = [...html.matchAll(/<form[\s\S]*?<\/form>/g)].map((match) => match[0]).find((formHtml) => formHtml.includes(marker));
  assert.ok(matchingForm, `Expected form marker ${marker}`);
  return matchingForm;
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
    const hash = createHash('sha256').update(`${CUSTOMER_OTP_SECRET}:${purpose}:${destination}:${code}`).digest('hex');
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
