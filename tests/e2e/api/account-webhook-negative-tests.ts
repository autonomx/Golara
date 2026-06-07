import assert from 'node:assert/strict';
import { CUSTOMER_SESSION_COOKIE_NAME } from '@/lib/customers/customer-session-cookie';
import {
  CookieJar,
  appendServerActionFields,
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
  const loginHtml = await responseText(await request('/account/login?returnTo=/account'));
  const requestOtpForm = new FormData();
  appendServerActionFields(requestOtpForm, loginHtml, 'name="phone"');
  requestOtpForm.set('phone', phone);
  requestOtpForm.set('returnTo', '/account');
  await submitServerAction('/account/login', requestOtpForm, new CookieJar());

  const challenge = await fixture.prisma.customerOtpChallenge.findFirstOrThrow({
    where: { destination: phone, purpose: 'login', consumedAt: null },
    orderBy: { createdAt: 'desc' }
  });
  await fixture.prisma.customerOtpChallenge.update({
    where: { id: challenge.id },
    data: { expiresAt: new Date(Date.now() - 60 * 1000) }
  });

  const verifyHtml = await responseText(await request(`/account/login?status=code-sent&phone=${encodeURIComponent(phone)}&returnTo=/account`));
  const expiredForm = new FormData();
  appendServerActionFields(expiredForm, verifyHtml, 'name="code"');
  expiredForm.set('phone', phone);
  expiredForm.set('code', recoverOtpCode(challenge.destination, challenge.codeHash, challenge.purpose));
  expiredForm.set('returnTo', '/account');
  const response = await submitServerAction('/account/login', expiredForm, new CookieJar());
  assert.match(response.headers.get('location') ?? '', /status=(invalid_code|code_expired|code-sent)/);
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
