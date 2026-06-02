import 'server-only';

import { randomUUID } from 'node:crypto';
import { hasDatabase, prisma } from '@/lib/prisma';

export type ProductChannelAvailabilityInput = {
  channelId: string;
  productId: string;
  isAvailable?: boolean;
  isPublished?: boolean;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
  metadata?: Record<string, unknown>;
};

export type ProductChannelAvailabilityRecord = {
  id: string;
  channelId: string;
  productId: string;
  isAvailable: boolean;
  isPublished: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductChannelAvailabilityWindow = Pick<ProductChannelAvailabilityRecord, 'startsAt' | 'endsAt'>;
export type ProductChannelAvailabilityState = Pick<ProductChannelAvailabilityRecord, 'isAvailable' | 'isPublished' | 'startsAt' | 'endsAt'>;

function optionalText(value?: string | null) {
  const normalized = value?.trim();
  return normalized || null;
}

export function assertProductChannelAvailabilityId(value: string, label: string) {
  const id = optionalText(value);
  if (!id) throw new Error(`${label} is required for product channel availability.`);
  return id;
}

export function normalizeProductChannelAvailabilityWindowDate(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid product channel availability date: ${value}`);
  return date;
}

export function assertProductChannelAvailabilityWindow(startsAt?: Date | string | null, endsAt?: Date | string | null) {
  const normalizedStartsAt = normalizeProductChannelAvailabilityWindowDate(startsAt);
  const normalizedEndsAt = normalizeProductChannelAvailabilityWindowDate(endsAt);
  if (normalizedStartsAt && normalizedEndsAt && normalizedStartsAt.getTime() > normalizedEndsAt.getTime()) {
    throw new Error('Product channel availability startsAt must be before endsAt.');
  }
  return {
    startsAt: normalizedStartsAt,
    endsAt: normalizedEndsAt
  };
}

export function isProductChannelAvailabilityWithinWindow(window: ProductChannelAvailabilityWindow, now: Date = new Date()) {
  const nowTime = now.getTime();
  return (!window.startsAt || window.startsAt.getTime() <= nowTime) && (!window.endsAt || window.endsAt.getTime() >= nowTime);
}

export function isProductAvailableInChannel(availability?: ProductChannelAvailabilityState | null, now: Date = new Date()) {
  if (!availability) return false;
  return availability.isAvailable
    && availability.isPublished
    && isProductChannelAvailabilityWithinWindow(availability, now);
}

export function normalizeProductChannelAvailabilityInput(input: ProductChannelAvailabilityInput) {
  const window = assertProductChannelAvailabilityWindow(input.startsAt, input.endsAt);
  return {
    channelId: assertProductChannelAvailabilityId(input.channelId, 'Channel id'),
    productId: assertProductChannelAvailabilityId(input.productId, 'Product id'),
    isAvailable: input.isAvailable ?? true,
    isPublished: input.isPublished ?? true,
    startsAt: window.startsAt,
    endsAt: window.endsAt,
    metadata: input.metadata ?? {}
  };
}

export async function listProductChannelAvailabilityForChannel(channelId: string): Promise<ProductChannelAvailabilityRecord[]> {
  if (!hasDatabase()) return [];
  const normalizedChannelId = assertProductChannelAvailabilityId(channelId, 'Channel id');

  return prisma.$queryRaw<ProductChannelAvailabilityRecord[]>`
    SELECT
      "id",
      "channelId",
      "productId",
      "isAvailable",
      "isPublished",
      "startsAt",
      "endsAt",
      "metadata",
      "createdAt",
      "updatedAt"
    FROM "ProductChannelAvailability"
    WHERE "channelId" = ${normalizedChannelId}
    ORDER BY "createdAt" DESC
  `;
}

export async function findProductChannelAvailability(channelId: string, productId: string): Promise<ProductChannelAvailabilityRecord | null> {
  if (!hasDatabase()) return null;
  const normalizedChannelId = assertProductChannelAvailabilityId(channelId, 'Channel id');
  const normalizedProductId = assertProductChannelAvailabilityId(productId, 'Product id');

  const rows = await prisma.$queryRaw<ProductChannelAvailabilityRecord[]>`
    SELECT
      "id",
      "channelId",
      "productId",
      "isAvailable",
      "isPublished",
      "startsAt",
      "endsAt",
      "metadata",
      "createdAt",
      "updatedAt"
    FROM "ProductChannelAvailability"
    WHERE "channelId" = ${normalizedChannelId}
      AND "productId" = ${normalizedProductId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function createProductChannelAvailability(input: ProductChannelAvailabilityInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const availability = normalizeProductChannelAvailabilityInput(input);
  const id = randomUUID();

  const inserted = await prisma.$queryRaw<ProductChannelAvailabilityRecord[]>`
    INSERT INTO "ProductChannelAvailability" (
      "id",
      "channelId",
      "productId",
      "isAvailable",
      "isPublished",
      "startsAt",
      "endsAt",
      "metadata"
    ) VALUES (
      ${id},
      ${availability.channelId},
      ${availability.productId},
      ${availability.isAvailable},
      ${availability.isPublished},
      ${availability.startsAt},
      ${availability.endsAt},
      ${JSON.stringify(availability.metadata)}::jsonb
    )
    RETURNING
      "id",
      "channelId",
      "productId",
      "isAvailable",
      "isPublished",
      "startsAt",
      "endsAt",
      "metadata",
      "createdAt",
      "updatedAt"
  `;

  return inserted[0];
}
