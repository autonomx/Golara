import 'server-only';

import { createHash, randomInt } from 'node:crypto';
import { hasDatabase, prisma } from '@/lib/prisma';
import { normalizeCustomerPhone } from '@/lib/customers/customer-repository';

const DEFAULT_OTP_TTL_MINUTES = 10;
const DEFAULT_OTP_MAX_ATTEMPTS = 5;
const DEFAULT_OTP_LENGTH = 6;

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

function otpTtlMinutes() {
  const parsed = Number.parseInt(process.env.CUSTOMER_OTP_TTL_MINUTES || String(DEFAULT_OTP_TTL_MINUTES), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_OTP_TTL_MINUTES;
}

function otpMaxAttempts() {
  const parsed = Number.parseInt(process.env.CUSTOMER_OTP_MAX_ATTEMPTS || String(DEFAULT_OTP_MAX_ATTEMPTS), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_OTP_MAX_ATTEMPTS;
}

function otpLength() {
  const parsed = Number.parseInt(process.env.CUSTOMER_OTP_LENGTH || String(DEFAULT_OTP_LENGTH), 10);
  return Number.isFinite(parsed) && parsed >= 4 && parsed <= 8 ? parsed : DEFAULT_OTP_LENGTH;
}

function expiresAt() {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + otpTtlMinutes());
  return expires;
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

async function logOtpDelivery(destination: string, code: string, purpose: string) {
  if (process.env.CUSTOMER_OTP_DELIVERY_PROVIDER && process.env.CUSTOMER_OTP_DELIVERY_PROVIDER !== 'log') return;
  console.info('[customer-otp] development delivery', { destination, code, purpose });
}

export async function issueCustomerOtp(input: IssueOtpInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for customer OTP challenges.');

  const destination = normalizeCustomerPhone(input.phone);
  const purpose = optionalText(input.purpose) || 'login';
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

  const challenge = await prisma.customerOtpChallenge.create({
    data: {
      channel: 'sms',
      destination,
      purpose,
      codeHash: hashOtpCode(destination, code, purpose),
      maxAttempts: otpMaxAttempts(),
      expiresAt: expiresAt(),
      metadata: input.metadata || undefined
    }
  });

  await logOtpDelivery(destination, code, purpose);
  return { challenge, expiresAt: challenge.expiresAt };
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
