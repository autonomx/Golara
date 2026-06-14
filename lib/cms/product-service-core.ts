import type { CmsAuditWriter, CmsIdentifiedRecord, CmsPublishedRecord } from '@/lib/cms/service-types';

export type CmsProductRecord = CmsIdentifiedRecord & {
  title: string;
  slug: string;
  code: string;
  categoryId: string;
  productTypeId?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalPath?: string | null;
  seoIndex?: boolean;
  priceCents: number;
  isActive: boolean;
};

export type CmsProductTranslationRecord = CmsPublishedRecord;

export type ProductMutationInput = {
  title: string;
  slug: string;
  code: string;
  description: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalPath?: string | null;
  seoIndex?: boolean;
  priceCents: number;
  currency: string;
  imageUrl: string;
  categoryId: string;
  productTypeId?: string | null;
  availableToday: boolean;
  bestSeller: boolean;
  requiresQuote: boolean;
  isActive: boolean;
  sortOrder: number;
};

export type ProductTranslationInput = {
  productId: string;
  locale: string;
  title: string;
  description?: string;
  imageAlt?: string;
  isPublished: boolean;
};

export type ProductCreateArgs = { data: ProductMutationInput };
export type ProductUpdateArgs = { where: { id: string }; data: ProductMutationInput };
export type ProductTranslationUpsertArgs = {
  where: { productId_locale: { productId: string; locale: string } };
  create: ProductTranslationInput;
  update: Omit<ProductTranslationInput, 'productId' | 'locale'>;
};

type ProductRepository = {
  create(args: ProductCreateArgs): Promise<CmsProductRecord>;
  update(args: ProductUpdateArgs): Promise<CmsProductRecord>;
};

type ProductTranslationRepository = {
  upsert(args: ProductTranslationUpsertArgs): Promise<CmsProductTranslationRecord>;
};

export type CmsProductServiceDeps = {
  productRepository: ProductRepository;
  productTranslationRepository: ProductTranslationRepository;
  auditWriter: CmsAuditWriter;
  cacheInvalidator?: () => void;
};

export function createCmsProductService(deps: CmsProductServiceDeps) {
  return {
    async create(input: ProductMutationInput) {
      const product = await deps.productRepository.create({ data: input });

      await deps.auditWriter({
        action: 'product.create',
        entity: 'product',
        entityId: product.id,
        summary: `Created product: ${product.title}`,
        metadata: { slug: product.slug, code: product.code, categoryId: product.categoryId, priceCents: product.priceCents, isActive: product.isActive }
      });
      deps.cacheInvalidator?.();

      return product;
    },

    async update(productId: string, input: ProductMutationInput) {
      const product = await deps.productRepository.update({ where: { id: productId }, data: input });

      await deps.auditWriter({
        action: 'product.update',
        entity: 'product',
        entityId: product.id,
        summary: `Updated product: ${product.title}`,
        metadata: { slug: product.slug, code: product.code, categoryId: product.categoryId, priceCents: product.priceCents, isActive: product.isActive }
      });
      deps.cacheInvalidator?.();

      return product;
    },

    async upsertTranslation(input: ProductTranslationInput) {
      const translation = await deps.productTranslationRepository.upsert({
        where: { productId_locale: { productId: input.productId, locale: input.locale } },
        create: input,
        update: {
          title: input.title,
          description: input.description,
          imageAlt: input.imageAlt,
          isPublished: input.isPublished
        }
      });

      await deps.auditWriter({
        action: 'product.translation.upsert',
        entity: 'product',
        entityId: input.productId,
        summary: `Saved product translation: ${input.locale}`,
        metadata: { locale: input.locale, translationId: translation.id, isPublished: translation.isPublished }
      });
      deps.cacheInvalidator?.();

      return translation;
    }
  };
}
