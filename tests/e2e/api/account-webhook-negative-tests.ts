import assert from 'node:assert/strict';
import { CUSTOMER_SESSION_COOKIE_NAME } from '@/lib/customers/customer-session-cookie';
import {
  CookieJar,
  appendServerActionFields,
  assertRedirect,
  hashToken,
  postSignedStripe,
  postSignedZarinpal,
  recoverOtpCode,
  request,
  responseText,
  submitServerAction,
  type ApiFixture
} from './shared';

export async function runAccountWebhookNegativeTests(fixture: ApiFixture) {
  await runOtherCustomerOrderIsolationTest(fixture);
  await runExpiredOtpVerificationTest(fixture);
  await runOtpReuseFailsTest(fixture);
  await runOtpWrongPhoneFailsTest(fixture);
  await runTooManyOtpAttemptsTest(fixture);
  await runAccountPageGuardTests();
  await runLogoutRevokesCustomerSessionTest(fixture);
  await runWebhookUnknownReferenceTest();
  await runZarinpalDuplicateReplayTest(fixture);
}

async function runOtherCustomerOrderIsolationTest(fixture: ApiFixture) {
  const otherCustomer = await fixture.prisma.customerProfile.create({
    data: {
      phone: '+16045559566',
      displayName: 'API E2E Other Customer',
      email: 'api-other-customer.e2e@golara.test',
      locale: 'en-CA'
    }
  });
  const otherSessionToken = 'api-e2e-other-customer-session-token';
  await fixture.prisma.customerSession.create({
    data: {
      customerId: otherCustomer.id,
      tokenHash: hashToken(otherSessionToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });
  const jar = new CookieJar();
  jar.set(CUSTOMER_SESSION_COOKIE_NAME, otherSessionToken);
  const response = await request('/account/orders', { headers: { cookie: jar.header() } });
  assert.equal(response.status, 200);
  assert.doesNotMatch(await response.text(), new RegExp(fixture.orderNumber));
}

async function runExpiredOtpVerificationTest(fixture: ApiFixture) {
  const phone = '+16045559577';
  const challenge = await requestOtpChallenge(fixture, phone);
  await fixture.prisma.customerOtpChallenge.update({
    where: { id: challenge.id },
    data: { expiresAt: new Date(Date.now() - 60 * 1000) }
  });

  const response = await submitOtpVerification(phone, recoverOtpCode(challenge.destination, challenge.codeHash, challenge.purpose));
  assert.match(response.headers.get('location') ?? '', /status=(invalid_code|code_expired|code-sent|missing_or_expired)/);
}

async function runOtpReuseFailsTest(fixture: ApiFixture) {
  const phone = '+16045559621';
  const challenge = await requestOtpChallenge(fixture, phone);
  const code = recoverOtpCode(challenge.destination, challenge.codeHash, challenge.purpose);
  const jar = new CookieJar();
  const first = await submitOtpVerification(phone, code, jar);
  assertRedirect(first, '/account');
  assert.ok(jar.get(CUSTOMER_SESSION_COOKIE_NAME), 'valid OTP should set a customer session cookie');

  const second = await submitOtpVerification(phone, code, new CookieJar());
  assert.match(second.headers.get('location') ?? '', /status=missing_or_expired/);
  assert.equal(
    await fixture.prisma.customerSession.count({ where: { customer: { phone } } }),
    1
  );
}

async function runOtpWrongPhoneFailsTest(fixture: ApiFixture) {
  const phone = '+16045559622';
  const wrongPhone = '+16045559623';
  const challenge = await requestOtpChallenge(fixture, phone);
  const code = recoverOtpCode(challenge.destination, challenge.codeHash, challenge.purpose);

  const response = await submitOtpVerification(wrongPhone, code);
  assert.match(response.headers.get('location') ?? '', /status=missing_or_expired/);
  assert.equal(await fixture.prisma.customerSession.count({ where: { customer: { phone: wrongPhone } } }), 0);
}

async function runTooManyOtpAttemptsTest(fixture: ApiFixture) {
  const phone = '+16045559624';
  const challenge = await requestOtpChallenge(fixture, phone);

  let response: Response | undefined;
  for (let attempt = 0; attempt < challenge.maxAttempts; attempt += 1) {
    response = await submitOtpVerification(phone, '0000');
  }
  assert.match(response?.headers.get('location') ?? '', /status=too_many_attempts/);
  const blocked = await fixture.prisma.customerOtpChallenge.findUniqueOrThrow({ where: { id: challenge.id } });
  assert.equal(blocked.attemptCount, blocked.maxAttempts);
  assert.equal(await fixture.prisma.customerSession.count({ where: { customer: { phone } } }), 0);
  assert.equal(
    await fixture.prisma.customerAuthEvent.count({
      where: { challengeId: challenge.id, eventType: 'otp_verify_blocked' }
    }),
    1
  );
}

async function runAccountPageGuardTests() {
  const accountOrders = await request('/account/orders');
  assertRedirect(accountOrders, '/account?status=session-required');
  const accountAddresses = await request('/account/addresses');
  assertRedirect(accountAddresses, '/account?status=session-required');
}

async function runLogoutRevokesCustomerSessionTest(fixture: ApiFixture) {
  const sessionToken = 'api-e2e-logout-session-token';
  await fixture.prisma.customerSession.create({
    data: {
      customerId: fixture.customerId,
      tokenHash: hashToken(sessionToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });
  const jar = new CookieJar();
  jar.set(CUSTOMER_SESSION_COOKIE_NAME, sessionToken);
  const accountHtml = await responseText(await request('/account', { headers: { cookie: jar.header() } }));
  const logoutForm = new FormData();
  appendServerActionFields(logoutForm, accountHtml, 'Sign out');
  const logoutResponse = await submitServerAction('/account', logoutForm, jar);
  assertRedirect(logoutResponse, '/account?status=signed-out');

  const revoked = await fixture.prisma.customerSession.findFirstOrThrow({ where: { tokenHash: hashToken(sessionToken) } });
  assert.ok(revoked.revokedAt, 'logout should revoke the session row');
  const guarded = await request('/account/orders', { headers: { cookie: jar.header() } });
  assertRedirect(guarded, '/account?status=session-required');
}

async function runWebhookUnknownReferenceTest() {
  const unknownPayload = {
    id: 'evt_api_e2e_unknown_reference_1001',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_api_e2e_unknown_reference',
        payment_status: 'paid',
        amount_total: 250000,
        currency: 'toman',
        metadata: {
          orderNumber: 'API-E2E-UNKNOWN',
          publicLookupToken: 'api-e2e-unknown-token'
        }
      }
    }
  };
  const response = await postSignedStripe('/api/webhooks/payments/stripe', unknownPayload);
  assert.equal([200, 202, 404].includes(response.status), true);
  if (response.headers.get('content-type')?.includes('application/json')) {
    assert.equal(['recorded', 'needs_attention', 'missing_order', 'invalid'].includes((await response.json()).status), true);
  }
}

async function runZarinpalDuplicateReplayTest(fixture: ApiFixture) {
  const payload = {
    Authority: 'A000000000000000000000000gapapi',
    Status: 'OK',
    orderNumber: fixture.orderNumber,
    amount: 250000,
    currency: 'IRT'
  };
  const first = await postSignedZarinpal('/api/webhooks/payments/zarinpal', payload);
  const second = await postSignedZarinpal('/api/webhooks/payments/zarinpal', payload);
  assert.equal([200, 202].includes(first.status), true);
  assert.equal([200, 202].includes(second.status), true);
}

async function requestOtpChallenge(fixture: ApiFixture, phone: string) {
  const loginHtml = await responseText(await request('/account/login?returnTo=/account'));
  const requestOtpForm = new FormData();
  appendServerActionFields(requestOtpForm, loginHtml, 'name="phone"');
  requestOtpForm.set('phone', phone);
  requestOtpForm.set('returnTo', '/account');
  await submitServerAction('/account/login', requestOtpForm, new CookieJar());

  return fixture.prisma.customerOtpChallenge.findFirstOrThrow({
    where: { destination: phone, purpose: 'login', consumedAt: null },
    orderBy: { createdAt: 'desc' }
  });
}

async function submitOtpVerification(phone: string, code: string, jar = new CookieJar()) {
  const verifyHtml = await responseText(await request(`/account/login?status=code-sent&phone=${encodeURIComponent(phone)}&returnTo=/account`));
  const form = new FormData();
  appendServerActionFields(form, verifyHtml, 'name="code"');
  form.set('phone', phone);
  form.set('code', code);
  form.set('returnTo', '/account');
  return submitServerAction('/account/login', form, jar);
}
