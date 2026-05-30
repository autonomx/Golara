import 'server-only';

import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { createCmsMediaService, type CmsMediaRecord, type MediaCreateArgs, type MediaUpsertArgs } from '@/lib/cms/media-service-core';
import { normalizeImageUrl, storeMediaUpload } from '@/lib/media/media-storage';
import { prisma } from '@/lib/prisma';

export { createCmsMediaService } from '@/lib/cms/media-service-core';

const mediaRepository = {
  async upsert(args: MediaUpsertArgs): Promise<CmsMediaRecord> {
    return prisma.media.upsert(args);
  },
  async create(args: MediaCreateArgs): Promise<CmsMediaRecord> {
    return prisma.media.create(args);
  }
};

export const cmsMediaService = createCmsMediaService({
  mediaRepository,
  auditWriter: recordAdminAuditLog,
  normalizeUrl: normalizeImageUrl,
  uploadStore: storeMediaUpload
});
