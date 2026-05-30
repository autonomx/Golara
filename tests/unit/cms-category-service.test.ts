import assert from 'node:assert/strict';
import { createCmsCategoryService, type CmsCategoryRecord, type CmsCategoryTranslationRecord } from '../../lib/cms/category-service-core';

type AuditRecord = {
  action: string;
  entity: string;
  entityId: string;
  summary: string;
  metadata?: unknown;
};

const categoryInput = {
  title: 'Roses',
  slug: 'roses',
  eyebrow: 'Fresh stems',
  description: 'Premium rose arrangements.',
  imageUrl: 'https://cdn.example.test/roses.webp',
  parentId: null,
  showOnHomepage: true,
  sortOrder: 10,
  isActive: true
};

export async function runCmsCategoryServiceTests() {
  const audits: AuditRecord[] = [];
  const creates: unknown[] = [];
  const updates: unknown[] = [];
  const translationUpserts: unknown[] = [];

  const service = createCmsCategoryService({
    categoryRepository: {
      async create(args) {
        creates.push(args);
        return {
          id: 'category-1',
          title: args.data.title,
          slug: args.data.slug,
          isActive: args.data.isActive,
          parentId: args.data.parentId,
          showOnHomepage: args.data.showOnHomepage
        } satisfies CmsCategoryRecord;
      },
      async update(args) {
        updates.push(args);
        return {
          id: args.where.id,
          title: args.data.title,
          slug: args.data.slug,
          isActive: args.data.isActive,
          parentId: args.data.parentId,
          showOnHomepage: args.data.showOnHomepage
        } satisfies CmsCategoryRecord;
      }
    },
    categoryTranslationRepository: {
      async upsert(args) {
        translationUpserts.push(args);
        return {
          id: 'translation-1',
          isPublished: args.create.isPublished
        } satisfies CmsCategoryTranslationRecord;
      }
    },
    async auditWriter(input) {
      audits.push(input);
    }
  });

  const created = await service.create(categoryInput);
  assert.equal(created.id, 'category-1');
  assert.deepEqual(creates[0], { data: categoryInput });
  assert.deepEqual(audits[0], {
    action: 'category.create',
    entity: 'category',
    entityId: 'category-1',
    summary: 'Created category: Roses',
    metadata: { slug: 'roses', isActive: true, parentId: null, showOnHomepage: true }
  });

  const updatedInput = { ...categoryInput, title: 'Garden Roses', slug: 'garden-roses', parentId: 'parent-1', showOnHomepage: false };
  const updated = await service.update('category-1', updatedInput);
  assert.equal(updated.title, 'Garden Roses');
  assert.deepEqual(updates[0], { where: { id: 'category-1' }, data: updatedInput });
  assert.deepEqual(audits[1], {
    action: 'category.update',
    entity: 'category',
    entityId: 'category-1',
    summary: 'Updated category: Garden Roses',
    metadata: { slug: 'garden-roses', isActive: true, parentId: 'parent-1', showOnHomepage: false }
  });

  const translation = await service.upsertTranslation({
    categoryId: 'category-1',
    locale: 'fa-IR',
    title: 'رزها',
    eyebrow: 'شاخه‌های تازه',
    description: 'چیدمان رز ممتاز.',
    imageAlt: 'رزهای قرمز',
    isPublished: true
  });
  assert.equal(translation.id, 'translation-1');
  assert.deepEqual(translationUpserts[0], {
    where: { categoryId_locale: { categoryId: 'category-1', locale: 'fa-IR' } },
    create: {
      categoryId: 'category-1',
      locale: 'fa-IR',
      title: 'رزها',
      eyebrow: 'شاخه‌های تازه',
      description: 'چیدمان رز ممتاز.',
      imageAlt: 'رزهای قرمز',
      isPublished: true
    },
    update: {
      title: 'رزها',
      eyebrow: 'شاخه‌های تازه',
      description: 'چیدمان رز ممتاز.',
      imageAlt: 'رزهای قرمز',
      isPublished: true
    }
  });
  assert.deepEqual(audits[2], {
    action: 'category.translation.upsert',
    entity: 'category',
    entityId: 'category-1',
    summary: 'Saved category translation: fa-IR',
    metadata: { locale: 'fa-IR', translationId: 'translation-1', isPublished: true }
  });

  console.log('cms-category-service.test.ts passed');
}
