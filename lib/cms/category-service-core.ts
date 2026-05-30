import type { CmsAuditWriter, CmsIdentifiedRecord, CmsPublishedRecord } from '@/lib/cms/service-types';

export type CmsCategoryRecord = CmsIdentifiedRecord & {
  title: string;
  slug: string;
  isActive: boolean;
  parentId: string | null;
  showOnHomepage: boolean;
};

export type CmsCategoryTranslationRecord = CmsPublishedRecord;

export type CategoryMutationInput = {
  title: string;
  slug: string;
  eyebrow: string;
  description: string;
  imageUrl: string | null;
  parentId: string | null;
  showOnHomepage: boolean;
  sortOrder: number;
  isActive: boolean;
};

export type CategoryTranslationInput = {
  categoryId: string;
  locale: string;
  title: string;
  eyebrow?: string;
  description?: string;
  imageAlt?: string;
  isPublished: boolean;
};

export type CategoryCreateArgs = { data: CategoryMutationInput };
export type CategoryUpdateArgs = { where: { id: string }; data: CategoryMutationInput };
export type CategoryTranslationUpsertArgs = {
  where: { categoryId_locale: { categoryId: string; locale: string } };
  create: CategoryTranslationInput;
  update: Omit<CategoryTranslationInput, 'categoryId' | 'locale'>;
};

type CategoryRepository = {
  create(args: CategoryCreateArgs): Promise<CmsCategoryRecord>;
  update(args: CategoryUpdateArgs): Promise<CmsCategoryRecord>;
};

type CategoryTranslationRepository = {
  upsert(args: CategoryTranslationUpsertArgs): Promise<CmsCategoryTranslationRecord>;
};

export type CmsCategoryServiceDeps = {
  categoryRepository: CategoryRepository;
  categoryTranslationRepository: CategoryTranslationRepository;
  auditWriter: CmsAuditWriter;
};

export function createCmsCategoryService(deps: CmsCategoryServiceDeps) {
  return {
    async create(input: CategoryMutationInput) {
      const category = await deps.categoryRepository.create({ data: input });

      await deps.auditWriter({
        action: 'category.create',
        entity: 'category',
        entityId: category.id,
        summary: `Created category: ${category.title}`,
        metadata: { slug: category.slug, isActive: category.isActive, parentId: category.parentId, showOnHomepage: category.showOnHomepage }
      });

      return category;
    },

    async update(categoryId: string, input: CategoryMutationInput) {
      const category = await deps.categoryRepository.update({ where: { id: categoryId }, data: input });

      await deps.auditWriter({
        action: 'category.update',
        entity: 'category',
        entityId: category.id,
        summary: `Updated category: ${category.title}`,
        metadata: { slug: category.slug, isActive: category.isActive, parentId: category.parentId, showOnHomepage: category.showOnHomepage }
      });

      return category;
    },

    async upsertTranslation(input: CategoryTranslationInput) {
      const translation = await deps.categoryTranslationRepository.upsert({
        where: { categoryId_locale: { categoryId: input.categoryId, locale: input.locale } },
        create: input,
        update: {
          title: input.title,
          eyebrow: input.eyebrow,
          description: input.description,
          imageAlt: input.imageAlt,
          isPublished: input.isPublished
        }
      });

      await deps.auditWriter({
        action: 'category.translation.upsert',
        entity: 'category',
        entityId: input.categoryId,
        summary: `Saved category translation: ${input.locale}`,
        metadata: { locale: input.locale, translationId: translation.id, isPublished: translation.isPublished }
      });

      return translation;
    }
  };
}
