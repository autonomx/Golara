import 'server-only';

import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { hasDatabase, prisma } from '@/lib/prisma';

export const PROMOTION_DISCOUNT_TYPES = ['fixed_amount', 'percentage'] as const;
export const PROMOTION_DISCOUNT_STATUSES = ['draft', 'active', 'paused', 'archived'] as const;

export type PromotionDiscountType = (typeof PROMOTION_DISCOUNT_TYPES)[number];
export type PromotionDiscountStatus = (typeof PROMOTION_DISCOUNT_STATUSES)[number];

export type PromotionDiscountInput = {
  name: string;
  slug?: string;
  discountType: string;
  value: number;
  currency?: string;
  status?: string;
  description?: string;
  isActive?: boolean;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
  usageLimit?: number | null;
};

export type PromotionDiscountRecord = {
  id: string;
  name: string;
  slug: string;
  discountType: PromotionDiscountType;
  value: number;
  currency: string;
  status: PromotionDiscountStatus;
  description: string | null;
  isActive: boolean;
  usageCount: number;
  usageLimit: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PromotionDiscountCalculation = {
  discountCents: number;
  subtotalAfterDiscountCents: number;
  discountType: PromotionDiscountType;
  value: number;
};

export type PromotionValidityWindow = Pick<PromotionDiscountRecord, 'startsAt' | 'endsAt'>;
export type PromotionUsageLimit = Pick<PromotionDiscountRecord, 'usageCount' | 'usageLimit'>;

function optionalText(value?: string | null) {
  const normalized = value?.trim();
  return normalized || null;
}

export function slugifyPromotionDiscountName(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!slug) throw new Error('Promotion discount slug is required.');
  return slug;
}

export function assertPromotionDiscountType(value: string): PromotionDiscountType {
  const normalized = optionalText(value)?.toLowerCase();
  if (PROMOTION_DISCOUNT_TYPES.includes(normalized as PromotionDiscountType)) {
    return normalized as PromotionDiscountType;
  }
  throw new Error(`Unsupported promotion discount type: ${value}`);
}

export function assertPromotionDiscountStatus(value?: string | null): PromotionDiscountStatus {
  const normalized = optionalText(value)?.toLowerCase() ?? 'draft';
  if (PROMOTION_DISCOUNT_STATUSES.includes(normalized as PromotionDiscountStatus)) {
    return normalized as PromotionDiscountStatus;
  }
  throw new Error(`Unsupported promotion discount status: ${value}`);
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

export function normalizePromotionUsageLimit(value?: number | null) {
  if (value === undefined || value === null) return null;
  const normalized = Math.floor(value);
  if (normalized < 1) throw new Error('Promotion usage limit must be at least 1.');
  return normalized;
}

export function normalizePromotionUsageCount(value?: number | null) {
  return Math.max(0, Math.floor(value ?? 0));
}

export function isPromotionWithinUsageLimit(limit: PromotionUsageLimit) {
  const usageCount = normalizePromotionUsageCount(limit.usageCount);
  const usageLimit = normalizePromotionUsageLimit(limit.usageLimit);
  return usageLimit === null || usageCount < usageLimit;
}

export function normalizePromotionDiscountValue(discountType: PromotionDiscountType, value: number) {
  const normalized = Math.max(0, Math.floor(value));
  if (discountType === 'percentage') return Math.min(100, normalized);
  return normalized;
}

export function normalizePromotionDiscountInput(input: PromotionDiscountInput) {
  const name = optionalText(input.name);
  if (!name) throw new Error('Promotion discount name is required.');
  const discountType = assertPromotionDiscountType(input.discountType);
  const validity = assertPromotionValidityWindow(input.startsAt, input.endsAt);

  return {
    name,
    slug: optionalText(input.slug) ?? slugifyPromotionDiscountName(name),
    discountType,
    value: normalizePromotionDiscountValue(discountType, input.value),
    currency: optionalText(input.currency) ?? 'TOMAN',
    status: assertPromotionDiscountStatus(input.status),
    description: optionalText(input.description),
    isActive: input.isActive ?? true,
    startsAt: validity.startsAt,
    endsAt: validity.endsAt,
    usageLimit: normalizePromotionUsageLimit(input.usageLimit)
  };
}

export function isPromotionDiscountUsable(discount: Pick<PromotionDiscountRecord, 'isActive' | 'status' | 'startsAt' | 'endsAt' | 'usageCount' | 'usageLimit'>, now: Date = new Date()) {
  return discount.isActive
    && discount.status === 'active'
    && isPromotionWithinValidityWindow(discount, now)
    && isPromotionWithinUsageLimit(discount);
}

export function calculatePromotionDiscountAmount(subtotalCents: number, discountType: PromotionDiscountType, value: number): PromotionDiscountCalculation {
  const subtotal = Math.max(0, Math.floor(subtotalCents));
  const normalizedValue = normalizePromotionDiscountValue(discountType, value);
  const requestedDiscount = discountType === 'percentage'
    ? Math.floor((subtotal * normalizedValue) / 100)
    : normalizedValue;
  const discountCents = Math.min(subtotal, requestedDiscount);

  return {
    discountCents,
    subtotalAfterDiscountCents: subtotal - discountCents,
    discountType,
    value: normalizedValue
  };
}

export async function listPromotionDiscounts(): Promise<PromotionDiscountRecord[]> {
  if (!hasDatabase()) return [];

  return prisma.$queryRaw<PromotionDiscountRecord[]>`
    SELECT
      "id",
      "name",
      "slug",
      "discountType",
      "value",
      "currency",
      "status",
      "description",
      "isActive",
      "usageCount",
      "usageLimit",
      "startsAt",
      "endsAt",
      "createdAt",
      "updatedAt"
    FROM "PromotionDiscount"
    ORDER BY "createdAt" DESC
  `;
}

export async function createPromotionDiscount(input: PromotionDiscountInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const discount = normalizePromotionDiscountInput(input);
  const id = randomUUID();
  const metadata = {
    discountType: discount.discountType,
    normalizedValue: discount.value,
    source: 'admin'
  };

  const inserted = await prisma.$queryRaw<PromotionDiscountRecord[]>`
    INSERT INTO "PromotionDiscount" (
      "id",
      "name",
      "slug",
      "discountType",
      "value",
      "currency",
      "status",
      "description",
      "isActive",
      "startsAt",
      "endsAt",
      "usageLimit",
      "metadata"
    ) VALUES (
      ${id},
      ${discount.name},
      ${discount.slug},
      ${discount.discountType},
      ${discount.value},
      ${discount.currency},
      ${discount.status},
      ${discount.description},
      ${discount.isActive},
      ${discount.startsAt},
      ${discount.endsAt},
      ${discount.usageLimit},
      ${JSON.stringify(metadata)}::jsonb
    )
    RETURNING
      "id",
      "name",
      "slug",
      "discountType",
      "value",
      "currency",
      "status",
      "description",
      "isActive",
      "usageCount",
      "usageLimit",
      "startsAt",
      "endsAt",
      "createdAt",
      "updatedAt"
  `;

  await prisma.adminAuditLog.create({
    data: {
      action: 'promotion.discount.create',
      entity: 'promotionDiscount',
      entityId: id,
      summary: `Created promotion discount ${discount.name}`,
      metadata: metadata as Prisma.InputJsonObject
    }
  });

  return inserted[0];
}
