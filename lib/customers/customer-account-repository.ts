import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import { hasDatabase, prisma } from '@/lib/prisma';
import { normalizeCustomerPhone, upsertCustomerProfile } from '@/lib/customers/customer-repository';

const DEFAULT_CUSTOMER_SESSION_DAYS = 30;

type LinkCustomerAccountInput = {
  phone: string;
  displayName?: string;
  email?: string;
  locale?: string;
  provider?: string;
  providerAccountId?: string;
  passwordHash?: string;
};

type CreateCustomerSessionInput = {
  customerId: string;
  provider?: string;
  userAgent?: string;
  ipAddress?: string;
};

function optionalText(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function sessionTtlDays() {
  const parsed = Number.parseInt(process.env.CUSTOMER_SESSION_TTL_DAYS || String(DEFAULT_CUSTOMER_SESSION_DAYS), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CUSTOMER_SESSION_DAYS;
}

function expiresAt() {
  const expires = new Date();
  expires.setDate(expires.getDate() + sessionTtlDays());
  return expires;
}

function makeSessionToken() {
  return randomBytes(32).toString('base64url');
}

export function hashCustomerSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function hashIpAddress(ipAddress?: string) {
  const normalized = optionalText(ipAddress);
  if (!normalized) return undefined;
  return createHash('sha256').update(normalized).digest('hex');
}

export async function linkCustomerAccount(input: LinkCustomerAccountInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for customer accounts.');

  const customer = await upsertCustomerProfile({
    phone: input.phone,
    displayName: input.displayName,
    email: input.email,
    locale: input.locale
  });
  const provider = optionalText(input.provider) || 'phone';
  const providerAccountId = optionalText(input.providerAccountId) || normalizeCustomerPhone(input.phone);

  return prisma.customerAccount.upsert({
    where: { provider_providerAccountId: { provider, providerAccountId } },
    create: {
      customerId: customer.id,
      provider,
      providerAccountId,
      email: optionalText(input.email),
      phone: normalizeCustomerPhone(input.phone),
      passwordHash: optionalText(input.passwordHash),
      phoneVerifiedAt: provider === 'phone' ? new Date() : undefined,
      lastLoginAt: new Date()
    },
    update: {
      customerId: customer.id,
      email: optionalText(input.email),
      phone: normalizeCustomerPhone(input.phone),
      passwordHash: optionalText(input.passwordHash),
      lastLoginAt: new Date()
    },
    include: { customer: true }
  });
}

export async function createCustomerSession(input: CreateCustomerSessionInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for customer sessions.');

  const token = makeSessionToken();
  const session = await prisma.customerSession.create({
    data: {
      customerId: input.customerId,
      tokenHash: hashCustomerSessionToken(token),
      provider: optionalText(input.provider) || 'customer',
      userAgent: optionalText(input.userAgent),
      ipHash: hashIpAddress(input.ipAddress),
      expiresAt: expiresAt()
    },
    include: { customer: true }
  });

  return { token, session };
}

export async function getCustomerSession(token?: string) {
  const normalized = optionalText(token);
  if (!normalized || !hasDatabase()) return null;

  return prisma.customerSession.findFirst({
    where: {
      tokenHash: hashCustomerSessionToken(normalized),
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: {
      customer: {
        include: {
          addresses: {
            orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }]
          }
        }
      }
    }
  });
}

export async function revokeCustomerSession(token?: string) {
  const normalized = optionalText(token);
  if (!normalized || !hasDatabase()) return null;

  return prisma.customerSession.updateMany({
    where: {
      tokenHash: hashCustomerSessionToken(normalized),
      revokedAt: null
    },
    data: { revokedAt: new Date() }
  });
}

export async function expireOldCustomerSessions() {
  if (!hasDatabase()) return { count: 0 };

  return prisma.customerSession.updateMany({
    where: {
      revokedAt: null,
      expiresAt: { lte: new Date() }
    },
    data: { revokedAt: new Date() }
  });
}

export async function listCustomerOrders(customerId: string) {
  if (!hasDatabase()) return [];

  return prisma.checkoutOrder.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: { orderBy: { createdAt: 'asc' } },
      paymentAttempts: { orderBy: { createdAt: 'desc' }, take: 1 },
      timelineEvents: { orderBy: { createdAt: 'desc' }, take: 3 }
    }
  });
}
