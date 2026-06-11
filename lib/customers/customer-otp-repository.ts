import 'server-only';

import { createHash, randomInt } from 'node:crypto';
import { hashCustomerAuthIp, hashCustomerAuthPhone, hashCustomerAuthUserAgent } from '@/lib/customer-auth/identity';
import {
  buildOtpRequestAuthEvent,
  DEFAULT_OTP_REQUEST_THROTTLE_CONFIG,
  evaluateOtpRequestThrottle,
  type CustomerAuthEventLike,
  type OtpRequestThrottleDecision,
  type OtpRequestThrottleMessageKey,
  type OtpRequestThrottleReasonCode
} from '@/lib/customer-auth/otp-rate-limit';
import { sendCustomerMessage } from '@/lib/customers/customer-message-provider';
import { normalizeCustomerPhone } from '@/lib/customers/customer-repository';
import { hasDatabase, prisma } from '@/lib/prisma';
import { getAppRuntimeMode } from '@/lib/runtime-mode';

const DEFAULT_OTP_TTL_MINUTES = 10;
const DEFAULT_OTP_MAX_ATTEMPTS = 5;
const DEFAULT_OTP_LENGTH = 6;

const THROTTLE_LOOKBACK_MS = Math.max(
  DEFAULT_OTP_REQUEST_THROTTLE_CONFIG.phoneWindowMs,
  DEFAULT_OTP_REQUEST_THROTTLE_CONFIG.phoneDailyWindowMs,
  DEFAULT_OTP_REQUEST_THROTTLE_CONFIG.ipWindowMs,
  DEFAULT_OTP_REQUEST_THROTTLE_CONFIG.phoneIpWindowMs,
  DEFAULT_OTP_REQUEST_THROTTLE_CONFIG.resendCooldownMs
);

type IssueOtpInput = {
  phone: string;
  purpose?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, string | number | boolean>;
};

type VerifyOtpInput = {
  phone: string;
  code: string;
  purpose?: string;
  ipAddress?: string;
  userAgent?: string;
};

type OtpThrottleStatusReason = 'cooldown' | 'rate_limited' | 'request-failed';

type OtpRequestStatus =
  | { ok: false; reason: 'database_required' }
  | {
      ok: false;
      reason: OtpThrottleStatusReason;
      retryAfterSeconds?: number;
      destination: string;
      purpose: string;
      phoneHash: string;
      ipHash?: string;
      userAgentHash?: string;
      decision: OtpRequestThrottleDecision;
    }
  | {
      ok: true;
      destination: string;
      purpose: string;
      phoneHash: string;
      ipHash?: string;
      userAgentHash?: string;
      decision: OtpRequestThrottleDecision;
    };

type VerifyAuthEventType = 'otp_verify_failed' | 'otp_verify_blocked' | 'otp_verify_success';

function optionalText(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function intEnv(name: string, fallback: number, min = 1, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number.parseInt(process.env[name] || String(fallback), 10);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function otpTtlMinutes() {
  return intEnv('CUSTOMER_OTP_TTL_MINUTES', DEFAULT_OTP_TTL_MINUTES);
}

function otpMaxAttempts() {
  return intEnv('CUSTOMER_OTP_MAX_ATTEMPTS', DEFAULT_OTP_MAX_ATTEMPTS);
}

function otpLength() {
  return intEnv('CUSTOMER_OTP_LENGTH', DEFAULT_OTP_LENGTH, 4, 8);
}

function expiresAt() {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + otpTtlMinutes());
  return expires;
}

function throttleLookbackStart(now = new Date()) {
  return new Date(now.getTime() - THROTTLE_LOOKBACK_MS);
}

function makeOtpCode() {
  const length = otpLength();
  const max = 10 ** length;
  return randomInt(0, max).toString().padStart(length, '0');
}

function statusForThrottleReason(reason?: OtpRequestThrottleReasonCode): OtpThrottleStatusReason {
  if (reason === 'phone_resend_cooldown') return 'cooldown';
  if (reason === 'missing_phone_hash') return 'request-failed';
  return 'rate_limited';
}

function getCustomerOtpHashSecret() {
  const customerSecret = process.env.CUSTOMER_OTP_SECRET?.trim();
  if (customerSecret) return customerSecret;

  if (getAppRuntimeMode() === 'production') {
    throw new Error('CUSTOMER_OTP_SECRET is required for customer OTP hashing in production.');
  }

  return process.env.ADMIN_SESSION_SECRET?.trim() || 'golara-dev-otp-secret';
}

export function hashOtpCode(destination: string, code: string, purpose = 'login') {
  const salt = getCustomerOtpHashSecret();
  return createHash('sha256')
    .update(`${salt}:${purpose}:${destination}:${code.trim()}`)
    .digest('hex');
}

async function deliverOtp(destination: string, code: string, purpose: string) {
  return sendCustomerMessage({
    to: destination,
    purpose,
    message: `Your Golara verification code is ${code}`,
    metadata: { channel: 'otp' }
  });
}

async function listRecentOtpRequestEvents(phoneHash: string, ipHash?: string, now = new Date()): Promise<CustomerAuthEventLike[]> {
  const events = await prisma.customerAuthEvent.findMany({
    where: {
      eventType: { in: ['otp_request_allowed', 'otp_request_blocked'] },
      createdAt: { gt: throttleLookbackStart(now) },
      OR: [
        { phoneHash },
        ...(ipHash ? [{ ipHash }] : [])
      ]
    },
    select: {
      eventType: true,
      phoneHash: true,
      ipHash: true,
      createdAt: true
    }
  });

  return events;
}

async function recordOtpRequestAuthEvent(input: {
  allowed: boolean;
  reasonCode?: OtpRequestThrottleReasonCode;
  messageKey: OtpRequestThrottleMessageKey;
  retryAfterMs?: number;
  phoneHash: string;
  ipHash?: string;
  userAgentHash?: string;
  purpose: string;
  channel?: string;
}) {
  const event = buildOtpRequestAuthEvent({
    decision: {
      allowed: input.allowed,
      reasonCode: input.reasonCode,
      messageKey: input.messageKey,
      retryAfterMs: input.retryAfterMs
    },
    phoneHash: input.phoneHash,
    ipHash: input.ipHash,
    userAgentHash: input.userAgentHash,
    purpose: input.purpose,
    channel: input.channel
  });

  return prisma.customerAuthEvent.create({
    data: {
      eventType: event.eventType,
      phoneHash: event.phoneHash,
      ipHash: event.ipHash,
      userAgentHash: event.userAgentHash,
      metadata: event.metadata
    }
  });
}

async function recordOtpVerifyAuthEvent(input: {
  eventType: VerifyAuthEventType;
  phoneHash: string;
  ipHash?: string;
  userAgentHash?: string;
  challengeId?: string;
  purpose: string;
  reason?: string;
  remainingAttempts?: number;
  attemptCount?: number;
  maxAttempts?: number;
}) {
  return prisma.customerAuthEvent.create({
    data: {
      eventType: input.eventType,
      phoneHash: input.phoneHash,
      ipHash: input.ipHash,
      userAgentHash: input.userAgentHash,
      challengeId: input.challengeId,
      metadata: {
        purpose: input.purpose,
        reason: input.reason || null,
        remainingAttempts: input.remainingAttempts ?? null,
        attemptCount: input.attemptCount ?? null,
        maxAttempts: input.maxAttempts ?? null
      }
    }
  });
}

export async function getCustomerOtpRequestStatus(phone: string, purpose = 'login', context?: { ipAddress?: string; userAgent?: string }): Promise<OtpRequestStatus> {
  if (!hasDatabase()) return { ok: false, reason: 'database_required' };

  const destination = normalizeCustomerPhone(phone);
  const phoneHash = hashCustomerAuthPhone(destination);
  const ipHash = hashCustomerAuthIp(context?.ipAddress) || undefined;
  const userAgentHash = hashCustomerAuthUserAgent(context?.userAgent) || undefined;
  const events = await listRecentOtpRequestEvents(phoneHash, ipHash);
  const decision = evaluateOtpRequestThrottle({
    phoneHash,
    ipHash,
    events
  });

  if (!decision.allowed) {
    return {
      ok: false,
      reason: statusForThrottleReason(decision.reasonCode),
      retryAfterSeconds: decision.retryAfterMs ? Math.ceil(decision.retryAfterMs / 1000) : undefined,
      destination,
      purpose,
      phoneHash,
      ipHash,
      userAgentHash,
      decision
    };
  }

  return {
    ok: true,
    destination,
    purpose,
    phoneHash,
    ipHash,
    userAgentHash,
    decision
  };
}

export async function issueCustomerOtp(input: IssueOtpInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for customer OTP challenges.');

  const status = await getCustomerOtpRequestStatus(input.phone, input.purpose || 'login', input);
  if (!status.ok) return status;

  const destination = status.destination;
  const purpose = status.purpose;
  const code = makeOtpCode();
  const codeHash = hashOtpCode(destination, code, purpose);

  await prisma.customerOtpChallenge.updateMany({
    where: {
      destination,
      purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() }
    },
    data: {
      consumedAt: new Date()
    }
  });

  await prisma.customerOtpChallenge.create({
    data: {
      destination,
      purpose,
      codeHash,
      expiresAt: expiresAt(),
      metadata: input.metadata ? { ...input.metadata, ipHash: status.ipHash || null, userAgentHash: status.userAgentHash || null } : { ipHash: status.ipHash || null, userAgentHash: status.userAgentHash || null }
    }
  });

  const delivery = await deliverOtp(destination, code, purpose);
  await recordOtpRequestAuthEvent({
    allowed: true,
    messageKey: 'otp_request_allowed',
    phoneHash: status.phoneHash,
    ipHash: status.ipHash,
    userAgentHash: status.userAgentHash,
    purpose,
    channel: delivery.provider
  });

  return {
    ok: true as const,
    destination,
    delivery
  };
}

export async function verifyCustomerOtp(input: VerifyOtpInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for customer OTP verification.');

  const destination = normalizeCustomerPhone(input.phone);
  const purpose = optionalText(input.purpose) || 'login';
  const phoneHash = hashCustomerAuthPhone(destination);
  const ipHash = hashCustomerAuthIp(input.ipAddress) || undefined;
  const userAgentHash = hashCustomerAuthUserAgent(input.userAgent) || undefined;
  const maxAttempts = otpMaxAttempts();

  const challenge = await prisma.customerOtpChallenge.findFirst({
    where: {
      destination,
      purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!challenge) {
    await recordOtpVerifyAuthEvent({
      eventType: 'otp_verify_failed',
      phoneHash,
      ipHash,
      userAgentHash,
      purpose,
      reason: 'missing_or_expired_challenge'
    });
    return { ok: false as const, reason: 'invalid_or_expired' as const };
  }

  if (challenge.attemptCount >= maxAttempts) {
    await recordOtpVerifyAuthEvent({
      eventType: 'otp_verify_blocked',
      phoneHash,
      ipHash,
      userAgentHash,
      challengeId: challenge.id,
      purpose,
      reason: 'max_attempts_exceeded',
      attemptCount: challenge.attemptCount,
      maxAttempts
    });
    return { ok: false as const, reason: 'too_many_attempts' as const };
  }

  const codeHash = hashOtpCode(destination, input.code, purpose);
  const nextAttemptCount = challenge.attemptCount + 1;

  if (codeHash !== challenge.codeHash) {
    await prisma.customerOtpChallenge.update({
      where: { id: challenge.id },
      data: { attemptCount: nextAttemptCount }
    });

    await recordOtpVerifyAuthEvent({
      eventType: nextAttemptCount >= maxAttempts ? 'otp_verify_blocked' : 'otp_verify_failed',
      phoneHash,
      ipHash,
      userAgentHash,
      challengeId: challenge.id,
      purpose,
      reason: nextAttemptCount >= maxAttempts ? 'max_attempts_exceeded' : 'invalid_code',
      remainingAttempts: Math.max(maxAttempts - nextAttemptCount, 0),
      attemptCount: nextAttemptCount,
      maxAttempts
    });

    return { ok: false as const, reason: nextAttemptCount >= maxAttempts ? 'too_many_attempts' as const : 'invalid_code' as const };
  }

  await prisma.customerOtpChallenge.update({
    where: { id: challenge.id },
    data: {
      consumedAt: new Date(),
      attemptCount: nextAttemptCount
    }
  });

  await recordOtpVerifyAuthEvent({
    eventType: 'otp_verify_success',
    phoneHash,
    ipHash,
    userAgentHash,
    challengeId: challenge.id,
    purpose,
    attemptCount: nextAttemptCount,
    maxAttempts
  });

  return { ok: true as const, destination, challenge };
}
