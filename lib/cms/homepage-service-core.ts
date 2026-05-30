import type { Prisma } from '@prisma/client';

type HomepageAuditInput = {
  action: string;
  entity: string;
  entityId: string;
  summary: string;
  metadata?: Prisma.InputJsonValue;
};

export type HomepageAuditWriter = (input: HomepageAuditInput) => Promise<unknown>;

export type HomepagePayload = {
  eyebrow: string;
  title: string;
  body: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  panelEyebrow: string;
  panelTitle: string;
  panelBody: string;
};

export type CmsHomepageSectionRecord = {
  id: string;
  key: string;
};

export type CmsHomepageTranslationRecord = {
  id: string;
  isPublished: boolean;
};

export type HomepageSectionUpsertArgs = {
  where: { key: string };
  create: {
    key: string;
    title: string;
    subtitle: string;
    body: string;
    payload: Prisma.InputJsonValue;
    isActive: boolean;
    sortOrder: number;
  };
  update: Record<string, never>;
};

export type HomepageTranslationUpsertArgs = {
  where: { sectionId_locale: { sectionId: string; locale: string } };
  create: {
    sectionId: string;
    locale: string;
    title: string;
    subtitle: string;
    body: string;
    payload: Prisma.InputJsonValue;
    isPublished: boolean;
  };
  update: {
    title: string;
    subtitle: string;
    body: string;
    payload: Prisma.InputJsonValue;
    isPublished: boolean;
  };
};

type HomepageSectionRepository = {
  upsert(args: HomepageSectionUpsertArgs): Promise<CmsHomepageSectionRecord>;
};

type HomepageTranslationRepository = {
  upsert(args: HomepageTranslationUpsertArgs): Promise<CmsHomepageTranslationRecord>;
};

export type CmsHomepageServiceDeps = {
  sectionRepository: HomepageSectionRepository;
  translationRepository: HomepageTranslationRepository;
  auditWriter: HomepageAuditWriter;
  seedHomepageContent: HomepagePayload;
};

function translationPayload(sectionId: string, locale: string, payload: HomepagePayload, isPublished: boolean) {
  return {
    sectionId,
    locale,
    title: payload.title,
    subtitle: payload.eyebrow,
    body: payload.body,
    payload,
    isPublished
  };
}

export function createCmsHomepageService(deps: CmsHomepageServiceDeps) {
  async function ensureHomepageSection() {
    return deps.sectionRepository.upsert({
      where: { key: 'home.hero' },
      create: {
        key: 'home.hero',
        title: deps.seedHomepageContent.title,
        subtitle: deps.seedHomepageContent.eyebrow,
        body: deps.seedHomepageContent.body,
        payload: deps.seedHomepageContent,
        isActive: true,
        sortOrder: 0
      },
      update: {}
    });
  }

  return {
    ensureHomepageSection,

    async updateDefault(input: { payload: HomepagePayload }) {
      const section = await ensureHomepageSection();
      await deps.translationRepository.upsert({
        where: { sectionId_locale: { sectionId: section.id, locale: 'fa-IR' } },
        create: translationPayload(section.id, 'fa-IR', input.payload, true),
        update: {
          title: input.payload.title,
          subtitle: input.payload.eyebrow,
          body: input.payload.body,
          payload: input.payload,
          isPublished: true
        }
      });

      await deps.auditWriter({
        action: 'homepage.update',
        entity: 'homepageSection',
        entityId: section.id,
        summary: 'Updated homepage hero content',
        metadata: { key: section.key, locale: 'fa-IR', title: input.payload.title }
      });

      return section;
    },

    async upsertTranslation(input: { locale: string; payload: HomepagePayload; isPublished: boolean }) {
      const section = await ensureHomepageSection();
      const translation = await deps.translationRepository.upsert({
        where: { sectionId_locale: { sectionId: section.id, locale: input.locale } },
        create: translationPayload(section.id, input.locale, input.payload, input.isPublished),
        update: {
          title: input.payload.title,
          subtitle: input.payload.eyebrow,
          body: input.payload.body,
          payload: input.payload,
          isPublished: input.isPublished
        }
      });

      await deps.auditWriter({
        action: 'homepage.translation.upsert',
        entity: 'homepageSection',
        entityId: section.id,
        summary: `Saved homepage translation: ${input.locale}`,
        metadata: { locale: input.locale, translationId: translation.id, isPublished: translation.isPublished }
      });

      return translation;
    }
  };
}
