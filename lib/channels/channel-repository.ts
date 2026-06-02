import 'server-only';

import { randomUUID } from 'node:crypto';
import { hasDatabase, prisma } from '@/lib/prisma';

export const DEFAULT_STOREFRONT_CHANNEL_CURRENCY = 'TOMAN';
export const DEFAULT_STOREFRONT_CHANNEL_LOCALE = 'fa-IR';

export type StorefrontChannelInput = {
  slug?: string;
  name: string;
  currency?: string;
  locale?: string;
  isActive?: boolean;
  isDefault?: boolean;
  metadata?: Record<string, unknown>;
};

export type StorefrontChannelRecord = {
  id: string;
  slug: string;
  name: string;
  currency: string;
  locale: string;
  isActive: boolean;
  isDefault: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

export type StorefrontChannelDefaults = {
  currency: string;
  locale: string;
  source: 'channel' | 'fallback';
  channelId: string | null;
  channelSlug: string | null;
};

function optionalText(value?: string | null) {
  const normalized = value?.trim();
  return normalized || null;
}

export function normalizeStorefrontChannelSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!slug) throw new Error('Storefront channel slug is required.');
  return slug;
}

export function normalizeStorefrontChannelCurrency(value?: string | null) {
  const currency = optionalText(value) ?? DEFAULT_STOREFRONT_CHANNEL_CURRENCY;
  const normalized = currency.toUpperCase();
  if (!/^[A-Z]{3,8}$/.test(normalized)) {
    throw new Error(`Unsupported storefront channel currency: ${value}`);
  }
  return normalized;
}

export function normalizeStorefrontChannelLocale(value?: string | null) {
  const locale = optionalText(value) ?? DEFAULT_STOREFRONT_CHANNEL_LOCALE;
  const normalized = locale.replace('_', '-');
  if (!/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(normalized)) {
    throw new Error(`Unsupported storefront channel locale: ${value}`);
  }
  return normalized;
}

export function normalizeStorefrontChannelInput(input: StorefrontChannelInput) {
  const name = optionalText(input.name);
  if (!name) throw new Error('Storefront channel name is required.');

  return {
    slug: normalizeStorefrontChannelSlug(input.slug ?? name),
    name,
    currency: normalizeStorefrontChannelCurrency(input.currency),
    locale: normalizeStorefrontChannelLocale(input.locale),
    isActive: input.isActive ?? true,
    isDefault: input.isDefault ?? false,
    metadata: input.metadata ?? {}
  };
}

export function isStorefrontChannelActive(channel: Pick<StorefrontChannelRecord, 'isActive'>) {
  return channel.isActive;
}

export function isStorefrontChannelDefault(channel: Pick<StorefrontChannelRecord, 'isDefault'>) {
  return channel.isDefault;
}

export function selectDefaultStorefrontChannel(channels: StorefrontChannelRecord[]) {
  return channels.find((channel) => channel.isDefault && channel.isActive)
    ?? channels.find((channel) => channel.isActive)
    ?? null;
}

export function buildFallbackStorefrontChannelDefaults(): StorefrontChannelDefaults {
  return {
    currency: DEFAULT_STOREFRONT_CHANNEL_CURRENCY,
    locale: DEFAULT_STOREFRONT_CHANNEL_LOCALE,
    source: 'fallback',
    channelId: null,
    channelSlug: null
  };
}

export function buildStorefrontChannelDefaults(channel?: Pick<StorefrontChannelRecord, 'id' | 'slug' | 'currency' | 'locale'> | null): StorefrontChannelDefaults {
  if (!channel) return buildFallbackStorefrontChannelDefaults();

  return {
    currency: normalizeStorefrontChannelCurrency(channel.currency),
    locale: normalizeStorefrontChannelLocale(channel.locale),
    source: 'channel',
    channelId: channel.id,
    channelSlug: channel.slug
  };
}

export function resolveStorefrontChannelDefaults(channels: StorefrontChannelRecord[]): StorefrontChannelDefaults {
  return buildStorefrontChannelDefaults(selectDefaultStorefrontChannel(channels));
}

export async function listStorefrontChannels(): Promise<StorefrontChannelRecord[]> {
  if (!hasDatabase()) return [];

  return prisma.$queryRaw<StorefrontChannelRecord[]>`
    SELECT
      "id",
      "slug",
      "name",
      "currency",
      "locale",
      "isActive",
      "isDefault",
      "metadata",
      "createdAt",
      "updatedAt"
    FROM "StorefrontChannel"
    ORDER BY "isDefault" DESC, "createdAt" ASC
  `;
}

export async function createStorefrontChannel(input: StorefrontChannelInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const channel = normalizeStorefrontChannelInput(input);
  const id = randomUUID();

  const inserted = await prisma.$queryRaw<StorefrontChannelRecord[]>`
    INSERT INTO "StorefrontChannel" (
      "id",
      "slug",
      "name",
      "currency",
      "locale",
      "isActive",
      "isDefault",
      "metadata"
    ) VALUES (
      ${id},
      ${channel.slug},
      ${channel.name},
      ${channel.currency},
      ${channel.locale},
      ${channel.isActive},
      ${channel.isDefault},
      ${JSON.stringify(channel.metadata)}::jsonb
    )
    RETURNING
      "id",
      "slug",
      "name",
      "currency",
      "locale",
      "isActive",
      "isDefault",
      "metadata",
      "createdAt",
      "updatedAt"
  `;

  return inserted[0];
}

export async function getDefaultStorefrontChannelDefaults() {
  const channels = await listStorefrontChannels();
  return resolveStorefrontChannelDefaults(channels);
}
