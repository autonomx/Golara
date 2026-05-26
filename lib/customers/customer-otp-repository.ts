import 'server-only';

import { createHash, randomInt } from 'node:crypto';
import { sendCustomerMessage } from '@/lib/customers/customer-message-provider';
import { normalizeCustomerPhone } from '@/lib/customers/customer-repository';
import { hasDatabase, prisma } from '@/lib/prisma';

const DEFAULT_OTP_TTL_MINUTES = 10;
const DEFAULT_OTP_MAX_ATTEMPTS = 5;
const DEFAULT_OTP_LENGTH = 6;
const DEFAULT_OTP_RESEND_COOLDOWN_SECONDS = 60;
const DEFAULT_OTP_REQUEST_WINDOW_MINUTES = 15;
const DEFAULT_OTP_MAX_REQUESTS_PER_WINDOW = 5;

type IssueOtpInput = {
  phone: string;
  purpose?: string;
  metadata?: Record<string, string | number | boolean>;
};

type VerifyOtpInput = {
  phone: string;
  code: string;
  purpose?: string;
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

function resendCooldownSeconds() {
  return intEnv('CUSTOMER_OTP_RESEND_COOLDOWN_SECONDS', DEFAULT_OTP_RESEND_COOLDOWN_SECONDS);
}

function requestWindowMinutes() {
  return intEnv('CUSTOMER_OTP_REQUEST_WINDOW_MINUTES', DEFAULT_OTP_REQUEST_WINDOW_MINUTES);
}

function maxRequestsPerWindow() {
  return intEnv('CUSTOMER_OTP_MAX_REQUESTS_PER_WINDOW', DEFAULT_OTP_MAX_REQUESTS_PER_WINDOW);
}

function expiresAt() {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + otpTtlMinutes());
  return expires;
}

function requestWindowStart() {
  const since = new Date();
  since.setMinutes(since.getMinutes() - requestWindowMinutes());
  return since;
}

function cooldownStart() {
  const since = new Date();
  since.setSeconds(since.getSeconds() - resendCooldownSeconds());
  return since;
}

function makeOtpCode() {
  const length = otpLength();
  const max = 10 ** length;
  return randomInt(0, max).toString().padStart(length, '0');
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

export async function getCustomerOtpRequestStatus(phone: string, purpose = 'login') {
  if (!hasDatabase()) return { ok: false as const, reason: 'database_required' };

  const destination = normalizeCustomerPhone(phone);
  const recentActive = await prisma.customerOtpChallenge.findFirst({
    where: {
      destination,
      purpose,
      createdAt: { gt: cooldownStart() }
    },
    orderBy: { createdAt: 'desc' }
  });
  if (recentActive) {
    return { ok: false as const, reason: 'cooldown', retryAfterSeconds: resendCooldownSeconds() };
  }

  const recentCount = await prisma.customerOtpChallenge.count({
    where: {
      destination,
      purpose,
      createdAt: { gt: requestWindowStart() }
    }
  });
  if (recentCount >= maxRequestsPerWindow()) {
    return { ok: false as const, reason: 'rate_limited', retryAfterSeconds: requestWindowMinutes() * 60 };
  }

  return { ok: true as const, destination, purpose };
}

export async function issueCustomerOtp(input: IssueOtpInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for customer OTP challenges.');

  const destination = normalizeCustomerPhone(input.phone);
  const purpose = optionalText(input.purpose) || 'login';
  const requestStatus = await getCustomerOtpRequestStatus(destination, purpose);
  if (!requestStatus.ok) return requestStatus;

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
    return { ok: false as const, reason: 'delivery_failed', delivery };
  }

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
