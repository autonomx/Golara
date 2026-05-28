import assert from 'node:assert/strict';
import {
  buildOtpRequestAuthEvent,
  DEFAULT_OTP_REQUEST_THROTTLE_CONFIG,
  evaluateOtpRequestThrottle,
  OTP_REQUEST_ALLOWED_EVENT,
  OTP_REQUEST_BLOCKED_EVENT,
  type CustomerAuthEventLike
} from '../../lib/customer-auth/otp-rate-limit';

const NOW = new Date('2026-05-28T17:30:00.000Z');
const PHONE = 'phone-hash-1';
const OTHER_PHONE = 'phone-hash-2';
const IP = 'ip-hash-1';
const OTHER_IP = 'ip-hash-2';

function minutesAgo(minutes: number) {
  return new Date(NOW.getTime() - minutes * 60 * 1000);
}

function allowedEvent(input: { phoneHash?: string; ipHash?: string; minutesAgo: number }): CustomerAuthEventLike {
  return {
    eventType: OTP_REQUEST_ALLOWED_EVENT,
    phoneHash: input.phoneHash,
    ipHash: input.ipHash,
    createdAt: minutesAgo(input.minutesAgo)
  };
}

function blockedEvent(input: { phoneHash?: string; ipHash?: string; minutesAgo: number }): CustomerAuthEventLike {
  return {
    eventType: OTP_REQUEST_BLOCKED_EVENT,
    phoneHash: input.phoneHash,
    ipHash: input.ipHash,
    createdAt: minutesAgo(input.minutesAgo)
  };
}

export async function runOtpRateLimitTests() {
  assert.deepEqual(evaluateOtpRequestThrottle({ phoneHash: PHONE, ipHash: IP, events: [], now: NOW }), {
    allowed: true,
    messageKey: 'otp_request_allowed'
  });

  assert.deepEqual(evaluateOtpRequestThrottle({ phoneHash: '   ', ipHash: IP, events: [], now: NOW }), {
    allowed: false,
    reasonCode: 'missing_phone_hash',
    messageKey: 'otp_request_unavailable'
  });

  const cooldownDecision = evaluateOtpRequestThrottle({
    phoneHash: PHONE,
    ipHash: IP,
    now: NOW,
    events: [allowedEvent({ phoneHash: PHONE, ipHash: IP, minutesAgo: 0.5 })]
  });
  assert.equal(cooldownDecision.allowed, false);
  assert.equal(cooldownDecision.reasonCode, 'phone_resend_cooldown');
  assert.equal(cooldownDecision.messageKey, 'otp_request_wait');
  assert.equal(cooldownDecision.retryAfterMs, 30_000);

  const phoneWindowEvents = [1, 2, 3].map((minutes) => allowedEvent({ phoneHash: PHONE, ipHash: OTHER_IP, minutesAgo: minutes }));
  const phoneWindowDecision = evaluateOtpRequestThrottle({ phoneHash: PHONE, ipHash: IP, now: NOW, events: phoneWindowEvents });
  assert.equal(phoneWindowDecision.allowed, false);
  assert.equal(phoneWindowDecision.reasonCode, 'phone_window_exceeded');
  assert.equal(phoneWindowDecision.messageKey, 'otp_request_wait');

  const phoneDailyEvents = Array.from({ length: DEFAULT_OTP_REQUEST_THROTTLE_CONFIG.maxPhoneRequestsPerDailyWindow }, (_, index) =>
    allowedEvent({ phoneHash: PHONE, ipHash: OTHER_IP, minutesAgo: 61 + index * 20 })
  );
  const phoneDailyDecision = evaluateOtpRequestThrottle({ phoneHash: PHONE, ipHash: IP, now: NOW, events: phoneDailyEvents });
  assert.equal(phoneDailyDecision.allowed, false);
  assert.equal(phoneDailyDecision.reasonCode, 'phone_daily_exceeded');
  assert.equal(phoneDailyDecision.messageKey, 'otp_request_wait');

  const ipWindowEvents = Array.from({ length: DEFAULT_OTP_REQUEST_THROTTLE_CONFIG.maxIpRequestsPerWindow }, (_, index) =>
    allowedEvent({ phoneHash: `${OTHER_PHONE}-${index}`, ipHash: IP, minutesAgo: 2 + index * 0.1 })
  );
  const ipWindowDecision = evaluateOtpRequestThrottle({ phoneHash: PHONE, ipHash: IP, now: NOW, events: ipWindowEvents });
  assert.equal(ipWindowDecision.allowed, false);
  assert.equal(ipWindowDecision.reasonCode, 'ip_window_exceeded');
  assert.equal(ipWindowDecision.messageKey, 'otp_request_unavailable');

  const phoneIpEvents = [2, 3, 4].map((minutes) => allowedEvent({ phoneHash: PHONE, ipHash: IP, minutesAgo: minutes }));
  const phoneIpDecision = evaluateOtpRequestThrottle({
    phoneHash: PHONE,
    ipHash: IP,
    now: NOW,
    events: phoneIpEvents,
    config: { maxPhoneRequestsPerWindow: 10 }
  });
  assert.equal(phoneIpDecision.allowed, false);
  assert.equal(phoneIpDecision.reasonCode, 'phone_ip_window_exceeded');
  assert.equal(phoneIpDecision.messageKey, 'otp_request_wait');

  const ignoredBlockedEvents = Array.from({ length: 20 }, (_, index) => blockedEvent({ phoneHash: PHONE, ipHash: IP, minutesAgo: index }));
  assert.deepEqual(evaluateOtpRequestThrottle({ phoneHash: PHONE, ipHash: IP, events: ignoredBlockedEvents, now: NOW }), {
    allowed: true,
    messageKey: 'otp_request_allowed'
  });

  const oldEvents = [allowedEvent({ phoneHash: PHONE, ipHash: IP, minutesAgo: 25 * 60 })];
  assert.deepEqual(evaluateOtpRequestThrottle({ phoneHash: PHONE, ipHash: IP, events: oldEvents, now: NOW }), {
    allowed: true,
    messageKey: 'otp_request_allowed'
  });

  assert.deepEqual(buildOtpRequestAuthEvent({
    decision: { allowed: true, messageKey: 'otp_request_allowed' },
    phoneHash: PHONE,
    ipHash: IP,
    userAgentHash: 'ua-hash',
    purpose: 'login',
    channel: 'sms'
  }), {
    eventType: OTP_REQUEST_ALLOWED_EVENT,
    phoneHash: PHONE,
    ipHash: IP,
    userAgentHash: 'ua-hash',
    metadata: {
      purpose: 'login',
      channel: 'sms',
      reasonCode: null,
      messageKey: 'otp_request_allowed',
      retryAfterMs: null
    }
  });

  assert.deepEqual(buildOtpRequestAuthEvent({
    decision: { allowed: false, reasonCode: 'phone_resend_cooldown', messageKey: 'otp_request_wait', retryAfterMs: 1234 },
    phoneHash: PHONE
  }), {
    eventType: OTP_REQUEST_BLOCKED_EVENT,
    phoneHash: PHONE,
    ipHash: undefined,
    userAgentHash: undefined,
    metadata: {
      purpose: 'login',
      channel: 'sms',
      reasonCode: 'phone_resend_cooldown',
      messageKey: 'otp_request_wait',
      retryAfterMs: 1234
    }
  });

  console.log('otp-rate-limit.test.ts passed');
}
