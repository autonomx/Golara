import 'server-only';

import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import {
  createCmsProductService,
  type CmsProductRecord,
  type CmsProductTranslationRecord,
  type ProductCreateArgs,
  type ProductTranslationUpsertArgs,
  type ProductUpdateArgs
} from '@/lib/cms/product-service-core';
import { revalidateStorefrontCatalogCache } from '@/lib/cms/public-catalog-cache';
import { prisma } from '@/lib/prisma';

export { createCmsProductService } from '@/lib/cms/product-service-core';

const productRepository = {
  async create(args: ProductCreateArgs): Promise<CmsProductRecord> {
    return prisma.product.create(args);
  },
  async update(args: ProductUpdateArgs): Promise<CmsProductRecord> {
    return prisma.product.update(args);
  }
};

const productTranslationRepository = {
  async upsert(args: ProductTranslationUpsertArgs): Promise<CmsProductTranslationRecord> {
    return prisma.productTranslation.upsert(args);
  }
};

export const cmsProductService = createCmsProductService({
  productRepository,
  productTranslationRepository,
  auditWriter: recordAdminAuditLog,
  cacheInvalidator: revalidateStorefrontCatalogCache
});
