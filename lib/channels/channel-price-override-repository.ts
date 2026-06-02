import 'server-only';

import { randomUUID } from 'node:crypto';
import { hasDatabase, prisma } from '@/lib/prisma';
import { DEFAULT_STOREFRONT_CHANNEL_CURRENCY, normalizeStorefrontChannelCurrency } from './channel-repository';

export type ProductChannelPriceOverrideInput = {
  channelId: string;
  productId?: string | null;
  variantId?: string | null;
  priceCents: number;
  currency?: string | null;
  isActive?: boolean;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
  metadata?: Record<string, unknown>;
};

export type ProductChannelPriceOverrideRecord = {
  id: string;
  channelId: string;
  productId: string | null;
  variantId: string | null;
  priceCents: number;
  currency: string;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductChannelPriceOverrideWindow = Pick<ProductChannelPriceOverrideRecord, 'startsAt' | 'endsAt'>;
export type ProductChannelPriceOverrideState = Pick<ProductChannelPriceOverrideRecord, 'isActive' | 'startsAt' | 'endsAt'>;

function optionalText(value?: string | null) {
  const normalized = value?.trim();
  return normalized || null;
}

export function assertProductChannelPriceOverrideId(value: string, label: string) {
  const id = optionalText(value);
  if (!id) throw new Error(`${label} is required for product channel price override.`);
  return id;
}

export function normalizeProductChannelPriceCents(value: number) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Product channel price override must be a nonnegative integer: ${value}`);
  }
  return value;
}

export function normalizeProductChannelPriceOverrideCurrency(value?: string | null) {
  return normalizeStorefrontChannelCurrency(value ?? DEFAULT_STOREFRONT_CHANNEL_CURRENCY);
}

export function normalizeProductChannelPriceOverrideWindowDate(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid product channel price override date: ${value}`);
  return date;
}

export function assertProductChannelPriceOverrideWindow(startsAt?: Date | string | null, endsAt?: Date | string | null) {
  const normalizedStartsAt = normalizeProductChannelPriceOverrideWindowDate(startsAt);
  const normalizedEndsAt = normalizeProductChannelPriceOverrideWindowDate(endsAt);
  if (normalizedStartsAt && normalizedEndsAt && normalizedStartsAt.getTime() > normalizedEndsAt.getTime()) {
    throw new Error('Product channel price override startsAt must be before endsAt.');
  }
  return {
    startsAt: normalizedStartsAt,
    endsAt: normalizedEndsAt
  };
}

export function assertProductChannelPriceOverrideTarget(productId?: string | null, variantId?: string | null) {
  const normalizedProductId = optionalText(productId);
  const normalizedVariantId = optionalText(variantId);
  if ((normalizedProductId && normalizedVariantId) || (!normalizedProductId && !normalizedVariantId)) {
    throw new Error('Product channel price override requires exactly one productId or variantId.');
  }
  return {
    productId: normalizedProductId,
    variantId: normalizedVariantId
  };
}

export function isProductChannelPriceOverrideWithinWindow(window: ProductChannelPriceOverrideWindow, now: Date = new Date()) {
  const nowTime = now.getTime();
  return (!window.startsAt || window.startsAt.getTime() <= nowTime) && (!window.endsAt || window.endsAt.getTime() >= nowTime);
}

export function isProductChannelPriceOverrideActive(override?: ProductChannelPriceOverrideState | null, now: Date = new Date()) {
  if (!override) return false;
  return override.isActive && isProductChannelPriceOverrideWithinWindow(override, now);
}

export function applyProductChannelPriceOverride(basePriceCents: number, override?: ProductChannelPriceOverrideState & Pick<ProductChannelPriceOverrideRecord, 'priceCents'> | null, now: Date = new Date()) {
  const normalizedBasePriceCents = normalizeProductChannelPriceCents(basePriceCents);
  if (!isProductChannelPriceOverrideActive(override, now)) return normalizedBasePriceCents;
  return normalizeProductChannelPriceCents(override.priceCents);
}

export function normalizeProductChannelPriceOverrideInput(input: ProductChannelPriceOverrideInput) {
  const target = assertProductChannelPriceOverrideTarget(input.productId, input.variantId);
  const window = assertProductChannelPriceOverrideWindow(input.startsAt, input.endsAt);
  return {
    channelId: assertProductChannelPriceOverrideId(input.channelId, 'Channel id'),
    productId: target.productId,
    variantId: target.variantId,
    priceCents: normalizeProductChannelPriceCents(input.priceCents),
    currency: normalizeProductChannelPriceOverrideCurrency(input.currency),
    isActive: input.isActive ?? true,
    startsAt: window.startsAt,
    endsAt: window.endsAt,
    metadata: input.metadata ?? {}
  };
}

export async function listProductChannelPriceOverridesForChannel(channelId: string): Promise<ProductChannelPriceOverrideRecord[]> {
  if (!hasDatabase()) return [];
  const normalizedChannelId = assertProductChannelPriceOverrideId(channelId, 'Channel id');

  return prisma.$queryRaw<ProductChannelPriceOverrideRecord[]>`
    SELECT
      "id",
      "channelId",
      "productId",
      "variantId",
      "priceCents",
      "currency",
      "isActive",
      "startsAt",
      "endsAt",
      "metadata",
      "createdAt",
      "updatedAt"
    FROM "ProductChannelPriceOverride"
    WHERE "channelId" = ${normalizedChannelId}
    ORDER BY "createdAt" DESC
  `;
}

export async function findProductChannelPriceOverride(input: Pick<ProductChannelPriceOverrideInput, 'channelId' | 'productId' | 'variantId'>): Promise<ProductChannelPriceOverrideRecord | null> {
  if (!hasDatabase()) return null;
  const normalizedChannelId = assertProductChannelPriceOverrideId(input.channelId, 'Channel id');
  const target = assertProductChannelPriceOverrideTarget(input.productId, input.variantId);

  const rows = target.productId
    ? await prisma.$queryRaw<ProductChannelPriceOverrideRecord[]>`
      SELECT
        "id", "channelId", "productId", "variantId", "priceCents", "currency", "isActive", "startsAt", "endsAt", "metadata", "createdAt", "updatedAt"
      FROM "ProductChannelPriceOverride"
      WHERE "channelId" = ${normalizedChannelId}
        AND "productId" = ${target.productId}
      LIMIT 1
    `
    : await prisma.$queryRaw<ProductChannelPriceOverrideRecord[]>`
      SELECT
        "id", "channelId", "productId", "variantId", "priceCents", "currency", "isActive", "startsAt", "endsAt", "metadata", "createdAt", "updatedAt"
      FROM "ProductChannelPriceOverride"
      WHERE "channelId" = ${normalizedChannelId}
        AND "variantId" = ${target.variantId}
      LIMIT 1
    `;

  return rows[0] ?? null;
}

export async function createProductChannelPriceOverride(input: ProductChannelPriceOverrideInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const override = normalizeProductChannelPriceOverrideInput(input);
  const id = randomUUID();

  const inserted = await prisma.$queryRaw<ProductChannelPriceOverrideRecord[]>`
    INSERT INTO "ProductChannelPriceOverride" (
      "id",
      "channelId",
      "productId",
      "variantId",
      "priceCents",
      "currency",
      "isActive",
      "startsAt",
      "endsAt",
      "metadata"
    ) VALUES (
      ${id},
      ${override.channelId},
      ${override.productId},
      ${override.variantId},
      ${override.priceCents},
      ${override.currency},
      ${override.isActive},
      ${override.startsAt},
      ${override.endsAt},
      ${JSON.stringify(override.metadata)}::jsonb
    )
    RETURNING
      "id",
      "channelId",
      "productId",
      "variantId",
      "priceCents",
      "currency",
      "isActive",
      "startsAt",
      "endsAt",
      "metadata",
      "createdAt",
      "updatedAt"
  `;

  return inserted[0];
}
