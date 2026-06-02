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
  createdAt: Date;
  updatedAt: Date;
};

export type PromotionDiscountCalculation = {
  discountCents: number;
  subtotalAfterDiscountCents: number;
  discountType: PromotionDiscountType;
  value: number;
};

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

export function normalizePromotionDiscountValue(discountType: PromotionDiscountType, value: number) {
  const normalized = Math.max(0, Math.floor(value));
  if (discountType === 'percentage') return Math.min(100, normalized);
  return normalized;
}

export function normalizePromotionDiscountInput(input: PromotionDiscountInput) {
  const name = optionalText(input.name);
  if (!name) throw new Error('Promotion discount name is required.');
  const discountType = assertPromotionDiscountType(input.discountType);

  return {
    name,
    slug: optionalText(input.slug) ?? slugifyPromotionDiscountName(name),
    discountType,
    value: normalizePromotionDiscountValue(discountType, input.value),
    currency: optionalText(input.currency) ?? 'TOMAN',
    status: assertPromotionDiscountStatus(input.status),
    description: optionalText(input.description),
    isActive: input.isActive ?? true
  };
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
