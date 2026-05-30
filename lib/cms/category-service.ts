import 'server-only';

import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import {
  createCmsCategoryService,
  type CategoryCreateArgs,
  type CategoryTranslationUpsertArgs,
  type CategoryUpdateArgs,
  type CmsCategoryRecord,
  type CmsCategoryTranslationRecord
} from '@/lib/cms/category-service-core';
import { prisma } from '@/lib/prisma';

export { createCmsCategoryService } from '@/lib/cms/category-service-core';

const categoryRepository = {
  async create(args: CategoryCreateArgs): Promise<CmsCategoryRecord> {
    return prisma.category.create(args);
  },
  async update(args: CategoryUpdateArgs): Promise<CmsCategoryRecord> {
    return prisma.category.update(args);
  }
};

const categoryTranslationRepository = {
  async upsert(args: CategoryTranslationUpsertArgs): Promise<CmsCategoryTranslationRecord> {
    return prisma.categoryTranslation.upsert(args);
  }
};

export const cmsCategoryService = createCmsCategoryService({
  categoryRepository,
  categoryTranslationRepository,
  auditWriter: recordAdminAuditLog
});
