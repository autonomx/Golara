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

export function hashOtpCode(destination: string, code: string, purpose = 'login') {
  const salt = process.env.CUSTOMER_OTP_SECRET || process.env.ADMIN_SESSION_SECRET || 'golara-dev-otp-secret';
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

  const destination = normalizeCustomerPhone(input.phone);
  const purpose = optionalText(input.purpose) || 'login';
  const requestStatus = await getCustomerOtpRequestStatus(destination, purpose, {
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });
  if (!requestStatus.ok) {
    if (requestStatus.reason !== 'database_required') {
      await recordOtpRequestAuthEvent({
        allowed: false,
        reasonCode: requestStatus.decision.reasonCode,
        messageKey: requestStatus.decision.messageKey,
        retryAfterMs: requestStatus.decision.retryAfterMs,
        phoneHash: requestStatus.phoneHash,
        ipHash: requestStatus.ipHash,
        userAgentHash: requestStatus.userAgentHash,
        purpose
      });
    }
    return requestStatus;
  }

  const code = makeOtpCode();

  await prisma.customerOtpChallenge.updateMany({
    where: {
      destination,
      purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() }
    },
    data: { consumedAt: new Date() }
  });

  const delivery = await deliverOtp(destination, code, purpose);
  if (!delivery.ok) {
    await prisma.customerAuthEvent.create({
      data: {
        eventType: 'otp_delivery_failed',
        phoneHash: requestStatus.phoneHash,
        ipHash: requestStatus.ipHash,
        userAgentHash: requestStatus.userAgentHash,
        metadata: {
          purpose,
          channel: 'sms',
          provider: delivery.provider,
          skipped: Boolean(delivery.skipped)
        }
      }
    });
    return { ok: false as const, reason: 'delivery_failed', delivery };
  }

  await recordOtpRequestAuthEvent({
    allowed: true,
    messageKey: 'otp_request_allowed',
    phoneHash: requestStatus.phoneHash,
    ipHash: requestStatus.ipHash,
    userAgentHash: requestStatus.userAgentHash,
    purpose,
    channel: delivery.provider
  });

  const challenge = await prisma.customerOtpChallenge.create({
    data: {
      channel: delivery.provider,
      destination,
      purpose,
      codeHash: hashOtpCode(destination, code, purpose),
      maxAttempts: otpMaxAttempts(),
      expiresAt: expiresAt(),
      metadata: {
        ...(input.metadata || {}),
        deliveryProvider: delivery.provider,
        deliveryReference: delivery.reference || ''
      }
    }
  });

  return { ok: true as const, challenge, expiresAt: challenge.expiresAt, delivery };
}

export async function verifyCustomerOtp(input: VerifyOtpInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for customer OTP challenges.');

  const destination = normalizeCustomerPhone(input.phone);
  const purpose = optionalText(input.purpose) || 'login';
  const challenge = await prisma.customerOtpChallenge.findFirst({
    where: {
      destination,
      purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!challenge) return { ok: false as const, reason: 'missing_or_expired' };
  if (challenge.attemptCount >= challenge.maxAttempts) {
    await prisma.customerOtpChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });
    return { ok: false as const, reason: 'too_many_attempts' };
  }

  const codeHash = hashOtpCode(destination, input.code, purpose);
  if (codeHash !== challenge.codeHash) {
    const updated = await prisma.customerOtpChallenge.update({
      where: { id: challenge.id },
      data: { attemptCount: { increment: 1 } }
    });
    return {
      ok: false as const,
      reason: updated.attemptCount >= updated.maxAttempts ? 'too_many_attempts' : 'invalid_code',
      remainingAttempts: Math.max(0, updated.maxAttempts - updated.attemptCount)
    };
  }

  const consumed = await prisma.customerOtpChallenge.update({
    where: { id: challenge.id },
    data: {
      consumedAt: new Date(),
      attemptCount: { increment: 1 }
    }
  });

  return { ok: true as const, challenge: consumed, destination, purpose };
}

export async function expireOldCustomerOtps() {
  if (!hasDatabase()) return { count: 0 };

  return prisma.customerOtpChallenge.updateMany({
    where: {
      consumedAt: null,
      expiresAt: { lte: new Date() }
    },
    data: { consumedAt: new Date() }
  });
}
