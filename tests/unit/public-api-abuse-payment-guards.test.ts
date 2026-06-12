import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { evaluateOtpRequestThrottle, OTP_REQUEST_BLOCKED_EVENT } from '../../lib/customer-auth/otp-rate-limit';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPublicApiAbusePaymentGuardTests() {
  const publicOrderRepository = source('lib/checkout/public-order-repository.ts');
  const otpRepository = source('lib/customers/customer-otp-repository.ts');
  const otpThrottle = source('lib/customer-auth/otp-rate-limit.ts');
  const stripeRoute = source('app/api/webhooks/payments/stripe/route.ts');
  const zarinpalRoute = source('app/api/webhooks/payments/zarinpal/route.ts');

  assert.match(publicOrderRepository, /normalizePublicOrderLookupToken/);
  assert.match(publicOrderRepository, /PUBLIC_ORDER_LOOKUP_TOKEN_MIN_LENGTH = 32/);
  assert.match(publicOrderRepository, /PUBLIC_ORDER_LOOKUP_TOKEN_MAX_LENGTH = 128/);
  assert.match(publicOrderRepository, /PUBLIC_ORDER_LOOKUP_TOKEN_PATTERN/);
  assert.match(publicOrderRepository, /findUnique\(\{\s*where: \{ publicLookupToken: normalized \}/s);
  assert.doesNotMatch(publicOrderRepository, /customer:\s*\{/);
  assert.doesNotMatch(publicOrderRepository, /email:\s*true/);
  assert.doesNotMatch(publicOrderRepository, /phone:\s*true/);
  assert.doesNotMatch(publicOrderRepository, /address:\s*true/);
  assert.doesNotMatch(publicOrderRepository, /provider:\s*true/);

  assert.match(otpRepository, /listRecentOtpRequestEvents/);
  assert.match(otpRepository, /recordOtpRequestAuthEvent/);
  assert.match(otpRepository, /eventType: event\.eventType/);
  assert.match(otpRepository, /reasonCode: input\.decision\.reasonCode/);
  assert.match(otpThrottle, new RegExp(OTP_REQUEST_BLOCKED_EVENT));

  const now = new Date('2026-06-11T00:00:00.000Z');
  const events = Array.from({ length: 10 }, (_, index) => ({
    eventType: 'otp_request_allowed',
    phoneHash: `phone-${index}`,
    ipHash: 'ip-abuse',
    createdAt: new Date(now.getTime() - index * 1000)
  }));
  const blockedByIp = evaluateOtpRequestThrottle({
    phoneHash: 'new-phone',
    ipHash: 'ip-abuse',
    events,
    now
  });
  assert.equal(blockedByIp.allowed, false);
  assert.equal(blockedByIp.reasonCode, 'ip_window_exceeded');

  assert.match(stripeRoute, /validatePaymentWebhookRawBody/);
  assert.match(zarinpalRoute, /validatePaymentWebhookRawBody/);
  assert.match(stripeRoute, /request\.text\(\)/);
  assert.match(zarinpalRoute, /request\.text\(\)/);

  console.log('public-api-abuse-payment-guards.test.ts passed');
}

if (process.argv[1]?.endsWith('public-api-abuse-payment-guards.test.ts')) {
  runPublicApiAbusePaymentGuardTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
