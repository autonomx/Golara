import 'server-only';

import type { Prisma } from '@prisma/client';
import type { HomepageTranslation } from '@/lib/catalog';
import { readWithSeedFallback } from '@/lib/cms/repository-fallback-policy';
import { prisma } from '@/lib/prisma';

function payloadObject(value: Prisma.JsonValue | null): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  );
}

export async function listHomepageTranslations(): Promise<HomepageTranslation[]> {
  return readWithSeedFallback(async () => {
    const section = await prisma.homepageSection.findUnique({
      where: { key: 'home.hero' },
      include: { translations: true }
    });
    if (!section) return [];

    return section.translations.map((translation) => {
      const payload = payloadObject(translation.payload);
      return {
        locale: translation.locale,
        eyebrow: translation.subtitle ?? payload.eyebrow,
        title: translation.title ?? payload.title,
        body: translation.body ?? payload.body,
        primaryCtaLabel: payload.primaryCtaLabel,
        primaryCtaHref: payload.primaryCtaHref,
        secondaryCtaLabel: payload.secondaryCtaLabel,
        secondaryCtaHref: payload.secondaryCtaHref,
        panelEyebrow: payload.panelEyebrow,
        panelTitle: payload.panelTitle,
        panelBody: payload.panelBody,
        isPublished: translation.isPublished,
        updatedAt: translation.updatedAt
      };
    });
  }, () => [], 'homepage translation read');
}
