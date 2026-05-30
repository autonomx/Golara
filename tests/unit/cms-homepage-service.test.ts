import assert from 'node:assert/strict';
import { createCmsHomepageService, type CmsHomepageSectionRecord, type CmsHomepageTranslationRecord, type HomepagePayload } from '../../lib/cms/homepage-service-core';

type AuditRecord = {
  action: string;
  entity: string;
  entityId: string;
  summary: string;
  metadata?: unknown;
};

const seedPayload: HomepagePayload = {
  eyebrow: 'Seed eyebrow',
  title: 'Seed title',
  body: 'Seed body',
  primaryCtaLabel: 'Shop',
  primaryCtaHref: '/products',
  secondaryCtaLabel: 'Contact',
  secondaryCtaHref: '/contact',
  panelEyebrow: 'Seed panel eyebrow',
  panelTitle: 'Seed panel title',
  panelBody: 'Seed panel body'
};

const updatePayload: HomepagePayload = {
  eyebrow: 'Fresh flowers',
  title: 'Golara homepage',
  body: 'Premium arrangements for delivery.',
  primaryCtaLabel: 'Browse flowers',
  primaryCtaHref: '/products',
  secondaryCtaLabel: 'Request quote',
  secondaryCtaHref: '/contact',
  panelEyebrow: 'Same day',
  panelTitle: 'Designed locally',
  panelBody: 'Handmade arrangements in Vancouver.'
};

export async function runCmsHomepageServiceTests() {
  const audits: AuditRecord[] = [];
  const sectionUpserts: unknown[] = [];
  const translationUpserts: unknown[] = [];

  const service = createCmsHomepageService({
    sectionRepository: {
      async upsert(args) {
        sectionUpserts.push(args);
        return {
          id: 'section-1',
          key: args.create.key
        } satisfies CmsHomepageSectionRecord;
      }
    },
    translationRepository: {
      async upsert(args) {
        translationUpserts.push(args);
        return {
          id: `translation-${translationUpserts.length}`,
          isPublished: args.create.isPublished
        } satisfies CmsHomepageTranslationRecord;
      }
    },
    async auditWriter(input) {
      audits.push(input);
    },
    seedHomepageContent: seedPayload
  });

  const section = await service.updateDefault({ payload: updatePayload });
  assert.equal(section.id, 'section-1');
  assert.deepEqual(sectionUpserts[0], {
    where: { key: 'home.hero' },
    create: {
      key: 'home.hero',
      title: 'Seed title',
      subtitle: 'Seed eyebrow',
      body: 'Seed body',
      payload: seedPayload,
      isActive: true,
      sortOrder: 0
    },
    update: {}
  });
  assert.deepEqual(translationUpserts[0], {
    where: { sectionId_locale: { sectionId: 'section-1', locale: 'fa-IR' } },
    create: {
      sectionId: 'section-1',
      locale: 'fa-IR',
      title: 'Golara homepage',
      subtitle: 'Fresh flowers',
      body: 'Premium arrangements for delivery.',
      payload: updatePayload,
      isPublished: true
    },
    update: {
      title: 'Golara homepage',
      subtitle: 'Fresh flowers',
      body: 'Premium arrangements for delivery.',
      payload: updatePayload,
      isPublished: true
    }
  });
  assert.deepEqual(audits[0], {
    action: 'homepage.update',
    entity: 'homepageSection',
    entityId: 'section-1',
    summary: 'Updated homepage hero content',
    metadata: { key: 'home.hero', locale: 'fa-IR', title: 'Golara homepage' }
  });

  const translation = await service.upsertTranslation({ locale: 'en-CA', payload: updatePayload, isPublished: false });
  assert.equal(translation.id, 'translation-2');
  assert.deepEqual(translationUpserts[1], {
    where: { sectionId_locale: { sectionId: 'section-1', locale: 'en-CA' } },
    create: {
      sectionId: 'section-1',
      locale: 'en-CA',
      title: 'Golara homepage',
      subtitle: 'Fresh flowers',
      body: 'Premium arrangements for delivery.',
      payload: updatePayload,
      isPublished: false
    },
    update: {
      title: 'Golara homepage',
      subtitle: 'Fresh flowers',
      body: 'Premium arrangements for delivery.',
      payload: updatePayload,
      isPublished: false
    }
  });
  assert.deepEqual(audits[1], {
    action: 'homepage.translation.upsert',
    entity: 'homepageSection',
    entityId: 'section-1',
    summary: 'Saved homepage translation: en-CA',
    metadata: { locale: 'en-CA', translationId: 'translation-2', isPublished: false }
  });

  console.log('cms-homepage-service.test.ts passed');
}
