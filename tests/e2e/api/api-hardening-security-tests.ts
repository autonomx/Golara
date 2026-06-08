import assert from 'node:assert/strict';
import {
  appendServerActionFields,
  createAdminCookieJar,
  postSignedStripe,
  request,
  responseText,
  submitServerAction
} from './shared';
import { source } from './api-hardening-source';

export async function runSessionCookieSecurityHardeningTests() {
  const adminAuth = source('lib/admin-auth.ts');
  const customerCookie = source('lib/customers/customer-session-cookie.ts');
  const adminAuthCore = source('lib/admin-auth-core.ts');
  assert.match(adminAuth, /cookieStore\.set\([\s\S]*?httpOnly: true[\s\S]*?sameSite: 'lax'[\s\S]*?secure: process\.env\.NODE_ENV === 'production'[\s\S]*?path: '\/'[\s\S]*?maxAge: ADMIN_SESSION_MAX_AGE_SECONDS/);
  assert.match(customerCookie, /cookieStore\.set\([\s\S]*?httpOnly: true[\s\S]*?sameSite: 'lax'[\s\S]*?secure: process\.env\.NODE_ENV === 'production'[\s\S]*?path: '\/'[\s\S]*?maxAge/);
  assert.match(adminAuthCore, /timingSafeEqual/);
  assert.match(adminAuthCore, /ROLE_RANK[\s\S]*staff: 1[\s\S]*owner: 2/);

  const loginHtml = await responseText(await request('/admin/login'));
  const form = new FormData();
  appendServerActionFields(form, loginHtml, 'name="password"');
  form.set('password', 'golara-admin-local');
  const response = await submitServerAction('/admin/login', form, createAdminCookieJar());
  assert.equal([302, 303, 307, 308].includes(response.status), true);
  const setCookie = response.headers.get('set-cookie') ?? '';
  assert.match(setCookie, /golara_admin_session=/);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Lax/i);
  assert.match(setCookie, /Path=\//i);
  assert.match(setCookie, /Max-Age=/i);
}

export async function runPaymentProviderContractHardeningTests() {
  const stripeRoute = source('app/api/webhooks/payments/stripe/route.ts');
  const zarinpalRoute = source('app/api/webhooks/payments/zarinpal/route.ts');
  const signatureCore = source('lib/checkout/payment-webhook-signature.ts');
  const routeCore = source('lib/checkout/payment-webhook-route-core.ts');
  assert.match(stripeRoute, /const rawBody = await request\.text\(\)/);
  assert.match(zarinpalRoute, /const rawBody = await request\.text\(\)/);
  assert.match(signatureCore, /stripeSignaturePayload[\s\S]*?timestamp[\s\S]*?`\$\{timestamp\}\.\$\{input\.rawBody\}`/);
  assert.match(signatureCore, /x-zarinpal-signature[\s\S]*?x-golara-signature/);
  assert.match(signatureCore, /timingSafeEqual/);
  assert.match(routeCore, /Webhook payload must be a JSON object/);
  assert.match(routeCore, /needs_attention[\s\S]*?202/);

  const missingStripeSignature = await request('/api/webhooks/payments/stripe', {
    method: 'POST',
    body: JSON.stringify({ id: 'evt_api_e2e_missing_signature_hardening', type: 'checkout.session.completed' }),
    headers: { 'content-type': 'application/json' }
  });
  assert.equal(missingStripeSignature.status, 401);
  assert.deepEqual(await missingStripeSignature.json(), {
    ok: false,
    provider: 'stripe',
    status: 'invalid_signature',
    reason: 'missing_signature'
  });

  const signedArrayPayload = await postSignedStripe('/api/webhooks/payments/stripe', [] as unknown as Record<string, unknown>);
  assert.equal(signedArrayPayload.status, 400);
  const body = await signedArrayPayload.json() as { status?: string; message?: string };
  assert.equal(body.status, 'invalid');
  assert.match(body.message ?? '', /JSON object/);
}
