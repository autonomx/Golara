import 'server-only';

import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import {
  createCmsHomepageService,
  type CmsHomepageSectionRecord,
  type CmsHomepageTranslationRecord,
  type HomepageSectionUpsertArgs,
  type HomepageTranslationUpsertArgs
} from '@/lib/cms/homepage-service-core';
import { prisma } from '@/lib/prisma';
import { seedHomepageContent } from '@/lib/seed-data';

export { createCmsHomepageService } from '@/lib/cms/homepage-service-core';

const sectionRepository = {
  async upsert(args: HomepageSectionUpsertArgs): Promise<CmsHomepageSectionRecord> {
    return prisma.homepageSection.upsert(args);
  }
};

const translationRepository = {
  async upsert(args: HomepageTranslationUpsertArgs): Promise<CmsHomepageTranslationRecord> {
    return prisma.homepageSectionTranslation.upsert(args);
  }
};

export const cmsHomepageService = createCmsHomepageService({
  sectionRepository,
  translationRepository,
  auditWriter: recordAdminAuditLog,
  seedHomepageContent
});
