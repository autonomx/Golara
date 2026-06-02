import 'server-only';

import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { hasDatabase, prisma } from '@/lib/prisma';

export const PROMOTION_VOUCHER_STATUSES = ['draft', 'active', 'paused', 'archived'] as const;

export type PromotionVoucherStatus = (typeof PROMOTION_VOUCHER_STATUSES)[number];

export type PromotionVoucherInput = {
  code: string;
  promotionDiscountId: string;
  status?: string;
  isActive?: boolean;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
};

export type PromotionVoucherRecord = {
  id: string;
  code: string;
  promotionDiscountId: string;
  status: PromotionVoucherStatus;
  isActive: boolean;
  usageCount: number;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PromotionValidityWindow = Pick<PromotionVoucherRecord, 'startsAt' | 'endsAt'>;

function optionalText(value?: string | null) {
  const normalized = value?.trim();
  return normalized || null;
}

export function normalizePromotionVoucherCode(value: string) {
  const code = value.trim().toUpperCase().replace(/\s+/g, '');
  if (!code) throw new Error('Promotion voucher code is required.');
  return code;
}

export function assertPromotionVoucherCode(value: string) {
  const code = normalizePromotionVoucherCode(value);
  if (!/^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(code)) {
    throw new Error('Promotion voucher code must be 3-32 uppercase letters, numbers, underscores, or hyphens.');
  }
  return code;
}

export function assertPromotionVoucherStatus(value?: string | null): PromotionVoucherStatus {
  const normalized = optionalText(value)?.toLowerCase() ?? 'draft';
  if (PROMOTION_VOUCHER_STATUSES.includes(normalized as PromotionVoucherStatus)) {
    return normalized as PromotionVoucherStatus;
  }
  throw new Error(`Unsupported promotion voucher status: ${value}`);
}

export function normalizePromotionWindowDate(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid promotion validity date: ${value}`);
  return date;
}

export function assertPromotionValidityWindow(startsAt?: Date | string | null, endsAt?: Date | string | null) {
  const normalizedStartsAt = normalizePromotionWindowDate(startsAt);
  const normalizedEndsAt = normalizePromotionWindowDate(endsAt);
  if (normalizedStartsAt && normalizedEndsAt && normalizedStartsAt.getTime() > normalizedEndsAt.getTime()) {
    throw new Error('Promotion validity startsAt must be before endsAt.');
  }
  return {
    startsAt: normalizedStartsAt,
    endsAt: normalizedEndsAt
  };
}

export function isPromotionWithinValidityWindow(window: PromotionValidityWindow, now: Date = new Date()) {
  const nowTime = now.getTime();
  return (!window.startsAt || window.startsAt.getTime() <= nowTime) && (!window.endsAt || window.endsAt.getTime() >= nowTime);
}

export function normalizePromotionVoucherInput(input: PromotionVoucherInput) {
  const promotionDiscountId = optionalText(input.promotionDiscountId);
  if (!promotionDiscountId) throw new Error('Promotion discount id is required.');
  const validity = assertPromotionValidityWindow(input.startsAt, input.endsAt);

  return {
    code: assertPromotionVoucherCode(input.code),
    promotionDiscountId,
    status: assertPromotionVoucherStatus(input.status),
    isActive: input.isActive ?? true,
    startsAt: validity.startsAt,
    endsAt: validity.endsAt
  };
}

export function isPromotionVoucherActive(voucher: Pick<PromotionVoucherRecord, 'status' | 'isActive' | 'startsAt' | 'endsAt'>, now: Date = new Date()) {
  return voucher.isActive && voucher.status === 'active' && isPromotionWithinValidityWindow(voucher, now);
}

export async function listPromotionVouchers(): Promise<PromotionVoucherRecord[]> {
  if (!hasDatabase()) return [];

  return prisma.$queryRaw<PromotionVoucherRecord[]>`
    SELECT
      "id",
      "code",
      "promotionDiscountId",
      "status",
      "isActive",
      "usageCount",
      "startsAt",
      "endsAt",
      "createdAt",
      "updatedAt"
    FROM "PromotionVoucher"
    ORDER BY "createdAt" DESC
  `;
}

export async function findPromotionVoucherByCode(code: string): Promise<PromotionVoucherRecord | null> {
  if (!hasDatabase()) return null;

  const normalizedCode = assertPromotionVoucherCode(code);
  const rows = await prisma.$queryRaw<PromotionVoucherRecord[]>`
    SELECT
      "id",
      "code",
      "promotionDiscountId",
      "status",
      "isActive",
      "usageCount",
      "startsAt",
      "endsAt",
      "createdAt",
      "updatedAt"
    FROM "PromotionVoucher"
    WHERE "code" = ${normalizedCode}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function createPromotionVoucher(input: PromotionVoucherInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const voucher = normalizePromotionVoucherInput(input);
  const id = randomUUID();
  const metadata = {
    code: voucher.code,
    source: 'admin'
  };

  const inserted = await prisma.$queryRaw<PromotionVoucherRecord[]>`
    INSERT INTO "PromotionVoucher" (
      "id",
      "code",
      "promotionDiscountId",
      "status",
      "isActive",
      "startsAt",
      "endsAt",
      "metadata"
    ) VALUES (
      ${id},
      ${voucher.code},
      ${voucher.promotionDiscountId},
      ${voucher.status},
      ${voucher.isActive},
      ${voucher.startsAt},
      ${voucher.endsAt},
      ${JSON.stringify(metadata)}::jsonb
    )
    RETURNING
      "id",
      "code",
      "promotionDiscountId",
      "status",
      "isActive",
      "usageCount",
      "startsAt",
      "endsAt",
      "createdAt",
      "updatedAt"
  `;

  await prisma.adminAuditLog.create({
    data: {
      action: 'promotion.voucher.create',
      entity: 'promotionVoucher',
      entityId: id,
      summary: `Created promotion voucher ${voucher.code}`,
      metadata: metadata as Prisma.InputJsonObject
    }
  });

  return inserted[0];
}
