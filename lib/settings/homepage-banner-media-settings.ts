import 'server-only';

import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { hasDatabase, prisma } from '@/lib/prisma';

export type HomepageBannerMediaSetting = {
  id: string;
  key: string;
  locale?: string | null;
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  mediaId?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  isActive: boolean;
  sortOrder: number;
  updatedAt?: Date;
};

export type HomepageBannerMediaSettingInput = {
  key: string;
  locale?: string | null;
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  mediaId?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  isActive: boolean;
  sortOrder: number;
};

export const DEFAULT_HOMEPAGE_BANNER_MEDIA_SETTING: HomepageBannerMediaSetting = {
  id: 'homepage-banner-media-primary',
  key: 'primary',
  locale: null,
  eyebrow: 'Golara flowers',
  title: 'Fresh floral moments for every occasion',
  subtitle: 'Configure homepage banner copy, imagery, and calls to action from admin settings.',
  mediaId: null,
  imageUrl: null,
  imageAlt: 'Seasonal Golara floral arrangement',
  ctaLabel: 'Shop flowers',
  ctaHref: '/products',
  isActive: true,
  sortOrder: 10
};

function optionalText(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

function isMissingHomepageBannerMediaTableError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const meta = 'meta' in error ? (error as { meta?: { code?: string; message?: string } }).meta : undefined;
  const message = 'message' in error ? String((error as { message?: unknown }).message ?? '') : '';
  return meta?.code === '42P01' || meta?.message?.includes('HomepageBannerMediaSetting') || message.includes('HomepageBannerMediaSetting');
}

export function normalizeHomepageBannerLocale(value?: string | null) {
  return optionalText(value)?.replace('_', '-') ?? null;
}

export function normalizeHomepageBannerHref(value?: string | null) {
  const href = optionalText(value);
  if (!href) return null;
  if (href.startsWith('/') || href.startsWith('#') || href.startsWith('https://') || href.startsWith('http://')) return href;
  return `/${href}`;
}

export function normalizeHomepageBannerAlt(value?: string | null) {
  const alt = optionalText(value);
  if (!alt) return null;
  return alt.slice(0, 160);
}

export function normalizeHomepageBannerMediaSettingInput(input: HomepageBannerMediaSettingInput): HomepageBannerMediaSettingInput {
  const key = optionalText(input.key) ?? DEFAULT_HOMEPAGE_BANNER_MEDIA_SETTING.key;
  const title = optionalText(input.title) ?? DEFAULT_HOMEPAGE_BANNER_MEDIA_SETTING.title;
  const sortOrder = Number.isFinite(input.sortOrder) ? input.sortOrder : DEFAULT_HOMEPAGE_BANNER_MEDIA_SETTING.sortOrder;

  return {
    key,
    locale: normalizeHomepageBannerLocale(input.locale),
    eyebrow: optionalText(input.eyebrow),
    title,
    subtitle: optionalText(input.subtitle),
    mediaId: optionalText(input.mediaId),
    imageUrl: optionalText(input.imageUrl),
    imageAlt: normalizeHomepageBannerAlt(input.imageAlt),
    ctaLabel: optionalText(input.ctaLabel),
    ctaHref: normalizeHomepageBannerHref(input.ctaHref),
    isActive: input.isActive,
    sortOrder
  };
}

function mapHomepageBannerMediaSetting(row: HomepageBannerMediaSetting): HomepageBannerMediaSetting {
  return {
    id: row.id,
    key: row.key,
    locale: row.locale ?? null,
    eyebrow: row.eyebrow ?? null,
    title: row.title,
    subtitle: row.subtitle ?? null,
    mediaId: row.mediaId ?? null,
    imageUrl: row.imageUrl ?? null,
    imageAlt: row.imageAlt ?? null,
    ctaLabel: row.ctaLabel ?? null,
    ctaHref: row.ctaHref ?? null,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt
  };
}

async function fetchHomepageBannerRows(key: string, locale?: string | null) {
  const normalizedLocale = normalizeHomepageBannerLocale(locale);
  return prisma.$queryRaw<HomepageBannerMediaSetting[]>`
    SELECT "id", "key", "locale", "eyebrow", "title", "subtitle", "mediaId", "imageUrl", "imageAlt", "ctaLabel", "ctaHref", "isActive", "sortOrder", "updatedAt"
    FROM "HomepageBannerMediaSetting"
    WHERE "key" = ${key}
      AND ("locale" = ${normalizedLocale} OR "locale" IS NULL)
    ORDER BY CASE WHEN "locale" = ${normalizedLocale} THEN 0 ELSE 1 END, "sortOrder" ASC
    LIMIT 1
  `;
}

export const homepageBannerMediaSettingsService = {
  async get(key = 'primary', locale?: string | null): Promise<HomepageBannerMediaSetting> {
    if (!hasDatabase()) return DEFAULT_HOMEPAGE_BANNER_MEDIA_SETTING;

    try {
      const rows = await fetchHomepageBannerRows(key, locale);
      return rows[0] ? mapHomepageBannerMediaSetting(rows[0]) : DEFAULT_HOMEPAGE_BANNER_MEDIA_SETTING;
    } catch (error) {
      if (isMissingHomepageBannerMediaTableError(error)) return DEFAULT_HOMEPAGE_BANNER_MEDIA_SETTING;
      throw error;
    }
  },

  async update(input: HomepageBannerMediaSettingInput): Promise<HomepageBannerMediaSetting> {
    if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

    const normalized = normalizeHomepageBannerMediaSettingInput(input);
    try {
      const rows = await prisma.$queryRaw<HomepageBannerMediaSetting[]>`
        INSERT INTO "HomepageBannerMediaSetting" ("key", "locale", "eyebrow", "title", "subtitle", "mediaId", "imageUrl", "imageAlt", "ctaLabel", "ctaHref", "isActive", "sortOrder")
        VALUES (${normalized.key}, ${normalized.locale}, ${normalized.eyebrow}, ${normalized.title}, ${normalized.subtitle}, ${normalized.mediaId}, ${normalized.imageUrl}, ${normalized.imageAlt}, ${normalized.ctaLabel}, ${normalized.ctaHref}, ${normalized.isActive}, ${normalized.sortOrder})
        ON CONFLICT ("key", COALESCE("locale", '')) DO UPDATE SET
          "eyebrow" = EXCLUDED."eyebrow",
          "title" = EXCLUDED."title",
          "subtitle" = EXCLUDED."subtitle",
          "mediaId" = EXCLUDED."mediaId",
          "imageUrl" = EXCLUDED."imageUrl",
          "imageAlt" = EXCLUDED."imageAlt",
          "ctaLabel" = EXCLUDED."ctaLabel",
          "ctaHref" = EXCLUDED."ctaHref",
          "isActive" = EXCLUDED."isActive",
          "sortOrder" = EXCLUDED."sortOrder",
          "updatedAt" = CURRENT_TIMESTAMP
        RETURNING "id", "key", "locale", "eyebrow", "title", "subtitle", "mediaId", "imageUrl", "imageAlt", "ctaLabel", "ctaHref", "isActive", "sortOrder", "updatedAt"
      `;
      const setting = mapHomepageBannerMediaSetting(rows[0]);

      await recordAdminAuditLog({
        action: 'settings.homepage_banner_media.update',
        entity: 'homepageBannerMediaSetting',
        entityId: setting.id,
        summary: `Updated homepage banner/media settings: ${setting.title}`,
        metadata: {
          key: setting.key,
          locale: setting.locale,
          mediaId: setting.mediaId,
          imageUrl: setting.imageUrl,
          isActive: setting.isActive
        }
      });

      return setting;
    } catch (error) {
      if (isMissingHomepageBannerMediaTableError(error)) throw new Error('Homepage banner media settings table is not available in this database.');
      throw error;
    }
  }
};
