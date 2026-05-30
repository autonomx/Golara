import 'server-only';

import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { createCmsMediaService } from '@/lib/cms/media-service-core';
import { normalizeImageUrl, storeMediaUpload } from '@/lib/media/media-storage';
import { prisma } from '@/lib/prisma';

export { createCmsMediaService } from '@/lib/cms/media-service-core';

export const cmsMediaService = createCmsMediaService({
  mediaRepository: prisma.media,
  auditWriter: recordAdminAuditLog,
  normalizeUrl: normalizeImageUrl,
  uploadStore: storeMediaUpload
});
