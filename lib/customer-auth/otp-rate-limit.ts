export type CustomerAuthEventLike = {
  eventType: string;
  phoneHash?: string | null;
  ipHash?: string | null;
  createdAt: Date;
};

export type OtpRequestThrottleConfig = {
  phoneWindowMs: number;
  maxPhoneRequestsPerWindow: number;
  phoneDailyWindowMs: number;
  maxPhoneRequestsPerDailyWindow: number;
  ipWindowMs: number;
  maxIpRequestsPerWindow: number;
  phoneIpWindowMs: number;
  maxPhoneIpRequestsPerWindow: number;
  resendCooldownMs: number;
};

export type OtpRequestThrottleDecision = {
  allowed: boolean;
  reasonCode?: OtpRequestThrottleReasonCode;
  messageKey: OtpRequestThrottleMessageKey;
  retryAfterMs?: number;
};

export type OtpRequestThrottleReasonCode =
  | 'missing_phone_hash'
  | 'phone_resend_cooldown'
  | 'phone_window_exceeded'
  | 'phone_daily_exceeded'
  | 'ip_window_exceeded'
  | 'phone_ip_window_exceeded';

export type OtpRequestThrottleMessageKey = 'otp_request_allowed' | 'otp_request_wait' | 'otp_request_unavailable';

export const OTP_REQUEST_ALLOWED_EVENT = 'otp_request_allowed';
export const OTP_REQUEST_BLOCKED_EVENT = 'otp_request_blocked';

export const DEFAULT_OTP_REQUEST_THROTTLE_CONFIG: OtpRequestThrottleConfig = {
  phoneWindowMs: 10 * 60 * 1000,
  maxPhoneRequestsPerWindow: 3,
  phoneDailyWindowMs: 24 * 60 * 60 * 1000,
  maxPhoneRequestsPerDailyWindow: 8,
  ipWindowMs: 10 * 60 * 1000,
  maxIpRequestsPerWindow: 10,
  phoneIpWindowMs: 10 * 60 * 1000,
  maxPhoneIpRequestsPerWindow: 3,
  resendCooldownMs: 60 * 1000
};

function elapsedSince(now: Date, event: CustomerAuthEventLike) {
  return now.getTime() - event.createdAt.getTime();
}

function retryAfterMs(now: Date, event: CustomerAuthEventLike, windowMs: number) {
  return Math.max(0, windowMs - elapsedSince(now, event));
}

function recentAllowedEvents(events: CustomerAuthEventLike[]) {
  return events.filter((event) => event.eventType === OTP_REQUEST_ALLOWED_EVENT);
}

function withinWindow(now: Date, events: CustomerAuthEventLike[], windowMs: number) {
  return events.filter((event) => elapsedSince(now, event) >= 0 && elapsedSince(now, event) < windowMs);
}

function maxRetryAfter(now: Date, events: CustomerAuthEventLike[], windowMs: number) {
  return events.reduce((maxMs, event) => Math.max(maxMs, retryAfterMs(now, event, windowMs)), 0);
}

export function evaluateOtpRequestThrottle(input: {
  phoneHash: string;
  ipHash?: string;
  events: CustomerAuthEventLike[];
  now?: Date;
  config?: Partial<OtpRequestThrottleConfig>;
}): OtpRequestThrottleDecision {
  const now = input.now ?? new Date();
  const config = { ...DEFAULT_OTP_REQUEST_THROTTLE_CONFIG, ...input.config };
  const phoneHash = input.phoneHash.trim();
  const ipHash = input.ipHash?.trim() ?? '';

  if (!phoneHash) {
    return {
      allowed: false,
      reasonCode: 'missing_phone_hash',
      messageKey: 'otp_request_unavailable'
    };
  }

  const allowedEvents = recentAllowedEvents(input.events);
  const phoneEvents = allowedEvents.filter((event) => event.phoneHash === phoneHash);
  const ipEvents = ipHash ? allowedEvents.filter((event) => event.ipHash === ipHash) : [];
  const phoneIpEvents = ipHash ? phoneEvents.filter((event) => event.ipHash === ipHash) : [];

  const cooldownEvents = withinWindow(now, phoneEvents, config.resendCooldownMs);
  if (cooldownEvents.length > 0) {
    return {
      allowed: false,
      reasonCode: 'phone_resend_cooldown',
      messageKey: 'otp_request_wait',
      retryAfterMs: maxRetryAfter(now, cooldownEvents, config.resendCooldownMs)
    };
  }

  const phoneWindowEvents = withinWindow(now, phoneEvents, config.phoneWindowMs);
  if (phoneWindowEvents.length >= config.maxPhoneRequestsPerWindow) {
    return {
      allowed: false,
      reasonCode: 'phone_window_exceeded',
      messageKey: 'otp_request_wait',
      retryAfterMs: maxRetryAfter(now, phoneWindowEvents, config.phoneWindowMs)
    };
  }

  const phoneDailyEvents = withinWindow(now, phoneEvents, config.phoneDailyWindowMs);
  if (phoneDailyEvents.length >= config.maxPhoneRequestsPerDailyWindow) {
    return {
      allowed: false,
      reasonCode: 'phone_daily_exceeded',
      messageKey: 'otp_request_wait',
      retryAfterMs: maxRetryAfter(now, phoneDailyEvents, config.phoneDailyWindowMs)
    };
  }

  const ipWindowEvents = withinWindow(now, ipEvents, config.ipWindowMs);
  if (ipWindowEvents.length >= config.maxIpRequestsPerWindow) {
    return {
      allowed: false,
      reasonCode: 'ip_window_exceeded',
      messageKey: 'otp_request_unavailable',
      retryAfterMs: maxRetryAfter(now, ipWindowEvents, config.ipWindowMs)
    };
  }

  const phoneIpWindowEvents = withinWindow(now, phoneIpEvents, config.phoneIpWindowMs);
  if (phoneIpWindowEvents.length >= config.maxPhoneIpRequestsPerWindow) {
    return {
      allowed: false,
      reasonCode: 'phone_ip_window_exceeded',
      messageKey: 'otp_request_wait',
      retryAfterMs: maxRetryAfter(now, phoneIpWindowEvents, config.phoneIpWindowMs)
    };
  }

  return {
    allowed: true,
    messageKey: 'otp_request_allowed'
  };
}

export function buildOtpRequestAuthEvent(input: {
  decision: OtpRequestThrottleDecision;
  phoneHash: string;
  ipHash?: string;
  userAgentHash?: string;
  purpose?: string;
  channel?: string;
}) {
  return {
    eventType: input.decision.allowed ? OTP_REQUEST_ALLOWED_EVENT : OTP_REQUEST_BLOCKED_EVENT,
    phoneHash: input.phoneHash || undefined,
    ipHash: input.ipHash || undefined,
    userAgentHash: input.userAgentHash || undefined,
    metadata: {
      purpose: input.purpose ?? 'login',
      channel: input.channel ?? 'sms',
      reasonCode: input.decision.reasonCode ?? null,
      messageKey: input.decision.messageKey,
      retryAfterMs: input.decision.retryAfterMs ?? null
    }
  };
}
