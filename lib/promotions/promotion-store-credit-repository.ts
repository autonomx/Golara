import 'server-only';

import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { hasDatabase, prisma } from '@/lib/prisma';

export const PROMOTION_STORE_CREDIT_STATUSES = ['draft', 'active', 'paused', 'depleted', 'expired', 'archived'] as const;

export type PromotionStoreCreditStatus = (typeof PROMOTION_STORE_CREDIT_STATUSES)[number];

export type PromotionStoreCreditInput = {
  code: string;
  initialBalanceCents: number;
  balanceCents?: number | null;
  customerId?: string | null;
  currency?: string;
  status?: string;
  isActive?: boolean;
  expiresAt?: Date | string | null;
  metadata?: Prisma.InputJsonObject;
};

export type PromotionStoreCreditRecord = {
  id: string;
  code: string;
  customerId: string | null;
  currency: string;
  initialBalanceCents: number;
  balanceCents: number;
  status: PromotionStoreCreditStatus;
  isActive: boolean;
  expiresAt: Date | null;
  metadata: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

export type PromotionStoreCreditRedemption = {
  appliedCreditCents: number;
  remainingSubtotalCents: number;
  remainingBalanceCents: number;
};

function optionalText(value?: string | null) {
  const normalized = value?.trim();
  return normalized || null;
}

export function normalizePromotionStoreCreditCode(value: string) {
  const code = value.trim().toUpperCase().replace(/\s+/g, '');
  if (!code) throw new Error('Promotion store credit code is required.');
  return code;
}

export function assertPromotionStoreCreditCode(value: string) {
  const code = normalizePromotionStoreCreditCode(value);
  if (!/^[A-Z0-9][A-Z0-9_-]{5,47}$/.test(code)) {
    throw new Error('Promotion store credit code must be 6-48 uppercase letters, numbers, underscores, or hyphens.');
  }
  return code;
}

export function assertPromotionStoreCreditStatus(value?: string | null): PromotionStoreCreditStatus {
  const normalized = optionalText(value)?.toLowerCase() ?? 'draft';
  if (PROMOTION_STORE_CREDIT_STATUSES.includes(normalized as PromotionStoreCreditStatus)) {
    return normalized as PromotionStoreCreditStatus;
  }
  throw new Error(`Unsupported promotion store credit status: ${value}`);
}

export function normalizePromotionStoreCreditBalance(value: number) {
  const normalized = Math.floor(value);
  if (normalized < 0) throw new Error('Promotion store credit balance cannot be negative.');
  return normalized;
}

export function normalizePromotionStoreCreditCurrency(value?: string | null) {
  return optionalText(value)?.toUpperCase() ?? 'TOMAN';
}

export function normalizePromotionStoreCreditExpiry(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid promotion store credit expiry date: ${value}`);
  return date;
}

export function normalizePromotionStoreCreditInput(input: PromotionStoreCreditInput) {
  const initialBalanceCents = normalizePromotionStoreCreditBalance(input.initialBalanceCents);
  const requestedBalance = input.balanceCents === undefined || input.balanceCents === null
    ? initialBalanceCents
    : normalizePromotionStoreCreditBalance(input.balanceCents);
  const balanceCents = Math.min(initialBalanceCents, requestedBalance);

  return {
    code: assertPromotionStoreCreditCode(input.code),
    customerId: optionalText(input.customerId),
    currency: normalizePromotionStoreCreditCurrency(input.currency),
    initialBalanceCents,
    balanceCents,
    status: assertPromotionStoreCreditStatus(input.status),
    isActive: input.isActive ?? true,
    expiresAt: normalizePromotionStoreCreditExpiry(input.expiresAt),
    metadata: input.metadata ?? {}
  };
}

export function isPromotionStoreCreditActive(credit: Pick<PromotionStoreCreditRecord, 'status' | 'isActive' | 'balanceCents' | 'expiresAt'>, now: Date = new Date()) {
  return credit.isActive
    && credit.status === 'active'
    && normalizePromotionStoreCreditBalance(credit.balanceCents) > 0
    && (!credit.expiresAt || credit.expiresAt.getTime() >= now.getTime());
}

export function calculatePromotionStoreCreditRedemption(balanceCents: number, subtotalCents: number): PromotionStoreCreditRedemption {
  const balance = normalizePromotionStoreCreditBalance(balanceCents);
  const subtotal = Math.max(0, Math.floor(subtotalCents));
  const appliedCreditCents = Math.min(balance, subtotal);

  return {
    appliedCreditCents,
    remainingSubtotalCents: subtotal - appliedCreditCents,
    remainingBalanceCents: balance - appliedCreditCents
  };
}

export async function listPromotionStoreCredits(): Promise<PromotionStoreCreditRecord[]> {
  if (!hasDatabase()) return [];

  return prisma.$queryRaw<PromotionStoreCreditRecord[]>`
    SELECT
      "id",
      "code",
      "customerId",
      "currency",
      "initialBalanceCents",
      "balanceCents",
      "status",
      "isActive",
      "expiresAt",
      "metadata",
      "createdAt",
      "updatedAt"
    FROM "PromotionStoreCredit"
    ORDER BY "createdAt" DESC
  `;
}

export async function findPromotionStoreCreditByCode(code: string): Promise<PromotionStoreCreditRecord | null> {
  if (!hasDatabase()) return null;

  const normalizedCode = assertPromotionStoreCreditCode(code);
  const rows = await prisma.$queryRaw<PromotionStoreCreditRecord[]>`
    SELECT
      "id",
      "code",
      "customerId",
      "currency",
      "initialBalanceCents",
      "balanceCents",
      "status",
      "isActive",
      "expiresAt",
      "metadata",
      "createdAt",
      "updatedAt"
    FROM "PromotionStoreCredit"
    WHERE "code" = ${normalizedCode}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function createPromotionStoreCredit(input: PromotionStoreCreditInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const credit = normalizePromotionStoreCreditInput(input);
  const id = randomUUID();
  const metadata = {
    ...credit.metadata,
    initialBalanceCents: credit.initialBalanceCents,
    source: 'admin'
  };

  const inserted = await prisma.$queryRaw<PromotionStoreCreditRecord[]>`
    INSERT INTO "PromotionStoreCredit" (
      "id",
      "code",
      "customerId",
      "currency",
      "initialBalanceCents",
      "balanceCents",
      "status",
      "isActive",
      "expiresAt",
      "metadata"
    ) VALUES (
      ${id},
      ${credit.code},
      ${credit.customerId},
      ${credit.currency},
      ${credit.initialBalanceCents},
      ${credit.balanceCents},
      ${credit.status},
      ${credit.isActive},
      ${credit.expiresAt},
      ${JSON.stringify(metadata)}::jsonb
    )
    RETURNING
      "id",
      "code",
      "customerId",
      "currency",
      "initialBalanceCents",
      "balanceCents",
      "status",
      "isActive",
      "expiresAt",
      "metadata",
      "createdAt",
      "updatedAt"
  `;

  await prisma.adminAuditLog.create({
    data: {
      action: 'promotion.store_credit.create',
      entity: 'promotionStoreCredit',
      entityId: id,
      summary: `Created promotion store credit ${credit.code}`,
      metadata: metadata as Prisma.InputJsonObject
    }
  });

  return inserted[0];
}
