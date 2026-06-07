import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import {
  ADMIN_SESSION_COOKIE_NAME,
  createAdminSessionCookieValue,
  getAdminAuthConfig
} from '@/lib/admin-auth-core';

export const PORT = Number.parseInt(process.env.API_E2E_PORT || '3100', 10);
export const BASE_URL = `http://127.0.0.1:${PORT}`;
export const READY_TIMEOUT_MS = Number.parseInt(process.env.API_E2E_READY_TIMEOUT_MS || '45000', 10);
export const WEBHOOK_SECRET = 'golara-api-e2e-webhook-secret';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'golara-admin-local';
export const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'golara-local-session-secret-change-before-production-2026';
export const CUSTOMER_OTP_SECRET = 'golara-api-e2e-otp-secret';
export const CUSTOMER_OTP_LENGTH = 4;

export type ApiFixture = {
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

export class CookieJar {
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

export async function startNextServer(databaseUrl: string) {
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

export async function stopNextServer(server?: ChildProcess) {
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

export async function expectHtml(path: string, status: number, expected: string[], jar?: CookieJar) {
  const response = await request(path, { headers: jar ? { cookie: jar.header() } : undefined });
  jar?.capture(response);
  assert.equal(response.status, status, `${path} status`);
  const body = await responseText(response);
  for (const text of expected) assert.match(body, new RegExp(escapeRegExp(text), 'i'), `${path} should contain ${text}`);
}

export async function expectText(path: string, status: number, expected: string[], jar?: CookieJar) {
  const response = await request(path, { headers: jar ? { cookie: jar.header() } : undefined });
  assert.equal(response.status, status, `${path} status`);
  const body = await responseText(response);
  for (const text of expected) assert.match(body, new RegExp(escapeRegExp(text), 'i'), `${path} should contain ${text}`);
}

export function createAdminCookieJar() {
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

export async function request(path: string, init: RequestInit = {}) {
  return fetch(`${BASE_URL}${path}`, { redirect: 'manual', ...init });
}

export async function submitServerAction(path: string, formData: FormData, jar: CookieJar) {
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

export async function postSignedStripe(path: string, payload: Record<string, unknown>) {
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

export async function postSignedZarinpal(path: string, payload: Record<string, unknown>) {
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

export function assertRedirect(response: Response, expectedPath: string) {
  assert.equal([302, 303, 307, 308].includes(response.status), true);
  assert.match(response.headers.get('location') ?? '', new RegExp(escapeRegExp(expectedPath)));
}

export async function responseText(response: Response) {
  return response.text();
}

export function extractServerActionName(html: string, marker: string, occurrence: 'first' | 'last' = 'first') {
  const formHtml = extractServerActionFormHtml(html, marker, occurrence);
  const actionMatch = formHtml.match(/name="(\$ACTION_(?:ID|REF)_[^"]+)"/);
  assert.ok(actionMatch?.[1], `Expected server action id for marker ${marker}`);
  return actionMatch[1];
}

export function appendServerActionFields(formData: FormData, html: string, marker: string, occurrence: 'first' | 'last' = 'first') {
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
  if (matchingForms.length > 0) return occurrence === 'last' ? matchingForms[matchingForms.length - 1] : matchingForms[0];

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

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function recoverOtpCode(destination: string, codeHash: string, purpose: string) {
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
